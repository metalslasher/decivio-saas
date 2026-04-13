import OpenAI from "openai";

export type ExperienceLevel = "none" | "basic" | "practical";
export type EnglishLevel = "basic" | "intermediate" | "upper_intermediate" | "advanced";
export type TargetMarket = "ukraine" | "remote" | "abroad";
export type TransitionPriority = "speed" | "income";
export type SalaryLevel = "junior" | "middle" | "senior" | "lead";
export type VerdictLabel = "stay" | "switch" | "depends";
export type BetterLongTermDirection = "current_role" | "target_role" | "balanced";
export type BestCaseLevel = "senior" | "lead";
export type RiskLevel = "low" | "medium" | "high";

export type CareerSwitchAnalysisRequest = {
  country: "UA";
  current_income: number;
  current_role_text: string;
  years_in_current_role: number;
  target_role_text: string;
  target_experience_level: ExperienceLevel;
  english_level: EnglishLevel;
  target_market: TargetMarket;
  transition_priority: TransitionPriority;
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
  sources: string[];
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
  sources: string[];
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
  disclaimer: string;
};

export type RiskAssessment = {
  level: RiskLevel;
  summary: string;
};

export type VacancyExample = {
  title: string;
  company: string;
  location_label: string;
  source_label: string;
  url: string;
  compensation_hint: string | null;
  relevance_reason: string;
};

export type MarketEvidence = {
  availability_summary: string;
  vacancy_examples: VacancyExample[];
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
    market_evidence: MarketEvidence;
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

const DEFAULT_MODEL = "gpt-5.4-mini";
const FALLBACK_MODEL = "gpt-4.1";
const ANALYSIS_SCHEMA_NAME = "career_switch_result";

const experienceLevelDescriptions: Record<ExperienceLevel, string> = {
  none: "немає практичного або комерційного досвіду в цільовій ролі",
  basic: "є базові знання, але без сильного практичного комерційного треку",
  practical: "є практичний досвід, pet-проєкти або частково релевантна практика"
};

const englishLevelDescriptions: Record<EnglishLevel, string> = {
  basic: "A1-A2: англійська слабка або базова",
  intermediate: "B1: може спілкуватися, але не завжди впевнено",
  upper_intermediate: "B2: може проходити інтерв'ю і працювати англійською",
  advanced: "C1+: впевнено працює і комунікує англійською"
};

const targetMarketDescriptions: Record<TargetMarket, string> = {
  ukraine: "орієнтир на ринок України",
  remote: "орієнтир на віддалену роботу або міжнародний ринок",
  abroad: "орієнтир на локальний ринок за кордоном"
};

const transitionPriorityDescriptions: Record<TransitionPriority, string> = {
  speed: "людині важливіше швидше перейти в нову роль",
  income: "людині важливіше максимізувати дохід і стелю ролі"
};

const salaryRangeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["low", "median", "high", "currency"],
  properties: {
    low: { type: "number" },
    median: { type: "number" },
    high: { type: "number" },
    currency: { type: "string", enum: ["UAH"] }
  }
} as const;

const vacancyExampleSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "company", "location_label", "source_label", "url", "compensation_hint", "relevance_reason"],
  properties: {
    title: { type: "string" },
    company: { type: "string" },
    location_label: { type: "string" },
    source_label: { type: "string" },
    url: { type: "string" },
    compensation_hint: { type: "string" },
    relevance_reason: { type: "string" }
  }
} as const;

const careerSwitchAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  required: ["market_profile", "narrative", "guidance"],
  properties: {
    market_profile: {
      type: "object",
      additionalProperties: false,
      required: ["current_role", "target_role", "comparison"],
      properties: {
        current_role: {
          type: "object",
          additionalProperties: false,
          required: [
            "canonical_title",
            "market_scope_label",
            "current_level_estimate",
            "current_market_salary_range",
            "senior_salary_range",
            "best_case_level",
            "best_case_salary_range",
            "confidence",
            "sources",
            "caveats",
            "summary"
          ],
          properties: {
            canonical_title: { type: "string" },
            market_scope_label: { type: "string" },
            current_level_estimate: { type: "string", enum: ["junior", "middle", "senior", "lead"] },
            current_market_salary_range: salaryRangeSchema,
            senior_salary_range: salaryRangeSchema,
            best_case_level: { type: "string", enum: ["senior", "lead"] },
            best_case_salary_range: salaryRangeSchema,
            confidence: { type: "number" },
            sources: { type: "array", items: { type: "string" } },
            caveats: { type: "array", items: { type: "string" } },
            summary: { type: "string" }
          }
        },
        target_role: {
          type: "object",
          additionalProperties: false,
          required: [
            "canonical_title",
            "market_scope_label",
            "entry_level_for_switcher",
            "entry_salary_range",
            "senior_salary_range",
            "best_case_level",
            "best_case_salary_range",
            "time_to_first_offer_months",
            "probability_of_getting_job_within_12_months",
            "confidence",
            "sources",
            "caveats",
            "summary"
          ],
          properties: {
            canonical_title: { type: "string" },
            market_scope_label: { type: "string" },
            entry_level_for_switcher: { type: "string", enum: ["junior", "middle", "senior", "lead"] },
            entry_salary_range: salaryRangeSchema,
            senior_salary_range: salaryRangeSchema,
            best_case_level: { type: "string", enum: ["senior", "lead"] },
            best_case_salary_range: salaryRangeSchema,
            time_to_first_offer_months: {
              type: "object",
              additionalProperties: false,
              required: ["optimistic", "base", "pessimistic"],
              properties: {
                optimistic: { type: "number" },
                base: { type: "number" },
                pessimistic: { type: "number" }
              }
            },
            probability_of_getting_job_within_12_months: { type: "number" },
            confidence: { type: "number" },
            sources: { type: "array", items: { type: "string" } },
            caveats: { type: "array", items: { type: "string" } },
            summary: { type: "string" }
          }
        },
        comparison: {
          type: "object",
          additionalProperties: false,
          required: ["better_long_term_direction", "better_long_term_label", "ceiling_gap_median", "interpretation"],
          properties: {
            better_long_term_direction: { type: "string", enum: ["current_role", "target_role", "balanced"] },
            better_long_term_label: { type: "string" },
            ceiling_gap_median: { type: "number" },
            interpretation: { type: "string" }
          }
        }
      }
    },
    narrative: {
      type: "object",
      additionalProperties: false,
      required: [
        "verdict_label",
        "headline",
        "summary",
        "why_this_result",
        "personalization_notes",
        "cta_title",
        "cta_body",
        "disclaimer"
      ],
      properties: {
        verdict_label: { type: "string", enum: ["stay", "switch", "depends"] },
        headline: { type: "string" },
        summary: { type: "string" },
        why_this_result: { type: "array", items: { type: "string" } },
        personalization_notes: { type: "array", items: { type: "string" } },
        cta_title: { type: "string" },
        cta_body: { type: "string" },
        disclaimer: { type: "string" }
      }
    },
    guidance: {
      type: "object",
      additionalProperties: false,
      required: ["risk_assessment", "market_evidence"],
      properties: {
        risk_assessment: {
          type: "object",
          additionalProperties: false,
          required: ["level", "summary"],
          properties: {
            level: { type: "string", enum: ["low", "medium", "high"] },
            summary: { type: "string" }
          }
        },
        market_evidence: {
          type: "object",
          additionalProperties: false,
          required: ["availability_summary", "vacancy_examples"],
          properties: {
            availability_summary: { type: "string" },
            vacancy_examples: {
              type: "array",
              items: vacancyExampleSchema
            }
          }
        }
      }
    }
  }
} as const;

function toObject(value: unknown, fieldName: string) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Некоректне поле "${fieldName}" у career_switch_analysis.`);
  }
  return value as Record<string, unknown>;
}

function toNonEmptyString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Некоректне поле "${fieldName}" у career_switch_analysis.`);
  }
  return value.trim();
}

function toNullableString(value: unknown, fieldName: string) {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`Некоректне поле "${fieldName}" у career_switch_analysis.`);
  }

  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

function toNumber(value: unknown, fieldName: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Некоректне поле "${fieldName}" у career_switch_analysis.`);
  }
  return value;
}

function toNonNegativeNumber(value: unknown, fieldName: string) {
  const parsed = toNumber(value, fieldName);
  if (parsed < 0) {
    throw new Error(`Поле "${fieldName}" не може бути від'ємним у career_switch_analysis.`);
  }
  return parsed;
}

function toProbability(value: unknown, fieldName: string) {
  const parsed = toNumber(value, fieldName);
  if (parsed >= 0 && parsed <= 1) {
    return parsed;
  }
  if (parsed > 1 && parsed <= 100) {
    return parsed / 100;
  }
  throw new Error(`Поле "${fieldName}" має бути в межах 0..1 або 0..100 у career_switch_analysis.`);
}

function toStringArray(value: unknown, fieldName: string) {
  if (!Array.isArray(value)) {
    throw new Error(`Некоректне поле "${fieldName}" у career_switch_analysis.`);
  }

  const items = value.map((item) => (typeof item === "string" ? item.trim() : "")).filter((item) => item !== "");
  if (items.length === 0) {
    throw new Error(`Поле "${fieldName}" має містити хоча б один рядок.`);
  }

  return items;
}

function toSafeUrlString(value: unknown, fieldName: string) {
  const normalized = toNonEmptyString(value, fieldName);

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }

    return parsed.toString();
  } catch {
    throw new Error(`Поле "${fieldName}" має містити коректний URL.`);
  }
}

