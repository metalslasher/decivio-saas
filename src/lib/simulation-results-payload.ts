import {
  validateCareerSwitchAnalysis,
  type CareerSwitchAnalysis
} from "@/lib/career-switch-analysis";
import {
  parseStoredCareerSwitchInputs,
  type EnglishLevel,
  type JobSearchStatus,
  type ResumeStatus,
  type SeniorityLevel,
  type TargetMarket,
  type UpgradeGoal
} from "@/lib/career-switch-form";

type AnalysisMeta = {
  generated_at: string;
};

export type DetailRow = {
  label: string;
  value: string;
};

export type ResultsMetricTone = "default" | "success" | "warning" | "danger";

export type SimulationResultsPayload = {
  headline: string;
  summary: string;
  metaChips: string[];
  metrics: Array<{
    label: string;
    value: string;
    note: string;
    tone: ResultsMetricTone;
  }>;
  currentSnapshot: {
    eyebrow: string;
    title: string;
    summary: string;
    details: DetailRow[];
    confidence: string;
    caveats: string[];
  };
  targetSnapshot: {
    eyebrow: string;
    title: string;
    summary: string;
    details: DetailRow[];
    confidence: string;
    caveats: string[];
  };
  comparison: {
    title: string;
    interpretation: string;
    rows: DetailRow[];
  };
  whyThisResult: string[];
  personalizationNotes: string[];
  cta: {
    title: string;
    body: string;
  };
};

type StoredSimulationRow = {
  inputs: unknown;
  created_at?: string | null;
};

type StoredResultRow = {
  ai_summary: unknown;
  created_at?: string | null;
};

type RiskLevel = CareerSwitchAnalysis["guidance"]["risk_assessment"]["level"];

const currencyFormatter = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function extractAnalysis(value: unknown): CareerSwitchAnalysis | null {
  if (!isRecord(value) || !("analysis" in value)) {
    return null;
  }

  try {
    return validateCareerSwitchAnalysis((value as { analysis?: unknown }).analysis);
  } catch {
    return null;
  }
}

function extractMeta(value: unknown): AnalysisMeta | null {
  if (!isRecord(value) || !("meta" in value) || !isRecord(value.meta)) {
    return null;
  }

  const generatedAt = toString(value.meta.generated_at);

  if (generatedAt === null) {
    return null;
  }

  return {
    generated_at: generatedAt
  };
}

function formatCurrency(value: number) {
  return `${currencyFormatter.format(Math.round(value)).replace(/\u00A0/g, " ")} грн`;
}

function formatSignedCurrency(value: number) {
  const rounded = Math.round(value);
  const sign = rounded > 0 ? "+" : rounded < 0 ? "-" : "";
  return `${sign}${currencyFormatter.format(Math.abs(rounded)).replace(/\u00A0/g, " ")} грн`;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatRange(low: number, high: number) {
  return `${formatCurrency(low)} - ${formatCurrency(high)}`;
}

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("uk-UA");
}

function riskLevelLabel(level: RiskLevel) {
  switch (level) {
    case "low":
      return "Низький";
    case "medium":
      return "Середній";
    case "high":
      return "Високий";
    default:
      return level;
  }
}

function riskLevelTone(level: RiskLevel): ResultsMetricTone {
  switch (level) {
    case "low":
      return "success";
    case "medium":
      return "warning";
    case "high":
      return "danger";
    default:
      return "default";
  }
}

function levelLabel(level: "junior" | "middle" | "senior" | "lead") {
  switch (level) {
    case "junior":
      return "Junior";
    case "middle":
      return "Middle";
    case "senior":
      return "Senior";
    case "lead":
      return "Lead";
    default:
      return level;
  }
}

function seniorityLevelLabel(level: SeniorityLevel) {
  switch (level) {
    case "junior":
      return "Junior";
    case "middle":
      return "Middle";
    case "senior":
      return "Senior";
    case "lead":
      return "Lead";
    case "manager":
      return "Manager";
    default:
      return level;
  }
}

