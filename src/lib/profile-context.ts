import {
  ENGLISH_LEVEL_VALUES,
  EXPERIENCE_LEVEL_VALUES,
  JOB_SEARCH_STATUS_VALUES,
  RESUME_STATUS_VALUES,
  SENIORITY_LEVEL_VALUES,
  TARGET_MARKET_VALUES,
  TRANSITION_PRIORITY_VALUES,
  UPGRADE_GOAL_VALUES,
  type CareerSwitchFormInput,
  type EnglishLevel,
  type ExperienceLevel,
  type JobSearchStatus,
  type ResumeStatus,
  type SeniorityLevel,
  type TargetMarket,
  type TransitionPriority,
  type UpgradeGoal
} from "@/lib/career-switch-form";

export const WORK_PREFERENCE_VALUES = ["remote", "hybrid", "office", "flexible"] as const;
export const JOB_SEARCH_STAGE_VALUES = ["exploring", "preparing", "active", "interviewing"] as const;

export type WorkPreference = (typeof WORK_PREFERENCE_VALUES)[number];
export type JobSearchStage = (typeof JOB_SEARCH_STAGE_VALUES)[number];

export type ProfileContext = {
  city: string | null;
  current_income: number | null;
  current_market?: TargetMarket | null;
  current_role: string | null;
  current_experience_years: number | null;
  seniority_level?: SeniorityLevel | null;
  desired_income?: number | null;
  target_role: string | null;
  upgrade_goal?: UpgradeGoal | null;
  experience_level: ExperienceLevel | null;
  english_level: EnglishLevel | null;
  target_market: TargetMarket | null;
  transition_priority: TransitionPriority | null;
  job_search_status?: JobSearchStatus | null;
  resume_status?: ResumeStatus | null;
  weekly_learning_hours: number | null;
  work_preference: WorkPreference | null;
  job_search_stage: JobSearchStage | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  focus_note: string | null;
};

const emptyContext: ProfileContext = {
  city: null,
  current_income: null,
  current_market: null,
  current_role: null,
  current_experience_years: null,
  seniority_level: null,
  desired_income: null,
  target_role: null,
  upgrade_goal: null,
  experience_level: null,
  english_level: null,
  target_market: null,
  transition_priority: null,
  job_search_status: null,
  resume_status: null,
  weekly_learning_hours: null,
  work_preference: null,
  job_search_stage: null,
  linkedin_url: null,
  portfolio_url: null,
  focus_note: null
};

export const workPreferenceOptions: Array<{ value: WorkPreference; label: string }> = [
  { value: "remote", label: "Віддалено" },
  { value: "hybrid", label: "Гібридно" },
  { value: "office", label: "Офіс" },
  { value: "flexible", label: "Гнучко" }
];

export const jobSearchStageOptions: Array<{ value: JobSearchStage; label: string }> = [
  { value: "exploring", label: "Досліджую варіанти" },
  { value: "preparing", label: "Готуюсь до переходу" },
  { value: "active", label: "Активно подаюсь" },
  { value: "interviewing", label: "Вже проходжу співбесіди" }
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function toOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isKnownValue<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && allowed.includes(value as T);
}

export function createEmptyProfileContext(): ProfileContext {
  return { ...emptyContext };
}