function normalizeCompensationHint(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const lowered = normalized.toLowerCase();
  if (lowered === "не вказано" || lowered === "not specified" || lowered === "n/a") {
    return null;
  }

  return normalized;
}

function sourceLabelFromUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname;
  } catch {
    return "джерело";
  }
}

function parseSalaryLevel(value: unknown, fieldName: string): SalaryLevel {
  const normalized = toNonEmptyString(value, fieldName).toLowerCase();
  if (normalized === "junior" || normalized === "middle" || normalized === "senior" || normalized === "lead") {
    return normalized;
  }
  throw new Error(`Поле "${fieldName}" має бути junior|middle|senior|lead.`);
}

function parseBestCaseLevel(value: unknown, fieldName: string): BestCaseLevel {
  const normalized = toNonEmptyString(value, fieldName).toLowerCase();
  if (normalized === "senior" || normalized === "lead") {
    return normalized;
  }
  throw new Error(`Поле "${fieldName}" має бути senior|lead.`);
}

function parseBetterLongTermDirection(value: unknown, fieldName: string): BetterLongTermDirection {
  const normalized = toNonEmptyString(value, fieldName).toLowerCase();
  if (normalized === "current_role" || normalized === "target_role" || normalized === "balanced") {
    return normalized;
  }
  throw new Error(`Поле "${fieldName}" має бути current_role|target_role|balanced.`);
}

function parseVerdictLabel(value: unknown, fieldName: string): VerdictLabel {
  const normalized = toNonEmptyString(value, fieldName).toLowerCase();
  if (normalized === "stay" || normalized === "switch" || normalized === "depends") {
    return normalized;
  }
  throw new Error(`Поле "${fieldName}" має бути stay|switch|depends.`);
}

function parseRiskLevel(value: unknown, fieldName: string): RiskLevel {
  const normalized = toNonEmptyString(value, fieldName).toLowerCase();
  if (normalized === "low" || normalized === "medium" || normalized === "high") {
    return normalized;
  }

  throw new Error(`Поле "${fieldName}" має бути low|medium|high.`);
}

function parseSalaryRange(value: unknown, fieldName: string): SalaryRange {
  const raw = toObject(value, fieldName);
  const low = toNonNegativeNumber(raw.low, `${fieldName}.low`);
  const median = toNonNegativeNumber(raw.median, `${fieldName}.median`);
  const high = toNonNegativeNumber(raw.high, `${fieldName}.high`);
  const currency = toNonEmptyString(raw.currency, `${fieldName}.currency`).toUpperCase();

  if (!(low <= median && median <= high)) {
    throw new Error(`Поле "${fieldName}" має задовольняти low <= median <= high.`);
  }

  if (currency !== "UAH") {
    throw new Error(`Поле "${fieldName}.currency" має бути UAH.`);
  }

  return {
    low,
    median,
    high,
    currency: "UAH"
  };
}

function parseCurrentRoleSnapshot(value: unknown, fieldName: string): CurrentRoleSnapshot {
  const raw = toObject(value, fieldName);

  return {
    canonical_title: toNonEmptyString(raw.canonical_title, `${fieldName}.canonical_title`),
    market_scope_label: toNonEmptyString(raw.market_scope_label, `${fieldName}.market_scope_label`),
    current_level_estimate: parseSalaryLevel(raw.current_level_estimate, `${fieldName}.current_level_estimate`),
    current_market_salary_range: parseSalaryRange(raw.current_market_salary_range, `${fieldName}.current_market_salary_range`),
    senior_salary_range: parseSalaryRange(raw.senior_salary_range, `${fieldName}.senior_salary_range`),
    best_case_level: parseBestCaseLevel(raw.best_case_level, `${fieldName}.best_case_level`),
    best_case_salary_range: parseSalaryRange(raw.best_case_salary_range, `${fieldName}.best_case_salary_range`),
    confidence: toProbability(raw.confidence, `${fieldName}.confidence`),
    sources: toStringArray(raw.sources, `${fieldName}.sources`),
    caveats: toStringArray(raw.caveats, `${fieldName}.caveats`),
    summary: toNonEmptyString(raw.summary, `${fieldName}.summary`)
  };
}

