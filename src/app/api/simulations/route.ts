import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  buildStoredSummaryMetrics,
  generateCareerSwitchAnalysis,
  type EnglishLevel,
  type ExperienceLevel,
  type TargetMarket,
  type TransitionPriority
} from "@/lib/career-switch-analysis";
import { getSupabaseAdminClient } from "@/lib/db/supabase";
import { GUEST_USER_COOKIE_MAX_AGE, GUEST_USER_COOKIE_NAME } from "@/lib/guest-session";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const experienceLevelValues = new Set<ExperienceLevel>(["none", "basic", "practical"]);
const englishLevelValues = new Set<EnglishLevel>(["basic", "intermediate", "upper_intermediate", "advanced"]);
const targetMarketValues = new Set<TargetMarket>(["ukraine", "remote", "abroad"]);
const transitionPriorityValues = new Set<TransitionPriority>(["speed", "income"]);

type OnboardingPayload = {
  current_income?: unknown;
  current_role?: unknown;
  current_experience_years?: unknown;
  target_role?: unknown;
  experience_level?: unknown;
  english_level?: unknown;
  target_market?: unknown;
  transition_priority?: unknown;
};

type ParsedInputs = {
  current_income: number;
  current_role: string;
  current_experience_years: number;
  target_role: string;
  experience_level: ExperienceLevel;
  english_level: EnglishLevel;
  target_market: TargetMarket;
  transition_priority: TransitionPriority;
};

type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

function parseNonNegativeNumber(value: unknown, fieldLabel: string): ParseResult<number> {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { ok: false, error: `${fieldLabel}: введіть коректне число.` };
  }

  if (value < 0) {
    return { ok: false, error: `${fieldLabel}: значення не може бути меншим за 0.` };
  }

  return { ok: true, value };
}

function parseRequiredString(value: unknown, fieldLabel: string): ParseResult<string> {
  if (typeof value !== "string" || value.trim() === "") {
    return { ok: false, error: `${fieldLabel}: поле обов'язкове.` };
  }

  return { ok: true, value: value.trim() };
}

function isKnownValue<T extends string>(value: unknown, allowed: ReadonlySet<T>): value is T {
  return typeof value === "string" && allowed.has(value as T);
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

async function resolveGuestUserId(supabase: SupabaseClient, existingGuestUserId: string | null) {
  if (typeof existingGuestUserId === "string" && uuidPattern.test(existingGuestUserId)) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", existingGuestUserId)
      .maybeSingle();

    if (error) {
      return { error: supabaseUnavailableErrorMessage(error, "Не вдалося перевірити існуючий профіль користувача."), status: 500 } as const;
    }

    if (profile?.id) {
      return { userId: profile.id, isNew: false } as const;
    }
  }

  const generatedEmail = `guest+${randomUUID()}@decivio.local`;
  const generatedPassword = `${randomUUID()}Aa!9`;

  const { data, error } = await supabase.auth.admin.createUser({
    email: generatedEmail,
    password: generatedPassword,
    email_confirm: true,
    user_metadata: {
      source: "simulate_onboarding"
    }
  });

  if (error) {
    return { error: supabaseUnavailableErrorMessage(error, "Не вдалося створити тимчасовий профіль користувача."), status: 500 } as const;
  }

  if (!data.user?.id) {
    return { error: "Не вдалося визначити ID створеного користувача.", status: 500 } as const;
  }

  return { userId: data.user.id, isNew: true } as const;
}

function parseInputs(payload: OnboardingPayload) {
  const currentIncome = parseNonNegativeNumber(payload.current_income, "Поточний чистий дохід");
  if (!currentIncome.ok) {
    return { error: currentIncome.error } as const;
  }

  const currentRole = parseRequiredString(payload.current_role, "Поточна роль");
  if (!currentRole.ok) {
    return { error: currentRole.error } as const;
  }

  const currentExperienceYears = parseNonNegativeNumber(payload.current_experience_years, "Стаж у поточній сфері");
  if (!currentExperienceYears.ok) {
    return { error: currentExperienceYears.error } as const;
  }

  const targetRole = parseRequiredString(payload.target_role, "Цільова роль");
  if (!targetRole.ok) {
    return { error: targetRole.error } as const;
  }

  if (currentRole.value === targetRole.value) {
    return { error: "Цільова роль має відрізнятись від поточної." } as const;
  }

  if (!isKnownValue(payload.experience_level, experienceLevelValues)) {
    return { error: "Релевантний досвід: оберіть один із варіантів." } as const;
  }

  if (!isKnownValue(payload.english_level, englishLevelValues)) {
    return { error: "Англійська: оберіть один із варіантів." } as const;
  }

  if (!isKnownValue(payload.target_market, targetMarketValues)) {
    return { error: "Цільовий ринок: оберіть один із варіантів." } as const;
  }

  if (!isKnownValue(payload.transition_priority, transitionPriorityValues)) {
    return { error: "Пріоритет переходу: оберіть один із варіантів." } as const;
  }

  const parsedInputs: ParsedInputs = {
    current_income: currentIncome.value,
    current_role: currentRole.value,
    current_experience_years: currentExperienceYears.value,
    target_role: targetRole.value,
    experience_level: payload.experience_level,
    english_level: payload.english_level,
    target_market: payload.target_market,
    transition_priority: payload.transition_priority
  };

  return { inputs: parsedInputs } as const;
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

export async function POST(request: Request) {
  let payload: OnboardingPayload;

  try {
    payload = (await request.json()) as OnboardingPayload;
  } catch {
    return NextResponse.json({ error: "Некоректний формат запиту." }, { status: 400 });
  }

  const parsed = parseInputs(payload);
  if ("error" in parsed) {
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
  const existingGuestUserId = cookieStore.get(GUEST_USER_COOKIE_NAME)?.value ?? null;
  const userResolution = await resolveGuestUserId(supabase, existingGuestUserId);
  if ("error" in userResolution) {
    return NextResponse.json({ error: userResolution.error }, { status: userResolution.status });
  }

  let analysisResult;
  try {
    analysisResult = await generateCareerSwitchAnalysis({
      country: "UA",
      current_income: parsed.inputs.current_income,
      current_role_text: parsed.inputs.current_role,
      years_in_current_role: parsed.inputs.current_experience_years,
      target_role_text: parsed.inputs.target_role,
      target_experience_level: parsed.inputs.experience_level,
      english_level: parsed.inputs.english_level,
      target_market: parsed.inputs.target_market,
      transition_priority: parsed.inputs.transition_priority
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
    ...parsed.inputs,
    country: "UA"
  };

  const { data: simulation, error: simulationError } = await supabase
    .from("simulations")
    .insert({
      user_id: userResolution.userId,
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

    return NextResponse.json({ error: `Не вдалося зберегти симуляцію: ${simulationError.message}` }, { status: 500 });
  }

  const { error: resultInsertError } = await supabase.from("simulation_results").insert({
    simulation_id: simulation.id,
    user_id: userResolution.userId,
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
      createdGuestUser: userResolution.isNew
    },
    { status: 201 }
  );

  response.cookies.set({
    name: GUEST_USER_COOKIE_NAME,
    value: userResolution.userId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_USER_COOKIE_MAX_AGE
  });

  return response;
}