function englishLevelLabel(level: EnglishLevel) {
  switch (level) {
    case "basic":
      return "A1-A2";
    case "intermediate":
      return "B1";
    case "upper_intermediate":
      return "B2";
    case "advanced":
      return "C1+";
    default:
      return level;
  }
}

function targetMarketLabel(market: TargetMarket) {
  switch (market) {
    case "ukraine":
      return "Україна";
    case "remote":
      return "Міжнародний ринок";
    case "abroad":
      return "Локальна робота за кордоном";
    default:
      return market;
  }
}

function upgradeGoalLabel(goal: UpgradeGoal) {
  switch (goal) {
    case "higher_income":
      return "Вищий дохід";
    case "better_company":
      return "Сильніша компанія";
    case "international_market":
      return "Міжнародний ринок";
    case "relocation":
      return "Робота за кордоном";
    case "faster_search":
      return "Швидший пошук";
    default:
      return goal;
  }
}

function jobSearchStatusLabel(status: JobSearchStatus) {
  switch (status) {
    case "not_started":
      return "Ще не шукаєте активно";
    case "preparing":
      return "Готуєтесь до пошуку";
    case "applying":
      return "Відгукуєтесь на вакансії";
    case "interviewing":
      return "Проходите співбесіди";
    case "offer":
      return "Маєте пропозицію";
    default:
      return status;
  }
}

function resumeStatusLabel(status: ResumeStatus) {
  switch (status) {
    case "none":
      return "Резюме ще немає";
    case "outdated":
      return "Резюме потрібно оновити";
    case "ready":
      return "Резюме актуальне";
    case "needs_improvement":
      return "Резюме варто посилити";
    default:
      return status;
  }
}