function parseTargetRoleSnapshot(value: unknown, fieldName: string): TargetRoleSnapshot {
  const raw = toObject(value, fieldName);
  const timeToFirstOffer = toObject(raw.time_to_first_offer_months, `${fieldName}.time_to_first_offer_months`);

  return {
    canonical_title: toNonEmptyString(raw.canonical_title, `${fieldName}.canonical_title`),
    market_scope_label: toNonEmptyString(raw.market_scope_label, `${fieldName}.market_scope_label`),
    entry_level_for_switcher: parseSalaryLevel(raw.entry_level_for_switcher, `${fieldName}.entry_level_for_switcher`),
    entry_salary_range: parseSalaryRange(raw.entry_salary_range, `${fieldName}.entry_salary_range`),
    senior_salary_range: parseSalaryRange(raw.senior_salary_range, `${fieldName}.senior_salary_range`),
    best_case_level: parseBestCaseLevel(raw.best_case_level, `${fieldName}.best_case_level`),
    best_case_salary_range: parseSalaryRange(raw.best_case_salary_range, `${fieldName}.best_case_salary_range`),
    time_to_first_offer_months: {
      optimistic: toNonNegativeNumber(timeToFirstOffer.optimistic, `${fieldName}.time_to_first_offer_months.optimistic`),
      base: toNonNegativeNumber(timeToFirstOffer.base, `${fieldName}.time_to_first_offer_months.base`),
      pessimistic: toNonNegativeNumber(timeToFirstOffer.pessimistic, `${fieldName}.time_to_first_offer_months.pessimistic`)
    },
    probability_of_getting_job_within_12_months: toProbability(
      raw.probability_of_getting_job_within_12_months,
      `${fieldName}.probability_of_getting_job_within_12_months`
    ),
    confidence: toProbability(raw.confidence, `${fieldName}.confidence`),
    sources: toStringArray(raw.sources, `${fieldName}.sources`),
    caveats: toStringArray(raw.caveats, `${fieldName}.caveats`),
    summary: toNonEmptyString(raw.summary, `${fieldName}.summary`)
  };
}

function parseComparison(value: unknown, fieldName: string): CeilingComparison {
  const raw = toObject(value, fieldName);

  return {
    better_long_term_direction: parseBetterLongTermDirection(raw.better_long_term_direction, `${fieldName}.better_long_term_direction`),
    better_long_term_label: toNonEmptyString(raw.better_long_term_label, `${fieldName}.better_long_term_label`),
    ceiling_gap_median: toNumber(raw.ceiling_gap_median, `${fieldName}.ceiling_gap_median`),
    interpretation: toNonEmptyString(raw.interpretation, `${fieldName}.interpretation`)
  };
}

function parseNarrative(value: unknown, fieldName: string): AnalysisNarrative {
  const raw = toObject(value, fieldName);

  return {
    verdict_label: parseVerdictLabel(raw.verdict_label, `${fieldName}.verdict_label`),
    headline: toNonEmptyString(raw.headline, `${fieldName}.headline`),
    summary: toNonEmptyString(raw.summary, `${fieldName}.summary`),
    why_this_result: toStringArray(raw.why_this_result, `${fieldName}.why_this_result`),
    personalization_notes: toStringArray(raw.personalization_notes, `${fieldName}.personalization_notes`),
    cta_title: toNonEmptyString(raw.cta_title, `${fieldName}.cta_title`),
    cta_body: toNonEmptyString(raw.cta_body, `${fieldName}.cta_body`),
    disclaimer: toNonEmptyString(raw.disclaimer, `${fieldName}.disclaimer`)
  };
}

function parseVacancyExample(value: unknown, fieldName: string): VacancyExample {
  const raw = toObject(value, fieldName);

  return {
    title: toNonEmptyString(raw.title, `${fieldName}.title`),
    company: toNonEmptyString(raw.company, `${fieldName}.company`),
    location_label: toNonEmptyString(raw.location_label, `${fieldName}.location_label`),
    source_label: toNonEmptyString(raw.source_label, `${fieldName}.source_label`),
    url: toSafeUrlString(raw.url, `${fieldName}.url`),
    compensation_hint: normalizeCompensationHint(toNullableString(raw.compensation_hint, `${fieldName}.compensation_hint`)),
    relevance_reason: toNonEmptyString(raw.relevance_reason, `${fieldName}.relevance_reason`)
  };
}

function parseMarketEvidence(value: unknown, fieldName: string): MarketEvidence {
  const raw = toObject(value, fieldName);

  if (!Array.isArray(raw.vacancy_examples)) {
    throw new Error(`Некоректне поле "${fieldName}.vacancy_examples" у career_switch_analysis.`);
  }

  return {
    availability_summary: toNonEmptyString(raw.availability_summary, `${fieldName}.availability_summary`),
    vacancy_examples: raw.vacancy_examples.map((item, index) =>
      parseVacancyExample(item, `${fieldName}.vacancy_examples[${index}]`)
    )
  };
}

function parseRiskAssessment(value: unknown, fieldName: string): RiskAssessment {
  const raw = toObject(value, fieldName);

  return {
    level: parseRiskLevel(raw.level, `${fieldName}.level`),
    summary: toNonEmptyString(raw.summary, `${fieldName}.summary`)
  };
}

