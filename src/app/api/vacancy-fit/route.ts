import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { getUserSubscriptionAccess } from "@/lib/billing-store";
import { applyManualFullAccess } from "@/lib/manual-full-access";
import { parseStoredCareerSwitchInputs } from "@/lib/career-switch-form";
import { parseProfileContext } from "@/lib/profile-context";
import { getAuthenticatedUserFromRequest } from "@/lib/request-auth";
import { generateVacancyFitAnalysis, type VacancyFitContext } from "@/lib/vacancy-fit-analysis";

type ProfileRow = {
  profile_context?: unknown;
};

type SimulationRow = {
  id: string;
  inputs?: unknown;
};

type SimulationResultRow = {
  summary_metrics?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function hasActivePaidAccess(subscription: {
  plan: "free" | "pro";
  status: "free" | "trial" | "active" | "canceled" | "past_due";
  currentPeriodEnd: string | null;
}) {
  if (subscription.plan !== "pro") {
    return false;
  }

  if (
    subscription.status !== "active" &&
    subscription.status !== "trial" &&
    subscription.status !== "canceled"
  ) {
    return false;
  }

  if (!subscription.currentPeriodEnd) {
    return subscription.status === "active" || subscription.status === "trial";
  }

  return new Date(subscription.currentPeriodEnd).getTime() > Date.now();
}

async function readJsonBody(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

function parseTextField(
  body: Record<string, unknown>,
  fieldName: string,
  options: { required: boolean; min?: number; max: number },
) {
  const value = body[fieldName];
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    if (options.required) {
      throw new Error("Додайте текст вакансії для аналізу.");
    }

    return null;
  }

  if (typeof options.min === "number" && normalized.length < options.min) {
    throw new Error("Додайте повніший текст вакансії для аналізу.");
  }

  if (normalized.length > options.max) {
    throw new Error(`Поле "${fieldName}" занадто довге.`);
  }

  return normalized;
}

export async function POST(request: Request) {
  const supabase = getSupabaseServiceRoleClient();

  try {
    const authenticatedUser = await getAuthenticatedUserFromRequest(supabase, request);

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: "Потрібно увійти в акаунт." },
        { status: 401 },
      );
    }

    const subscriptionRow = await getUserSubscriptionAccess(
      supabase,
      authenticatedUser.userId,
    );
    const subscription = applyManualFullAccess(authenticatedUser.email, {
      plan: subscriptionRow?.plan === "pro" ? "pro" : "free",
      status:
        subscriptionRow?.status === "active" ||
        subscriptionRow?.status === "trial" ||
        subscriptionRow?.status === "canceled" ||
        subscriptionRow?.status === "past_due"
          ? subscriptionRow.status
          : "free",
      currentPeriodEnd: subscriptionRow?.current_period_end ?? null,
    });

    if (!hasActivePaidAccess(subscription)) {
      return NextResponse.json(
        { error: "Аналіз вакансій доступний після оплати." },
        { status: 403 },
      );
    }

    const rawBody = await readJsonBody(request);
    if (!isRecord(rawBody)) {
      return NextResponse.json(
        { error: "Некоректний запит." },
        { status: 400 },
      );
    }

    const vacancyText = parseTextField(rawBody, "vacancyText", {
      required: true,
      min: 80,
      max: 12_000,
    });
    if (!vacancyText) {
      return NextResponse.json(
        { error: "Додайте текст вакансії для аналізу." },
        { status: 400 },
      );
    }

    const resumeText = parseTextField(rawBody, "resumeText", {
      required: false,
      max: 12_000,
    });

    const [{ data: profile }, { data: latestSimulation }] = await Promise.all([
      supabase
        .from("profiles")
        .select("profile_context")
        .eq("id", authenticatedUser.userId)
        .maybeSingle<ProfileRow>(),
      supabase
        .from("simulations")
        .select("id, inputs")
        .eq("user_id", authenticatedUser.userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<SimulationRow>(),
    ]);

    const parsedInputs = parseStoredCareerSwitchInputs(latestSimulation?.inputs);
    const profileContext = parseProfileContext(profile?.profile_context);
    let summaryMetrics: Record<string, unknown> | null = null;

    if (latestSimulation?.id) {
      const { data: latestResult } = await supabase
        .from("simulation_results")
        .select("summary_metrics")
        .eq("simulation_id", latestSimulation.id)
        .maybeSingle<SimulationResultRow>();

      summaryMetrics =
        latestResult?.summary_metrics && isRecord(latestResult.summary_metrics)
          ? latestResult.summary_metrics
          : null;
    }

    const context: VacancyFitContext = {
      currentRole: parsedInputs?.current_role ?? profileContext.current_role,
      targetRole: parsedInputs?.target_role ?? profileContext.target_role,
      currentIncome: parsedInputs?.current_income ?? profileContext.current_income,
      desiredIncome: parsedInputs?.desired_income ?? null,
      currentMarket: parsedInputs?.current_market ?? null,
      targetMarket: parsedInputs?.target_market ?? profileContext.target_market,
      seniorityLevel: parsedInputs?.seniority_level ?? null,
      englishLevel: parsedInputs?.english_level ?? profileContext.english_level,
      jobSearchStatus: parsedInputs?.job_search_status ?? profileContext.job_search_stage,
      resumeStatus: parsedInputs?.resume_status ?? null,
      marketVerdict: toNonEmptyString(summaryMetrics?.verdict_label),
      riskLevel: toNonEmptyString(summaryMetrics?.risk_level),
    };

    const result = await generateVacancyFitAnalysis({
      vacancyText,
      resumeText,
      context,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Не вдалося проаналізувати вакансію.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
