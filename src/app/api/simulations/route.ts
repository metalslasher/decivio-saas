import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildStoredSummaryMetrics, generateCareerSwitchAnalysis } from "@/lib/career-switch-analysis";
import { parseCareerSwitchFormPayload, type CareerSwitchFormInput } from "@/lib/career-switch-form";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { claimGuestSimulationsForUser } from "@/lib/guest-simulation-transfer";
import { GUEST_USER_COOKIE_MAX_AGE, GUEST_USER_COOKIE_NAME } from "@/lib/guest-session";
import { resolveGuestSessionIdentity } from "@/lib/guest-session-server";
import { buildOnboardingProfileContext, mergeProfileContext, parseProfileContext } from "@/lib/profile-context";
import { getAuthenticatedUserIdFromRequest } from "@/lib/request-auth";
import { consumeRateLimit } from "@/lib/request-rate-limit";
import { isLocalTestModeEnabled } from "@/lib/test-mode";

const SIMULATION_RATE_LIMIT = {
  limit: 5,
  windowSeconds: 10 * 60
} as const;

function buildRateLimitSubjectHint({
  userId,
  guestSessionId
}: {
  userId: string | null;
  guestSessionId: string | null;
}) {
  if (userId?.trim()) {
    return `user:${userId.trim()}`;
  }

  if (guestSessionId?.trim()) {
    return `guest:${guestSessionId.trim()}`;
  }

  return "anonymous";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function supabaseUnavailableErrorMessage(error: unknown, fallback: string) {
  const maybeError = error as { message?: string; name?: string; status?: number } | null;
  const message = typeof maybeError?.message === "string" && maybeError.message.trim() !== "" ? maybeError.message : fallback;
  const normalized = message.toLowerCase();

  if (
    normalized.includes("fetch failed") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("econnrefused") ||
    normalized.includes("getaddrinfo") ||
    maybeError?.name === "AuthRetryableFetchError" ||
    maybeError?.status === 0
  ) {
    return "Не вдалося підключитися до локального Supabase. Перевірте, що Docker запущений, а `npx supabase start` завершився без помилок.";
  }

  return message;
}

function getMissingServerEnv() {
  const required = isLocalTestModeEnabled()
    ? (["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const)
    : (["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY"] as const);
  return required.filter((name) => {
    const value = process.env[name];
    return typeof value !== "string" || value.trim() === "";
  });
}

function isMissingStatusColumn(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("status") && (normalized.includes("column") || normalized.includes("schema cache"));
}

function isMissingGuestSessionSchema(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("guest_session") || normalized.includes("guest_sessions") || normalized.includes("consume_rate_limit");
}

function analysisUnavailableErrorMessage(error: unknown) {
  const message = supabaseUnavailableErrorMessage(error, "Не вдалося отримати персональний висновок.");
  const normalized = message.toLowerCase();

  if (normalized.includes("json") || normalized.includes("валідний")) {
    return "Сервіс аналізу тимчасово недоступний. Спробуйте повторити запит трохи пізніше.";
  }

  if (normalized.includes("openai") || normalized.includes("api key")) {
    return "Сервіс аналізу тимчасово недоступний. Спробуйте повторити запит трохи пізніше.";
  }

  return message;
}

function ownerColumns(owner: { userId: string | null; guestSessionId: string | null }) {
  return {
    user_id: owner.userId,
    guest_session_id: owner.guestSessionId
  };
}

async function syncProfileContextFromSimulation(
  supabase: SupabaseClient,
  userId: string,
  payload: CareerSwitchFormInput
) {
  try {
    const { data: profileRow, error: profileError } = await supabase.from("profiles").select("profile_context").eq("id", userId).maybeSingle();

    if (profileError) {
      return;
    }

    const nextProfileContext = mergeProfileContext(parseProfileContext(profileRow?.profile_context), buildOnboardingProfileContext(payload));

    await supabase.from("profiles").update({ profile_context: nextProfileContext }).eq("id", userId);
  } catch {
    // Profile sync is secondary: simulation flow should still complete if this fails.
  }
}

async function applySimulationRateLimit(
  supabase: SupabaseClient,
  request: Request,
  subjectHint: string
) {
  if (isLocalTestModeEnabled()) {
    return {
      allowed: true,
      remaining: SIMULATION_RATE_LIMIT.limit,
      retryAfterSeconds: 0
    };
  }

  try {
    return await consumeRateLimit(supabase, {
      route: "/api/simulations",
      subjectHint,
      headers: request.headers,
      limit: SIMULATION_RATE_LIMIT.limit,
      windowSeconds: SIMULATION_RATE_LIMIT.windowSeconds
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";

    if (isMissingGuestSessionSchema(message)) {
      throw new Error("Для захисту від зловживань потрібні нові міграції Supabase. Застосуйте останні міграції бази даних.");
    }

    throw error;
  }
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;

  try {
    const rawPayload = (await request.json()) as unknown;
    if (!isRecord(rawPayload)) {
      return NextResponse.json({ error: "Некоректний формат запиту." }, { status: 400 });
    }
    payload = rawPayload;
  } catch {
    return NextResponse.json({ error: "Некоректний формат запиту." }, { status: 400 });
  }

  const parsed = parseCareerSwitchFormPayload(payload);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const missingServerEnv = getMissingServerEnv();
  if (missingServerEnv.length > 0) {
    return NextResponse.json(
      {
        error: `Сервер не налаштовано. Відсутні env змінні: ${missingServerEnv.join(", ")}.`
      },
      { status: 500 }
    );
  }

  let supabase: SupabaseClient;
  try {
    supabase = getSupabaseServiceRoleClient();
  } catch (error) {
    const details = error instanceof Error ? error.message : "unknown";
    return NextResponse.json(
      {
        error: `Сервер Supabase не налаштовано. ${details}.`
      },
      { status: 500 }
    );
  }

  const cookieStore = await cookies();
  const existingGuestId = cookieStore.get(GUEST_USER_COOKIE_NAME)?.value ?? null;

  let authenticatedUserId: string | null = null;
  try {
    authenticatedUserId = await getAuthenticatedUserIdFromRequest(supabase, request);
  } catch (error) {
    return NextResponse.json(
      {
        error: supabaseUnavailableErrorMessage(error, "Не вдалося підтвердити авторизовану сесію.")
      },
      { status: 401 }
    );
  }

  let rateLimit;
  try {
    rateLimit = await applySimulationRateLimit(
      supabase,
      request,
      buildRateLimitSubjectHint({
        userId: authenticatedUserId,
        guestSessionId: existingGuestId
      })
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: supabaseUnavailableErrorMessage(error, "Не вдалося застосувати захист від надмірних запитів.")
      },
      { status: 500 }
    );
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Забагато спроб за короткий час. Зачекайте кілька хвилин і повторіть запит."
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds)
        }
      }
    );
  }

  let shouldClearGuestCookie = false;
  let createdGuestSession = false;
  let simulationOwner: { userId: string | null; guestSessionId: string | null };

  if (authenticatedUserId) {
    if (existingGuestId) {
      try {
        await claimGuestSimulationsForUser(supabase, authenticatedUserId, existingGuestId);
        shouldClearGuestCookie = true;
      } catch {
        shouldClearGuestCookie = false;
      }
    }

    simulationOwner = {
      userId: authenticatedUserId,
      guestSessionId: null
    };
  } else {
    let guestIdentity;

    try {
      guestIdentity = await resolveGuestSessionIdentity(supabase, existingGuestId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не вдалося підготувати guest session.";
      return NextResponse.json(
        {
          error: isMissingGuestSessionSchema(message)
            ? "Guest session не налаштовано. Застосуйте останні міграції Supabase."
            : supabaseUnavailableErrorMessage(error, "Не вдалося підготувати guest session.")
        },
        { status: 500 }
      );
    }

    simulationOwner =
      guestIdentity.kind === "guest_session"
        ? { userId: null, guestSessionId: guestIdentity.id }
        : { userId: guestIdentity.id, guestSessionId: null };
    createdGuestSession = guestIdentity.kind === "guest_session" && guestIdentity.isNew;
  }

  let analysisResult;
  try {
    analysisResult = await generateCareerSwitchAnalysis({
      country: "UA",
      current_income: parsed.value.current_income,
      current_market: parsed.value.current_market,
      current_role_text: parsed.value.current_role,
      years_in_current_role: parsed.value.current_experience_years,
      seniority_level: parsed.value.seniority_level,
      desired_income: parsed.value.desired_income,
      target_role_text: parsed.value.target_role,
      upgrade_goal: parsed.value.upgrade_goal,
      target_experience_level: parsed.value.experience_level,
      english_level: parsed.value.english_level,
      target_market: parsed.value.target_market,
      transition_priority: parsed.value.transition_priority,
      job_search_status: parsed.value.job_search_status,
      resume_status: parsed.value.resume_status
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: analysisUnavailableErrorMessage(error)
      },
      { status: 503 }
    );
  }

  const simulationInputsForStorage = {
    ...parsed.value,
    country: "UA"
  };
  const simulationOwnerColumns = ownerColumns(simulationOwner);

  const { data: simulation, error: simulationError } = await supabase
    .from("simulations")
    .insert({
      ...simulationOwnerColumns,
      scenario_type: "career_switch",
      status: "pending",
      inputs: simulationInputsForStorage
    })
    .select("id, status")
    .single();

  if (simulationError) {
    if (isMissingStatusColumn(simulationError.message)) {
      return NextResponse.json(
        {
          error: "У таблиці simulations відсутня колонка status. Застосуйте останні міграції бази даних."
        },
        { status: 500 }
      );
    }

    if (isMissingGuestSessionSchema(simulationError.message)) {
      return NextResponse.json(
        {
          error: "Схема simulations не оновлена під guest session. Застосуйте останні міграції бази даних."
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: `Не вдалося зберегти симуляцію: ${simulationError.message}` }, { status: 500 });
  }

  const { error: resultInsertError } = await supabase.from("simulation_results").insert({
    simulation_id: simulation.id,
    ...simulationOwnerColumns,
    summary_metrics: buildStoredSummaryMetrics(analysisResult.analysis),
    series: {},
    ai_summary: {
      analysis: analysisResult.analysis,
      meta: analysisResult.meta
    }
  });

  if (resultInsertError) {
    await supabase.from("simulations").update({ status: "failed" }).eq("id", simulation.id);
    return NextResponse.json(
      {
        error: `Не вдалося зберегти результат симуляції: ${resultInsertError.message}`
      },
      { status: 500 }
    );
  }

  const { error: simulationStatusError } = await supabase
    .from("simulations")
    .update({ status: "completed" })
    .eq("id", simulation.id);

  if (simulationStatusError) {
    return NextResponse.json(
      {
        error: `Результат збережено, але не вдалося оновити статус симуляції: ${simulationStatusError.message}`
      },
      { status: 500 }
    );
  }

  if (authenticatedUserId) {
    await syncProfileContextFromSimulation(supabase, authenticatedUserId, parsed.value);
  }

  const response = NextResponse.json(
    {
      simulationId: simulation.id,
      status: "completed",
      redirectTo: "/results",
      createdGuestSession
    },
    { status: 201 }
  );

  if (simulationOwner.guestSessionId) {
    response.cookies.set({
      name: GUEST_USER_COOKIE_NAME,
      value: simulationOwner.guestSessionId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: GUEST_USER_COOKIE_MAX_AGE
    });
  } else if (shouldClearGuestCookie && existingGuestId) {
    response.cookies.delete(GUEST_USER_COOKIE_NAME);
  }

  return response;
}