function deriveFallbackRiskAssessment(targetRole: TargetRoleSnapshot, comparison: CeilingComparison): RiskAssessment {
  let score = 0;

  if (targetRole.probability_of_getting_job_within_12_months < 0.45) {
    score += 2;
  } else if (targetRole.probability_of_getting_job_within_12_months < 0.65) {
    score += 1;
  }

  if (targetRole.time_to_first_offer_months.base > 9) {
    score += 2;
  } else if (targetRole.time_to_first_offer_months.base > 5) {
    score += 1;
  }

  if (targetRole.confidence < 0.45) {
    score += 1;
  }

  if (comparison.better_long_term_direction === "current_role") {
    score += 1;
  }

  if (score >= 4) {
    return {
      level: "high",
      summary: "На старті перехід виглядає ризикованішим: може знадобитися довший пошук і більше запасу часу на вхід у роль."
    };
  }

  if (score >= 2) {
    return {
      level: "medium",
      summary: "Перехід виглядає реалістично, але потребує зібраної підготовки та готовності пройти через помірний період невизначеності."
    };
  }

  return {
    level: "low",
    summary: "Ризик виглядає помірно низьким: за поточними сигналами вхід у роль реалістичний без надто довгого перехідного періоду."
  };
}

function buildFallbackMarketEvidence(targetRole: TargetRoleSnapshot): MarketEvidence {
  return {
    availability_summary: `Добірка актуальних вакансій для ролі ${targetRole.canonical_title} з’явиться тут, коли аналіз зможе підтягнути релевантні ринкові приклади з веб-пошуку.`,
    vacancy_examples: []
  };
}

function parseGuidance(
  value: unknown,
  fieldName: string,
  targetRole: TargetRoleSnapshot,
  comparison: CeilingComparison
) {
  if (value === undefined) {
    return {
      risk_assessment: deriveFallbackRiskAssessment(targetRole, comparison),
      market_evidence: buildFallbackMarketEvidence(targetRole)
    };
  }

  const raw = toObject(value, fieldName);

  return {
    risk_assessment: parseRiskAssessment(raw.risk_assessment, `${fieldName}.risk_assessment`),
    market_evidence: parseMarketEvidence(raw.market_evidence, `${fieldName}.market_evidence`)
  };
}

function buildSystemInstructions(currentDate: string) {
  return [
    "Ти досвідчений стратег з кар'єрних переходів для українських спеціалістів.",
    `Сьогоднішня дата: ${currentDate}.`,
    "Завдання: повернути один валідний JSON-об'єкт для безкоштовної сторінки результату.",
    "Мета сторінки результату: дати персоналізований, зрозумілий і переконливий висновок, який підштовхує людину перейти до глибшого платного плану.",
    "Використовуй веб-пошук, якщо він доступний, щоб спиратися на актуальні сигнали ринку, зарплат і вакансій.",
    "Не будуй п'ятирічний графік, не роби модель точки окупності, не описуй окупність по роках.",
    "Фокус: поточна роль, цільова роль, шанс входу, стеля ролей на рівні Senior/Lead, вплив англійської, цільового ринку і пріоритету користувача.",
    "Усі зарплатні вилки поверни як приблизні щомісячні значення в UAH. Якщо ринок міжнародний або закордонний, конвертуй у UAH-еквівалент і чесно відобрази caveats.",
    "Відповідь має бути відчутно персоналізованою під вхідні дані. Уникай шаблонних загальних фраз.",
    "У видимому для користувача тексті уникай англіцизмів на кшталт best case, switcher, roadmap, remote. Пиши природною українською.",
    "Додатково поверни м’який індикатор ризику переходу: рівень low|medium|high і коротке пояснення одним-двома реченнями.",
    "Додатково поверни блок market_evidence: короткий висновок про наявність вакансій і 2-3 реальні приклади вакансій для цільової ролі з прямими URL, якщо веб-пошук дає надійні результати.",
    "Для vacancy_examples віддавай лише перевірені прямі посилання на сторінки вакансій або сторінки компаній з вакансією. Якщо не можеш впевнено верифікувати посилання, не вигадуй і поверни порожній список.",
    "Для vacancy_examples показуй лише релевантні цільовому ринку приклади: Україна, міжнародна віддалена робота або локальна робота за кордоном залежно від input.",
    "Безкоштовна сторінка може пояснювати, чому висновок саме такий, але не повинна розкривати повний покроковий план або детальний план виконання.",
    "Заклик до дії має продавати наступний крок, але не розкривати платний функціонал.",
    "Для current_role.summary і target_role.summary пиши простою людською мовою, без канцеляриту.",
    "why_this_result і personalization_notes повинні бути короткими, конкретними і читабельними в UI.",
    "Використовуй conservative confidence і caveats, якщо ринок неоднорідний або дані неповні.",
    "Поверни лише JSON без markdown і без будь-якого тексту поза JSON."
  ].join("\n");
}

