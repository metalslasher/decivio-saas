export const EXPERIENCE_LEVEL_VALUES = ["none", "basic", "practical"] as const;
export const ENGLISH_LEVEL_VALUES = ["basic", "intermediate", "upper_intermediate", "advanced"] as const;
export const TARGET_MARKET_VALUES = ["ukraine", "remote", "abroad"] as const;
export const TRANSITION_PRIORITY_VALUES = ["speed", "income"] as const;
export const SENIORITY_LEVEL_VALUES = ["junior", "middle", "senior", "lead", "unknown"] as const;
export const UPGRADE_GOAL_VALUES = [
  "higher_income",
  "better_company",
  "international_market",
  "relocation",
  "faster_search"
] as const;
export const JOB_SEARCH_STATUS_VALUES = ["not_started", "preparing", "applying", "interviewing", "offer"] as const;
export const RESUME_STATUS_VALUES = ["none", "outdated", "ready", "needs_improvement"] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVEL_VALUES)[number];
export type EnglishLevel = (typeof ENGLISH_LEVEL_VALUES)[number];
export type TargetMarket = (typeof TARGET_MARKET_VALUES)[number];
export type TransitionPriority = (typeof TRANSITION_PRIORITY_VALUES)[number];
export type SeniorityLevel = (typeof SENIORITY_LEVEL_VALUES)[number];
export type UpgradeGoal = (typeof UPGRADE_GOAL_VALUES)[number];
export type JobSearchStatus = (typeof JOB_SEARCH_STATUS_VALUES)[number];
export type ResumeStatus = (typeof RESUME_STATUS_VALUES)[number];

