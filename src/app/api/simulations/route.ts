import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildStoredSummaryMetrics, generateCareerSwitchAnalysis } from "@/lib/career-switch-analysis";
import { parseCareerSwitchFormPayload } from "@/lib/career-switch-form";
import { getSupabaseAdminClient } from "@/lib/db/supabase";
import { GUEST_USER_COOKIE_MAX_AGE, GUEST_USER_COOKIE_NAME } from "@/lib/guest-session";
import { resolveGuestSessionIdentity } from "@/lib/guest-session-server";
import { consumeRateLimit } from "@/lib/request-rate-limit";

const SIMULATION_RATE_LIMIT = {
  limit: 5,
  windowSeconds: 10 * 60
} as const;

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
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY"] as const;
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

function ownerColumns(identity: Awaited<ReturnType<typeof resolveGuestSessionIdentity>>) {
  return identity.kind === "guest_session"
    ? { user_id: null, guest_session_id: identity.id }
    : { user_id: identity.id, guest_session_id: null };
}

async function applySimulationRateLimit(supabase: SupabaseClient, request: Request, existingGuestId: string | null) {
  try {
    return await consumeRateLimit(supabase, {
      route: "/api/simulations",
      subjectHint: existingGuestId?.trim() || "anonymous",
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
    supabase = getSupabaseAdminClient();
  } catch (error) {
    const details = error instanceof Error ? error.message : "unknown";
    return NextResponse.json(
      {
        error: `Сервер Supabase не налаштовано. ${details}.`
      },
      { status: 500 }
    );
  }

  const cookieStore = cookies();
  const existingGuestId = cookieStore.get(GUEST_USER_COOKIE_NAME)?.value ?? null;

  let rateLimit;
  try {
    rateLimit = await applySimulationRateLimit(supabase, request, existingGuestId);
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

  let analysisResult;
  try {
    analysisResult = await generateCareerSwitchAnalysis({
      country: "UA",
      current_income: parsed.value.current_income,
      current_role_text: parsed.value.current_role,
      years_in_current_role: parsed.value.current_experience_years,
      target_role_text: parsed.value.target_role,
      target_experience_level: parsed.value.experience_level,
      english_level: parsed.value.english_level,
      target_market: parsed.value.target_market,
      transition_priority: parsed.value.transition_priority
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
  const simulationOwner = ownerColumns(guestIdentity);

  const { data: simulation, error: simulationError } = await supabase
    .from("simulations")
    .insert({
      ...simulationOwner,
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
    ...simulationOwner,
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

  const response = NextResponse.json(
    {
      simulationId: simulation.id,
      status: "completed",
      redirectTo: "/results",
      createdGuestSession: guestIdentity.kind === "guest_session" && guestIdentity.isNew
    },
    { status: 201 }
  );

  response.cookies.set({
    name: GUEST_USER_COOKIE_NAME,
    value: guestIdentity.id,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_USER_COOKIE_MAX_AGE
  });

  return response;
}
