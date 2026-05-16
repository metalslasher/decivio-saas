import type {
  EnglishLevel,
  ExperienceLevel,
  JobSearchStatus,
  ResumeStatus,
  SeniorityLevel,
  TargetMarket,
  TransitionPriority,
  UpgradeGoal
} from "@/lib/career-switch-form";

export type SalaryLevel = "junior" | "middle" | "senior" | "lead";
export type VerdictLabel = "stay" | "switch" | "depends";
export type BetterLongTermDirection = "current_role" | "target_role" | "balanced";
export type BestCaseLevel = "senior" | "lead";
export type RiskLevel = "low" | "medium" | "high";

export type CareerSwitchAnalysisRequest = {
  country: "UA";
  current_income: number;
  current_market: TargetMarket;
  current_role_text: string;
  years_in_current_role: number;
  seniority_level: SeniorityLevel;
  target_role_text: string;
  upgrade_goal: UpgradeGoal;
  target_experience_level: ExperienceLevel;
  english_level: EnglishLevel;
  target_market: TargetMarket;
  transition_priority: TransitionPriority;
  job_search_status: JobSearchStatus;
  resume_status: ResumeStatus;
};

export type SalaryRange = {
  low: number;
  median: number;
  high: number;
  currency: "UAH";
};

export type CurrentRoleSnapshot = {
  canonical_title: string;
  market_scope_label: string;
  current_level_estimate: SalaryLevel;
  current_market_salary_range: SalaryRange;
  senior_salary_range: SalaryRange;
  best_case_level: BestCaseLevel;
  best_case_salary_range: SalaryRange;
  confidence: number;
  caveats: string[];
  summary: string;
};

export type TargetRoleSnapshot = {
  canonical_title: string;
  market_scope_label: string;
  entry_level_for_switcher: SalaryLevel;
  entry_salary_range: SalaryRange;
  senior_salary_range: SalaryRange;
  best_case_level: BestCaseLevel;
  best_case_salary_range: SalaryRange;
  time_to_first_offer_months: {
    optimistic: number;
    base: number;
    pessimistic: number;
  };
  probability_of_getting_job_within_12_months: number;
  confidence: number;
  caveats: string[];
  summary: string;
};

export type CeilingComparison = {
  better_long_term_direction: BetterLongTermDirection;
  better_long_term_label: string;
  ceiling_gap_median: number;
  interpretation: string;
};

export type AnalysisNarrative = {
  verdict_label: VerdictLabel;
  headline: string;
  summary: string;
  why_this_result: string[];
  personalization_notes: string[];
  cta_title: string;
  cta_body: string;
};

export type RiskAssessment = {
  level: RiskLevel;
  summary: string;
};

export type CareerSwitchAnalysis = {
  market_profile: {
    current_role: CurrentRoleSnapshot;
    target_role: TargetRoleSnapshot;
    comparison: CeilingComparison;
  };
  narrative: AnalysisNarrative;
  guidance: {
    risk_assessment: RiskAssessment;
  };
};

export type CareerSwitchAnalysisResult = {
  analysis: CareerSwitchAnalysis;
  meta: {
    model: string;
    latency_ms: number;
    web_search_used: boolean;
    request_id: string | null;
    generated_at: string;
  };
};