function buildUserInput(input: CareerSwitchAnalysisRequest) {
  return JSON.stringify(
    {
      country: input.country,
      current_income_uah_per_month: input.current_income,
      current_role_text: input.current_role_text,
      years_in_current_role: input.years_in_current_role,
      target_role_text: input.target_role_text,
      target_experience_level: input.target_experience_level,
      target_experience_level_description: experienceLevelDescriptions[input.target_experience_level],
      english_level: input.english_level,
      english_level_description: englishLevelDescriptions[input.english_level],
      target_market: input.target_market,
      target_market_description: targetMarketDescriptions[input.target_market],
      transition_priority: input.transition_priority,
      transition_priority_description: transitionPriorityDescriptions[input.transition_priority],
      product_goal:
        "Безкоштовна сторінка має сказати, що зараз виглядає сильніше: залишатися в поточній ролі чи переходити в цільову. Пояснення має бути персональним, але без повного покрокового плану. Окремо потрібні м’яка оцінка ризику та реальні приклади вакансій, якщо веб-пошук може їх підтвердити."
    },
    null,
    2
  );
}

function targetMarketEvidenceLabel(targetMarket: TargetMarket) {
  switch (targetMarket) {
    case "ukraine":
      return "ринок України";
    case "remote":
      return "міжнародний ринок з віддаленим форматом";
    case "abroad":
      return "локальний ринок за кордоном";
    default:
      return "обраний ринок";
  }
}

function buildVacancyEvidencePrompt(input: CareerSwitchAnalysisRequest) {
  return [
    "Знайди до 3 реальних вакансій для цільової ролі.",
    "Працюй тільки через веб-пошук.",
    "Пріоритет: вакансії, які найближчі до стартового або перехідного входу. Якщо таких немає, поверни найближчі релевантні й коротко познач, що планка вища.",
    "Пріоритет джерел: jobs.dou.ua, djinni.co, robota.ua, work.ua, career/company jobs pages.",
    "Не використовуй сторінки пошукової видачі, агрегатори без конкретної вакансії або сторінки зі списком без окремої позиції, якщо є краща альтернатива.",
    "Поверни тільки plain text без пояснень поза форматом.",
    "Перший рядок: SUMMARY || {1 коротке речення про наявність вакансій на ринку}.",
    "Далі кожну вакансію окремим рядком: VACANCY || {назва ролі} || {компанія} || {локація} || {вилка або 'не вказано'} || {чому це релевантно для такого переходу} || {джерело}.",
    "Для кожного рядка VACANCY обов’язково прикріпи citation на конкретну сторінку вакансії через вбудовані посилання веб-пошуку.",
    "Не вставляй raw URL у текст. Не вигадуй вакансії. Якщо надійних прикладів немає, поверни тільки рядок SUMMARY."
  ].join("\n") +
    `\n\nЦільова роль: ${input.target_role_text}.\nРинок: ${targetMarketEvidenceLabel(input.target_market)}.\nРівень англійської: ${englishLevelDescriptions[input.english_level]}.\nРелевантний досвід: ${experienceLevelDescriptions[input.target_experience_level]}.`;
}

type UrlCitation = {
  type: "url_citation";
  start_index: number;
  end_index: number;
  title: string;
  url: string;
};

function extractOutputTextPayload(response: unknown) {
  if (typeof response !== "object" || response === null || !("output" in response) || !Array.isArray((response as { output?: unknown[] }).output)) {
    return null;
  }

  for (const item of (response as { output: unknown[] }).output) {
    if (typeof item !== "object" || item === null || !("content" in item) || !Array.isArray((item as { content?: unknown[] }).content)) {
      continue;
    }

    for (const contentItem of (item as { content: unknown[] }).content) {
      if (
        typeof contentItem === "object" &&
        contentItem !== null &&
        (contentItem as { type?: string }).type === "output_text" &&
        typeof (contentItem as { text?: unknown }).text === "string"
      ) {
        const annotations = Array.isArray((contentItem as { annotations?: unknown[] }).annotations)
          ? ((contentItem as { annotations: unknown[] }).annotations.filter(
              (annotation): annotation is UrlCitation =>
                typeof annotation === "object" &&
                annotation !== null &&
                (annotation as { type?: string }).type === "url_citation" &&
                typeof (annotation as { url?: unknown }).url === "string" &&
                typeof (annotation as { title?: unknown }).title === "string" &&
                typeof (annotation as { start_index?: unknown }).start_index === "number" &&
                typeof (annotation as { end_index?: unknown }).end_index === "number"
            ) as UrlCitation[])
          : [];

        return {
          text: (contentItem as { text: string }).text,
          annotations
        };
      }
    }
  }

  return null;
}