export function parseProfileContext(value: unknown): ProfileContext {
  if (!isRecord(value)) {
    return createEmptyProfileContext();
  }

  return {
    city: toOptionalString(value.city),
    current_income: toOptionalNumber(value.current_income),
    current_market: isKnownValue(value.current_market, TARGET_MARKET_VALUES) ? value.current_market : null,
    current_role: toOptionalString(value.current_role),
    current_experience_years: toOptionalNumber(value.current_experience_years),
    seniority_level: isKnownValue(value.seniority_level, SENIORITY_LEVEL_VALUES) ? value.seniority_level : null,
    desired_income: toOptionalNumber(value.desired_income),
    target_role: toOptionalString(value.target_role),
    upgrade_goal: isKnownValue(value.upgrade_goal, UPGRADE_GOAL_VALUES) ? value.upgrade_goal : null,
    experience_level: isKnownValue(value.experience_level, EXPERIENCE_LEVEL_VALUES) ? value.experience_level : null,
    english_level: isKnownValue(value.english_level, ENGLISH_LEVEL_VALUES) ? value.english_level : null,
    target_market: isKnownValue(value.target_market, TARGET_MARKET_VALUES) ? value.target_market : null,
    transition_priority: isKnownValue(value.transition_priority, TRANSITION_PRIORITY_VALUES) ? value.transition_priority : null,
    job_search_status: isKnownValue(value.job_search_status, JOB_SEARCH_STATUS_VALUES) ? value.job_search_status : null,
    resume_status: isKnownValue(value.resume_status, RESUME_STATUS_VALUES) ? value.resume_status : null,
    weekly_learning_hours: toOptionalNumber(value.weekly_learning_hours),
    work_preference: isKnownValue(value.work_preference, WORK_PREFERENCE_VALUES) ? value.work_preference : null,
    job_search_stage: isKnownValue(value.job_search_stage, JOB_SEARCH_STAGE_VALUES) ? value.job_search_stage : null,
    linkedin_url: toOptionalString(value.linkedin_url),
    portfolio_url: toOptionalString(value.portfolio_url),
    focus_note: toOptionalString(value.focus_note)
  };
}

export function buildOnboardingProfileContext(input: CareerSwitchFormInput): Partial<ProfileContext> {
  return {
    current_income: input.current_income,
    current_market: input.current_market,
    current_role: input.current_role,
    current_experience_years: input.current_experience_years,
    seniority_level: input.seniority_level,
    desired_income: input.desired_income,
    target_role: input.target_role,
    upgrade_goal: input.upgrade_goal,
    experience_level: input.experience_level,
    english_level: input.english_level,
    target_market: input.target_market,
    transition_priority: input.transition_priority,
    job_search_status: input.job_search_status,
    resume_status: input.resume_status
  };
}

export function mergeProfileContext(primary: ProfileContext, fallback: Partial<ProfileContext>): ProfileContext {
  return {
    city: primary.city ?? fallback.city ?? null,
    current_income: primary.current_income ?? fallback.current_income ?? null,
    current_market: primary.current_market ?? fallback.current_market ?? null,
    current_role: primary.current_role ?? fallback.current_role ?? null,
    current_experience_years: primary.current_experience_years ?? fallback.current_experience_years ?? null,
    seniority_level: primary.seniority_level ?? fallback.seniority_level ?? null,
    desired_income: primary.desired_income ?? fallback.desired_income ?? null,
    target_role: primary.target_role ?? fallback.target_role ?? null,
    upgrade_goal: primary.upgrade_goal ?? fallback.upgrade_goal ?? null,
    experience_level: primary.experience_level ?? fallback.experience_level ?? null,
    english_level: primary.english_level ?? fallback.english_level ?? null,
    target_market: primary.target_market ?? fallback.target_market ?? null,
    transition_priority: primary.transition_priority ?? fallback.transition_priority ?? null,
    job_search_status: primary.job_search_status ?? fallback.job_search_status ?? null,
    resume_status: primary.resume_status ?? fallback.resume_status ?? null,
    weekly_learning_hours: primary.weekly_learning_hours ?? fallback.weekly_learning_hours ?? null,
    work_preference: primary.work_preference ?? fallback.work_preference ?? null,
    job_search_stage: primary.job_search_stage ?? fallback.job_search_stage ?? null,
    linkedin_url: primary.linkedin_url ?? fallback.linkedin_url ?? null,
    portfolio_url: primary.portfolio_url ?? fallback.portfolio_url ?? null,
    focus_note: primary.focus_note ?? fallback.focus_note ?? null
  };
}