export type CareerSwitchFormInput = {
  current_income: number;
  current_market: TargetMarket;
  current_role: string;
  current_experience_years: number;
  seniority_level: SeniorityLevel;
  desired_income: number;
  target_role: string;
  upgrade_goal: UpgradeGoal;
  english_level: EnglishLevel;
  target_market: TargetMarket;
  job_search_status: JobSearchStatus;
  resume_status: ResumeStatus;
  experience_level: ExperienceLevel;
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

function parseOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function isKnownValue<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

function inferSeniority(years: number): SeniorityLevel {
  if (years >= 8) {
    return "lead";
  }

  if (years >= 5) {
    return "senior";
  }

  if (years >= 2) {
    return "middle";
  }

  return "junior";
}

function inferExperienceLevel(years: number, seniority: SeniorityLevel): ExperienceLevel {
  if (seniority === "unknown") {
    return years >= 1 ? "practical" : "basic";
  }

  if (seniority === "junior" && years < 1) {
    return "basic";
  }

  return "practical";
}

function inferTransitionPriority(goal: UpgradeGoal): TransitionPriority {
  return goal === "faster_search" ? "speed" : "income";
}

function inferTargetMarket(goal: UpgradeGoal, currentMarket: TargetMarket): TargetMarket {
  if (goal === "international_market") {
    return "remote";
  }

  if (goal === "relocation") {
    return "abroad";
  }

  return currentMarket;
}

export function parseCareerSwitchFormPayload(payload: Record<string, unknown>): ParseResult<CareerSwitchFormInput> {
  const currentIncome = parseNonNegativeNumber(payload.current_income, "Поточний чистий дохід");
  if (!currentIncome.ok) {
    return currentIncome;
  }

  const currentMarket: TargetMarket = isKnownValue(payload.current_market, TARGET_MARKET_VALUES)
    ? payload.current_market
    : "ukraine";

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

  const seniorityLevel: SeniorityLevel = isKnownValue(payload.seniority_level, SENIORITY_LEVEL_VALUES)
    ? payload.seniority_level
    : inferSeniority(currentExperienceYears.value);

  const targetRole = parseOptionalString(payload.target_role) ?? currentRole.value;

  const upgradeGoal: UpgradeGoal = isKnownValue(payload.upgrade_goal, UPGRADE_GOAL_VALUES)
    ? payload.upgrade_goal
    : "higher_income";

  const desiredIncome = parseNonNegativeNumber(
    typeof payload.desired_income === "number" ? payload.desired_income : currentIncome.value,
    "Бажаний чистий дохід"
  );
  if (!desiredIncome.ok) {
    return desiredIncome;
  }

  if (!isKnownValue(payload.english_level, ENGLISH_LEVEL_VALUES)) {
    return { ok: false, error: "Англійська: оберіть один із варіантів." };
  }

  const targetMarket: TargetMarket = isKnownValue(payload.target_market, TARGET_MARKET_VALUES)
    ? payload.target_market
    : inferTargetMarket(upgradeGoal, currentMarket);

  const jobSearchStatus: JobSearchStatus = isKnownValue(payload.job_search_status, JOB_SEARCH_STATUS_VALUES)
    ? payload.job_search_status
    : "not_started";

  const resumeStatus: ResumeStatus = isKnownValue(payload.resume_status, RESUME_STATUS_VALUES)
    ? payload.resume_status
    : "outdated";

  const experienceLevel: ExperienceLevel = isKnownValue(payload.experience_level, EXPERIENCE_LEVEL_VALUES)
    ? payload.experience_level
    : inferExperienceLevel(currentExperienceYears.value, seniorityLevel);

  const transitionPriority: TransitionPriority = isKnownValue(payload.transition_priority, TRANSITION_PRIORITY_VALUES)
    ? payload.transition_priority
    : inferTransitionPriority(upgradeGoal);

  return {
    ok: true,
    value: {
      current_income: currentIncome.value,
      current_market: currentMarket,
      current_role: currentRole.value,
      current_experience_years: currentExperienceYears.value,
      seniority_level: seniorityLevel,
      desired_income: desiredIncome.value,
      target_role: targetRole,
      upgrade_goal: upgradeGoal,
      english_level: payload.english_level,
      target_market: targetMarket,
      job_search_status: jobSearchStatus,
      resume_status: resumeStatus,
      experience_level: experienceLevel,
      transition_priority: transitionPriority
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

export const currentMarketOptions: Array<{ value: TargetMarket; label: string }> = [
  { value: "ukraine", label: "Україна" },
  { value: "remote", label: "Працюю з міжнародним ринком" },
  { value: "abroad", label: "Працюю локально за кордоном" }
];

export const seniorityLevelOptions: Array<{ value: SeniorityLevel; label: string }> = [
  { value: "junior", label: "Junior (початковий рівень)" },
  { value: "middle", label: "Middle (самостійний спеціаліст)" },
  { value: "senior", label: "Senior (сильний спеціаліст)" },
  { value: "lead", label: "Lead (керівний рівень)" },
  { value: "unknown", label: "Не знаю свій рівень" }
];

export const upgradeGoalOptions: Array<{ value: UpgradeGoal; label: string }> = [
  { value: "higher_income", label: "Заробляти більше" },
  { value: "better_company", label: "Перейти в сильнішу компанію" },
  { value: "international_market", label: "Вийти на міжнародний ринок" },
  { value: "relocation", label: "Знайти роботу за кордоном" },
  { value: "faster_search", label: "Швидше отримати нову пропозицію" }
];

export const publicUpgradeGoalOptions: Array<{ value: UpgradeGoal; label: string }> = upgradeGoalOptions.filter(
  (option) => option.value !== "higher_income"
);

export const jobSearchStatusOptions: Array<{ value: JobSearchStatus; label: string }> = [
  { value: "not_started", label: "Ще не шукаю активно" },
  { value: "preparing", label: "Готую резюме й профіль" },
  { value: "applying", label: "Відгукуюсь, але мало відповідей" },
  { value: "interviewing", label: "Вже проходжу співбесіди" },
  { value: "offer", label: "Є пропозиція, хочу порівняти" }
];

export const resumeStatusOptions: Array<{ value: ResumeStatus; label: string }> = [
  { value: "none", label: "Резюме ще немає" },
  { value: "outdated", label: "Є, але давно не оновлював" },
  { value: "ready", label: "Є актуальне резюме" },
  { value: "needs_improvement", label: "Є, але воно слабко працює" }
];

export const transitionPriorityOptions: Array<{ value: TransitionPriority; label: string }> = [
  { value: "speed", label: "Швидше перейти" },
  { value: "income", label: "Максимізувати дохід" }
];