function parseVacancyEvidenceText(text: string, annotations: UrlCitation[]): MarketEvidence {
  const rawLines = text.split("\n");
  const vacancyExamples: VacancyExample[] = [];
  let availabilitySummary = "Актуальні приклади вакансій не знайдені в межах надійного веб-пошуку.";
  const vacancyLines: string[] = [];

  for (const rawLine of rawLines) {
    const line = (rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine).trim();
    if (!line) {
      continue;
    }

    if (line.startsWith("SUMMARY ||")) {
      const summary = line.slice("SUMMARY ||".length).trim();
      if (summary) {
        availabilitySummary = summary;
      }
      continue;
    }

    if (!line.startsWith("VACANCY ||")) {
      continue;
    }

    vacancyLines.push(line);
  }

  vacancyLines.forEach((line, index) => {
    const parts = line.split("||").map((part) => part.trim());
    if (parts.length < 7) {
      return;
    }

    const citation = annotations[index];
    if (!citation) {
      return;
    }

    try {
      const sourceLabel =
        parts.length >= 8
          ? toNonEmptyString(parts[6], "vacancy.source_label")
          : sourceLabelFromUrl(citation.url);

      vacancyExamples.push({
        title: toNonEmptyString(parts[1], "vacancy.title"),
        company: toNonEmptyString(parts[2], "vacancy.company"),
        location_label: toNonEmptyString(parts[3], "vacancy.location_label"),
        compensation_hint: normalizeCompensationHint(toNullableString(parts[4], "vacancy.compensation_hint")),
        relevance_reason: toNonEmptyString(parts[5], "vacancy.relevance_reason"),
        source_label: sourceLabel,
        url: toSafeUrlString(citation.url, "vacancy.url")
      });
    } catch {
      return;
    }
  });

  return {
    availability_summary: availabilitySummary,
    vacancy_examples: vacancyExamples.slice(0, 3)
  };
}

function fallbackVerifiedMarketEvidence(input: CareerSwitchAnalysisRequest): MarketEvidence {
  return {
    availability_summary: `Не вдалося надійно підтягнути прямі приклади вакансій для напряму ${input.target_role_text} на ${targetMarketEvidenceLabel(
      input.target_market
    )}.`,
    vacancy_examples: []
  };
}

async function fetchVerifiedVacancyEvidence(
  client: OpenAI,
  input: CareerSwitchAnalysisRequest,
  model: string
): Promise<MarketEvidence> {
  const response = await client.responses.create({
    model,
    instructions: buildVacancyEvidencePrompt(input),
    input: `Роль: ${input.target_role_text}. Ринок: ${targetMarketEvidenceLabel(input.target_market)}.`,
    store: false,
    tools: [
      {
        type: "web_search_preview",
        search_context_size: "high",
        user_location: {
          type: "approximate",
          country: "UA",
          city: "Kyiv",
          region: "Kyiv",
          timezone: "Europe/Kiev"
        }
      }
    ]
  });

  const payload = extractOutputTextPayload(response);
  if (!payload) {
    return fallbackVerifiedMarketEvidence(input);
  }

  const parsed = parseVacancyEvidenceText(payload.text, payload.annotations);
  if (parsed.vacancy_examples.length === 0) {
    return {
      availability_summary: parsed.availability_summary || fallbackVerifiedMarketEvidence(input).availability_summary,
      vacancy_examples: []
    };
  }

  return parsed;
}

function getMissingOpenAiEnv() {
  const required = ["OPENAI_API_KEY"] as const;
  return required.filter((name) => {
    const value = process.env[name];
    return typeof value !== "string" || value.trim() === "";
  });
}

function getConfiguredModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

function createOpenAiClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 1,
    timeout: 45_000
  });
}

function isModelSupportError(error: unknown) {
  const maybeError = error as { status?: number; message?: string } | null;
  const message = typeof maybeError?.message === "string" ? maybeError.message.toLowerCase() : "";
  return (
    maybeError?.status === 404 ||
    message.includes("model") && (message.includes("not found") || message.includes("does not exist") || message.includes("not available"))
  );
}

function isWebSearchSupportError(error: unknown) {
  const maybeError = error as { status?: number; message?: string } | null;
  const message = typeof maybeError?.message === "string" ? maybeError.message.toLowerCase() : "";

  return (
    maybeError?.status === 400 &&
    (message.includes("web_search") || message.includes("web search") || message.includes("tool"))
  );
}

