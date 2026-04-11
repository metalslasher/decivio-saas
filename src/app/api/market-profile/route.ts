import { NextResponse } from "next/server";
import {
  generateCareerSwitchAnalysis,
  type EnglishLevel,
  type ExperienceLevel,
  type TargetMarket,
  type TransitionPriority
} from "@/lib/career-switch-analysis";

type MarketProfilePayload = {
  country?: unknown;
  current_income?: unknown;
  current_role_text?: unknown;
  target_role_text?: unknown;
  years_in_current_role?: unknown;
  target_experience_level?: unknown;
  english_level?: unknown;
  target_market?: unknown;
  transition_priority?: unknown;
};

const experienceLevelValues = new Set<ExperienceLevel>(["none", "basic", "practical"]);
const englishLevelValues = new Set<EnglishLevel>(["basic", "intermediate", "upper_intermediate", "advanced"]);
const targetMarketValues = new Set<TargetMarket>(["ukraine", "remote", "abroad"]);
const transitionPriorityValues = new Set<TransitionPriority>(["speed", "income"]);

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isKnownValue<T extends string>(value: unknown, allowed: ReadonlySet<T>): value is T {
  return typeof value === "string" && allowed.has(value as T);
}

function parseRequestPayload(payload: MarketProfilePayload) {
  const countryRaw = asNonEmptyString(payload.country)?.toUpperCase();
  const currentIncome = asNumber(payload.current_income);
  const currentRole = asNonEmptyString(payload.current_role_text);
  const targetRole = asNonEmptyString(payload.target_role_text);
  const yearsInRole = asNumber(payload.years_in_current_role);

  if (countryRaw !== "UA") {
    throw new Error("Поле country обов'язкове і має бути 'UA'.");
  }

  if (currentIncome === null || currentIncome < 0) {
    throw new Error("Поле current_income обов'язкове і має бути >= 0.");
  }

  if (!currentRole) {
    throw new Error("Поле current_role_text обов'язкове.");
  }

  if (!targetRole) {
    throw new Error("Поле target_role_text обов'язкове.");
  }

  if (yearsInRole === null || yearsInRole < 0) {
    throw new Error("Поле years_in_current_role обов'язкове і має бути >= 0.");
  }

  if (!isKnownValue(payload.target_experience_level, experienceLevelValues)) {
    throw new Error("Поле target_experience_level має бути one of: none, basic, practical.");
  }

  if (!isKnownValue(payload.english_level, englishLevelValues)) {
    throw new Error("Поле english_level має бути one of: basic, intermediate, upper_intermediate, advanced.");
  }

  if (!isKnownValue(payload.target_market, targetMarketValues)) {
    throw new Error("Поле target_market має бути one of: ukraine, remote, abroad.");
  }

  if (!isKnownValue(payload.transition_priority, transitionPriorityValues)) {
    throw new Error("Поле transition_priority має бути one of: speed, income.");
  }

  return {
    country: "UA" as const,
    current_income: currentIncome,
    current_role_text: currentRole,
    target_role_text: targetRole,
    years_in_current_role: yearsInRole,
    target_experience_level: payload.target_experience_level,
    english_level: payload.english_level,
    target_market: payload.target_market,
    transition_priority: payload.transition_priority
  };
}

export async function POST(request: Request) {
  let payload: MarketProfilePayload;

  try {
    payload = (await request.json()) as MarketProfilePayload;
  } catch {
    return NextResponse.json({ error: "Некоректний формат запиту." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseRequestPayload(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Некоректні вхідні дані."
      },
      { status: 400 }
    );
  }

  try {
    const result = await generateCareerSwitchAnalysis(parsed);

    return NextResponse.json(
      {
        market_profile: result.analysis.market_profile,
        narrative: result.analysis.narrative,
        meta: result.meta
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не вдалося отримати висновок.";
    return NextResponse.json(
      {
        error:
          message.includes("невалідний JSON") || message.includes("валідний JSON")
            ? "Сервіс аналізу тимчасово недоступний. Спробуйте ще раз через кілька хвилин."
            : message
      },
      { status: 503 }
    );
  }
}
