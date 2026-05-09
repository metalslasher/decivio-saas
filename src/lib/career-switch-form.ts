export const EXPERIENCE_LEVEL_VALUES = ["none", "basic", "practical"] as const;
export const ENGLISH_LEVEL_VALUES = ["basic", "intermediate", "upper_intermediate", "advanced"] as const;
export const TARGET_MARKET_VALUES = ["ukraine", "remote", "abroad"] as const;
export const TRANSITION_PRIORITY_VALUES = ["speed", "income"] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVEL_VALUES)[number];
export type EnglishLevel = (typeof ENGLISH_LEVEL_VALUES)[number];
export type TargetMarket = (typeof TARGET_MARKET_VALUES)[number];
export type TransitionPriority = (typeof TRANSITION_PRIORITY_VALUES)[number];

export type CareerSwitchFormInput = {
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

function isKnownValue<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

export function normalizeRoleText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("uk-UA");
}

export function isSameRoleText(left: string, right: string) {
  return normalizeRoleText(left) === normalizeRoleText(right);
}

export function parseCareerSwitchFormPayload(payload: Record<string, unknown>): ParseResult<CareerSwitchFormInput> {
  const currentIncome = parseNonNegativeNumber(payload.current_income, "Поточний чистий дохід");
  if (!currentIncome.ok) {
    return currentIncome;
  }

  const currentRole = parseRequiredString(payload.current_role, "Поточна роль");
  if (!currentRole.ok) {
    return currentRole;
  }

  const currentExperienceYears = parseNonNegativeNumber(payload.current_experience_years, "Стаж у поточній сфері");
  if (!currentExperienceYears.ok) {
    return currentExperienceYears;
  }

  if (currentExperienceYears.value > 60) {
    return {
      ok: false,
      error: "Стаж у поточній сфері: введіть реалістичне значення (до 60 років)."
    };
  }

  const targetRole = parseRequiredString(payload.target_role, "Цільова роль");
  if (!targetRole.ok) {
    return targetRole;
  }

  if (isSameRoleText(currentRole.value, targetRole.value)) {
    return { ok: false, error: "Цільова роль має відрізнятись від поточної." };
  }

  if (!isKnownValue(payload.experience_level, EXPERIENCE_LEVEL_VALUES)) {
    return { ok: false, error: "Релевантний досвід: оберіть один із варіантів." };
  }

  if (!isKnownValue(payload.english_level, ENGLISH_LEVEL_VALUES)) {
    return { ok: false, error: "Англійська: оберіть один із варіантів." };
  }

  if (!isKnownValue(payload.target_market, TARGET_MARKET_VALUES)) {
    return { ok: false, error: "Цільовий ринок: оберіть один із варіантів." };
  }

  if (!isKnownValue(payload.transition_priority, TRANSITION_PRIORITY_VALUES)) {
    return { ok: false, error: "Пріоритет переходу: оберіть один із варіантів." };
  }

  return {
    ok: true,
    value: {
      current_income: currentIncome.value,
      current_role: currentRole.value,
      current_experience_years: currentExperienceYears.value,
      target_role: targetRole.value,
      experience_level: payload.experience_level,
      english_level: payload.english_level,
      target_market: payload.target_market,
      transition_priority: payload.transition_priority
    }
  };
}

export function parseStoredCareerSwitchInputs(value: unknown): CareerSwitchFormInput | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const parsed = parseCareerSwitchFormPayload(value as Record<string, unknown>);
  return parsed.ok ? parsed.value : null;
}

export const experienceLevelOptions: Array<{ value: ExperienceLevel; label: string }> = [
  { value: "none", label: "Немає досвіду" },
  { value: "basic", label: "Є базові знання" },
  { value: "practical", label: "Є практичний досвід" }
];

export const englishLevelOptions: Array<{ value: EnglishLevel; label: string }> = [
  { value: "basic", label: "A1-A2 (базовий рівень)" },
  { value: "intermediate", label: "B1 (можу спілкуватися)" },
  { value: "upper_intermediate", label: "B2 (можу проходити інтерв'ю)" },
  { value: "advanced", label: "C1+ (працюю впевнено)" }
];

export const targetMarketOptions: Array<{ value: TargetMarket; label: string }> = [
  { value: "ukraine", label: "Україна" },
  { value: "remote", label: "Міжнародний ринок" },
  { value: "abroad", label: "Локальна робота за кордоном" }
];

export const transitionPriorityOptions: Array<{ value: TransitionPriority; label: string }> = [
  { value: "speed", label: "Швидше перейти" },
  { value: "income", label: "Максимізувати дохід" }
];