async function requestAnalysisAttempt(
  input: CareerSwitchAnalysisRequest,
  model: string,
  useWebSearch: boolean
): Promise<CareerSwitchAnalysisResult> {
  const client = createOpenAiClient();
  const startedAt = Date.now();

  const response = await client.responses.create({
    model,
    instructions: buildSystemInstructions(new Date().toISOString().slice(0, 10)),
    input: buildUserInput(input),
    temperature: 0.3,
    max_output_tokens: 3200,
    store: false,
    tools: useWebSearch
      ? [
          {
            type: "web_search_preview",
            search_context_size: "high",
            user_location: {
              type: "approximate",
              country: "UA",
              city: "Kyiv",
              region: "Kyiv",
              timezone: "Europe/Kiev"
            }
          }
        ]
      : undefined,
    text: {
      format: {
        type: "json_schema",
        name: ANALYSIS_SCHEMA_NAME,
        strict: true,
        schema: careerSwitchAnalysisSchema
      }
    }
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  const rawContent = response.output_text?.trim();
  if (!rawContent) {
    throw new Error("Сервіс аналізу повернув порожню відповідь.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error("Сервіс аналізу повернув невалідний JSON.");
  }

  const analysis = validateCareerSwitchAnalysis(parsed);
  analysis.guidance.market_evidence = useWebSearch
    ? await fetchVerifiedVacancyEvidence(client, input, model).catch(() => fallbackVerifiedMarketEvidence(input))
    : fallbackVerifiedMarketEvidence(input);
  const latencyMs = Date.now() - startedAt;

  return {
    analysis,
    meta: {
      model,
      latency_ms: latencyMs,
      web_search_used: useWebSearch,
      request_id: response._request_id ?? null,
      generated_at: new Date().toISOString()
    }
  };
}

function assertValidCareerSwitchRequest(input: CareerSwitchAnalysisRequest) {
  if (input.country !== "UA") {
    throw new Error("Підтримується лише country=UA.");
  }

  if (typeof input.current_role_text !== "string" || input.current_role_text.trim() === "") {
    throw new Error("current_role_text обов'язкове.");
  }

  if (typeof input.target_role_text !== "string" || input.target_role_text.trim() === "") {
    throw new Error("target_role_text обов'язкове.");
  }

  if (!Number.isFinite(input.current_income) || input.current_income < 0) {
    throw new Error("current_income має бути числом >= 0.");
  }

  if (!Number.isFinite(input.years_in_current_role) || input.years_in_current_role < 0) {
    throw new Error("years_in_current_role має бути числом >= 0.");
  }
}

export function buildStoredSummaryMetrics(analysis: CareerSwitchAnalysis) {
  return {
    verdict_label: analysis.narrative.verdict_label,
    better_long_term_direction: analysis.market_profile.comparison.better_long_term_direction,
    ceiling_gap_median: analysis.market_profile.comparison.ceiling_gap_median,
    probability_of_getting_job_within_12_months:
      analysis.market_profile.target_role.probability_of_getting_job_within_12_months,
    risk_level: analysis.guidance.risk_assessment.level,
    current_best_case_median: analysis.market_profile.current_role.best_case_salary_range.median,
    target_best_case_median: analysis.market_profile.target_role.best_case_salary_range.median,
    current_confidence: analysis.market_profile.current_role.confidence,
    target_confidence: analysis.market_profile.target_role.confidence
  };
}

export function validateCareerSwitchAnalysis(value: unknown): CareerSwitchAnalysis {
  const raw = toObject(value, "career_switch_analysis");
  const marketProfile = toObject(raw.market_profile, "career_switch_analysis.market_profile");
  const currentRole = parseCurrentRoleSnapshot(marketProfile.current_role, "career_switch_analysis.market_profile.current_role");
  const targetRole = parseTargetRoleSnapshot(marketProfile.target_role, "career_switch_analysis.market_profile.target_role");
  const comparison = parseComparison(marketProfile.comparison, "career_switch_analysis.market_profile.comparison");

  return {
    market_profile: {
      current_role: currentRole,
      target_role: targetRole,
      comparison
    },
    narrative: parseNarrative(raw.narrative, "career_switch_analysis.narrative"),
    guidance: parseGuidance(raw.guidance, "career_switch_analysis.guidance", targetRole, comparison)
  };
}

export async function generateCareerSwitchAnalysis(
  input: CareerSwitchAnalysisRequest
): Promise<CareerSwitchAnalysisResult> {
  assertValidCareerSwitchRequest(input);

  const missingOpenAiEnv = getMissingOpenAiEnv();
  if (missingOpenAiEnv.length > 0) {
    throw new Error(`Сервіс аналізу не налаштовано. Відсутні env змінні: ${missingOpenAiEnv.join(", ")}.`);
  }

  const configuredModel = getConfiguredModel();

  try {
    return await requestAnalysisAttempt(input, configuredModel, true);
  } catch (error) {
    if (!isModelSupportError(error) && !isWebSearchSupportError(error)) {
      throw error;
    }

    if (isModelSupportError(error) && configuredModel !== FALLBACK_MODEL) {
      try {
        return await requestAnalysisAttempt(input, FALLBACK_MODEL, true);
      } catch (fallbackError) {
        if (!isWebSearchSupportError(fallbackError)) {
          throw fallbackError;
        }
        return requestAnalysisAttempt(input, FALLBACK_MODEL, false);
      }
    }

    return requestAnalysisAttempt(input, configuredModel, false);
  }
}
