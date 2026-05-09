import type { ReactNode } from "react";
import type {
  EnglishLevel,
  ExperienceLevel,
  TargetMarket,
  TransitionPriority,
} from "@/lib/career-switch-form";
import type {
  JobSearchStage,
  ProfileContext,
  WorkPreference,
} from "@/lib/profile-context";

export type DashboardView =
  | "overview"
  | "scenario"
  | "profile"
  | "resume"
  | "interviews"
  | "jobs"
  | "offers"
  | "assistant"
  | "access";

export type ChipTone = "default" | "accent" | "success" | "gold";

export type DashboardState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      user: {
        id: string;
        email: string;
        displayName: string;
      };
      profile: DashboardUserProfile;
      subscription: {
        plan: "free" | "pro";
        status: "free" | "trial" | "active" | "canceled" | "past_due";
        currentPeriodEnd: string | null;
      };
      totalSimulations: number;
      recentSimulations: DashboardSimulation[];
    };

export type DashboardSimulation = {
  id: string;
  createdAt: string;
  status: string;
  currentRole: string | null;
  targetRole: string | null;
  targetMarket: string | null;
  transitionPriority: string | null;
  verdictLabel: string | null;
  betterLongTermDirection: string | null;
  riskLevel: string | null;
  probabilityOfGettingJob: number | null;
  ceilingGapMedian: number | null;
  currentBestCaseMedian: number | null;
  targetBestCaseMedian: number | null;
  profileContextSeed: Partial<ProfileContext>;
};

export type DashboardUserProfile = {
  fullName: string | null;
  timezone: string | null;
  avatarUrl: string | null;
  context: ProfileContext;
  completion: number;
};

export type ProfileRow = {
  email?: string | null;
  full_name?: string | null;
  timezone?: string | null;
  avatar_url?: string | null;
  profile_context?: unknown;
};

export type SubscriptionRow = {
  status?: "free" | "trial" | "active" | "canceled" | "past_due" | null;
  plan?: "free" | "pro" | null;
  current_period_end?: string | null;
};

export type SimulationRow = {
  id: string;
  created_at: string;
  status?: string | null;
  inputs?: unknown;
};

export type SimulationResultRow = {
  simulation_id: string;
  summary_metrics?: unknown;
};

export type DashboardAccessState = {
  plan: "free" | "pro";
  status: "free" | "trial" | "active" | "canceled" | "past_due";
  currentPeriodEnd: string | null;
};

export type DashboardProgressStep = {
  label: string;
  progress: number;
  href?: string;
};

export type DashboardNavItem = {
  view: DashboardView;
  label: string;
  helper: string;
  icon: ReactNode;
};

export type DashboardModule = {
  view: Exclude<DashboardView, "overview" | "scenario" | "profile" | "access">;
  title: string;
  description: string;
  helper: string;
  searchTerms: string[];
  icon: ReactNode;
};

export type ModuleWorkspaceConfig = {
  eyebrow: string;
  title: string;
  description: string;
  summary: Array<{ label: string; value: string }>;
  columns: Array<{
    title: string;
    description: string;
    items: string[];
  }>;
};

export type ProfileDraft = {
  full_name: string;
  timezone: string;
  avatar_url: string | null;
  city: string;
  current_income: string;
  current_role: string;
  current_experience_years: string;
  target_role: string;
  experience_level: ExperienceLevel | "";
  english_level: EnglishLevel | "";
  target_market: TargetMarket | "";
  transition_priority: TransitionPriority | "";
  weekly_learning_hours: string;
  work_preference: WorkPreference | "";
  job_search_stage: JobSearchStage | "";
  linkedin_url: string;
  portfolio_url: string;
  focus_note: string;
};