export function buildSimulationResultsPayload({
  simulation,
  result
}: {
  simulation: StoredSimulationRow;
  result: StoredResultRow;
}): SimulationResultsPayload | null {
  const inputs = parseStoredCareerSwitchInputs(simulation.inputs);
  const analysis = extractAnalysis(result.ai_summary);
  const meta = extractMeta(result.ai_summary);

  if (!inputs || !analysis) {
    return null;
  }

  const currentRole = analysis.market_profile.current_role;
  const targetRole = analysis.market_profile.target_role;
  const comparison = analysis.market_profile.comparison;
  const narrative = analysis.narrative;
  const riskAssessment = analysis.guidance.risk_assessment;
  const createdAt = meta?.generated_at
    ? formatDate(meta.generated_at)
    : result.created_at
      ? formatDate(result.created_at)
      : simulation.created_at
        ? formatDate(simulation.created_at)
        : null;

  const currentDetails: DetailRow[] = [
    { label: "Ваш дохід зараз", value: formatCurrency(inputs.current_income) },
    {
      label: `Орієнтир для рівня ${levelLabel(currentRole.current_level_estimate)}`,
      value: formatRange(currentRole.current_market_salary_range.low, currentRole.current_market_salary_range.high)
    },
    {
      label: "Типовий дохід на рівні Senior",
      value: formatCurrency(currentRole.senior_salary_range.median)
    },
    {
      label: `Потенційна стеля (${levelLabel(currentRole.best_case_level)})`,
      value: formatCurrency(currentRole.best_case_salary_range.median)
    }
  ];

  const targetDetails: DetailRow[] = [
    {
      label: `Реалістичний рівень входу (${levelLabel(targetRole.entry_level_for_switcher)})`,
      value: formatCurrency(targetRole.entry_salary_range.median)
    },
    {
      label: "Вилка для найближчих вакансій",
      value: formatRange(targetRole.entry_salary_range.low, targetRole.entry_salary_range.high)
    },
    {
      label: "Типовий дохід на рівні Senior",
      value: formatCurrency(targetRole.senior_salary_range.median)
    },
    {
      label: `Потенційна стеля (${levelLabel(targetRole.best_case_level)})`,
      value: formatCurrency(targetRole.best_case_salary_range.median)
    }
  ];

  const metaChips = [
    `Поточна роль: ${currentRole.canonical_title}`,
    `Рівень: ${seniorityLevelLabel(inputs.seniority_level)}`,
    `Поточний ринок: ${targetMarketLabel(inputs.current_market)}`,
    `Ціль: ${upgradeGoalLabel(inputs.upgrade_goal)}`,
    `Напрям: ${targetMarketLabel(inputs.target_market)}`,
    `Англійська: ${englishLevelLabel(inputs.english_level)}`,
    resumeStatusLabel(inputs.resume_status)
  ];

  if (createdAt) {
    metaChips.push(`Дата аналізу: ${createdAt}`);
  }

  const marketMedianGap = currentRole.current_market_salary_range.median - inputs.current_income;
  const incomePosition =
    Math.abs(marketMedianGap) <= inputs.current_income * 0.08
      ? "близько до ринку"
      : marketMedianGap > 0
        ? "нижче орієнтира ринку"
        : "вище базового орієнтира";
  const strongerDirectionMedian = Math.max(targetRole.entry_salary_range.median, targetRole.senior_salary_range.median);
  const growthPotentialPercent =
    inputs.current_income > 0 ? Math.max(0, ((strongerDirectionMedian - inputs.current_income) / inputs.current_income) * 100) : 0;

  return {
    headline: narrative.headline,
    summary: narrative.summary,
    metaChips,
    metrics: [
      {
        label: "Ваш дохід зараз",
        value: formatCurrency(inputs.current_income),
        note: `Оцінка відносно ринку: ${incomePosition}.`,
        tone: "default"
      },
      {
        label: "Орієнтир ринку",
        value: formatCurrency(currentRole.current_market_salary_range.median),
        note: `Типова середина вилки для рівня ${levelLabel(currentRole.current_level_estimate)} у вашому ринку.`,
        tone: "default"
      },
      {
        label: "Сильніший напрям",
        value: targetMarketLabel(inputs.target_market),
        note: targetRole.summary,
        tone: "default"
      },
      {
        label: "Потенціал росту",
        value: `+${formatPercent(growthPotentialPercent)}`,
        note: `Орієнтир для сильнішого напряму: ${formatCurrency(strongerDirectionMedian)} на місяць.`,
        tone: growthPotentialPercent > 15 ? "success" : "default"
      },
      {
        label: "Складність шляху",
        value: riskLevelLabel(riskAssessment.level),
        note: riskAssessment.summary,
        tone: riskLevelTone(riskAssessment.level)
      }
    ],
    currentSnapshot: {
      eyebrow: `Поточний профіль • ${currentRole.market_scope_label}`,
      title: currentRole.canonical_title,
      summary: currentRole.summary,
      details: currentDetails,
      confidence: formatConfidence(currentRole.confidence),
      caveats: currentRole.caveats
    },
    targetSnapshot: {
      eyebrow: `Сильніший напрям • ${targetRole.market_scope_label}`,
      title: targetRole.canonical_title,
      summary: targetRole.summary,
      details: targetDetails,
      confidence: formatConfidence(targetRole.confidence),
      caveats: targetRole.caveats
    },
    comparison: {
      title: comparison.better_long_term_label,
      interpretation: comparison.interpretation,
      rows: [
        {
          label: "Потенційна стеля поточного напряму",
          value: `${levelLabel(currentRole.best_case_level)} • ${formatCurrency(currentRole.best_case_salary_range.median)}`
        },
        {
          label: "Потенційна стеля сильнішого напряму",
          value: `${levelLabel(targetRole.best_case_level)} • ${formatCurrency(targetRole.best_case_salary_range.median)}`
        },
        {
          label: "Різниця між верхніми орієнтирами",
          value: formatSignedCurrency(comparison.ceiling_gap_median)
        }
      ]
    },
    whyThisResult: narrative.why_this_result,
    personalizationNotes: narrative.personalization_notes,
    cta: {
      title: narrative.cta_title,
      body: narrative.cta_body
    }
  };
}
