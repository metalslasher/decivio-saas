import OpenAI from "openai";
import type {
  EnglishLevel,
  ExperienceLevel,
  TargetMarket,
  TransitionPriority
} from "@/lib/career-switch-form";
import { isLocalTestModeEnabled } from "@/lib/test-mode";
import { ANALYSIS_SCHEMA_NAME, careerSwitchAnalysisSchema } from "./schema";
import type {
  AnalysisNarrative,
  BestCaseLevel,
  BetterLongTermDirection,
  CareerSwitchAnalysis,
  CareerSwitchAnalysisRequest,
  CareerSwitchAnalysisResult,
  CeilingComparison,
  CurrentRoleSnapshot,
  RiskAssessment,
  RiskLevel,
  SalaryLevel,
  SalaryRange,
  TargetRoleSnapshot,
  VerdictLabel
} from "./types";
export type {
  AnalysisNarrative,
  BestCaseLevel,
  BetterLongTermDirection,
  CareerSwitchAnalysis,
  CareerSwitchAnalysisRequest,
  CareerSwitchAnalysisResult,
  CeilingComparison,
  CurrentRoleSnapshot,
  RiskAssessment,
  RiskLevel,
  SalaryLevel,
  SalaryRange,
  TargetRoleSnapshot,
  VerdictLabel
} from "./types";

const DEFAULT_MODEL = "gpt-5.4-mini";
const FALLBACK_MODEL = "gpt-4.1";

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
  remote: "орієнтир на міжнародний ринок",
  abroad: "орієнтир на локальний ринок за кордоном"
};

const transitionPriorityDescriptions: Record<TransitionPriority, string> = {
  speed: "людині важливіше швидше отримати сильніший офер",
  income: "людині важливіше максимізувати дохід і стелю ролі"
};

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
    cta_body: toNonEmptyString(raw.cta_body, `${fieldName}.cta_body`)
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
      summary: "На старті сценарій виглядає ризикованішим: може знадобитися довший пошук і більше підготовки перед активними відгуками."
    };
  }

  if (score >= 2) {
    return {
      level: "medium",
      summary: "Сценарій виглядає реалістично, але потребує зібраної підготовки та готовності пройти через помірний період невизначеності."
    };
  }

  return {
    level: "low",
    summary: "Ризик виглядає помірно низьким: за поточними сигналами профіль достатньо сильний для активного пошуку."
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
      risk_assessment: deriveFallbackRiskAssessment(targetRole, comparison)
    };
  }

  const raw = toObject(value, fieldName);

  return {
    risk_assessment: parseRiskAssessment(raw.risk_assessment, `${fieldName}.risk_assessment`)
  };
}

function buildSystemInstructions(currentDate: string) {
  return [
    "Ти досвідчений кар'єрний стратег для українських спеціалістів, які хочуть сильніший дохід, ринок або офер на базі вже наявного досвіду.",
    `Сьогоднішня дата: ${currentDate}.`,
    "Завдання: повернути один валідний JSON-об'єкт для безкоштовної сторінки результату.",
    "Мета сторінки результату: дати персоналізований, зрозумілий і переконливий висновок, який підштовхує людину перейти до глибшого платного плану.",
    "Використовуй веб-пошук, якщо він доступний, щоб спиратися на актуальні сигнали ринку, зарплат і вакансій.",
    "Не будуй п'ятирічний графік, не роби модель точки окупності, не описуй окупність по роках.",
    "Фокус: поточна роль, цільова можливість, шанс отримати офер, стеля ролей на рівні Senior/Lead, вплив англійської, цільового ринку і пріоритету користувача.",
    "Усі зарплатні вилки поверни як приблизні щомісячні значення в UAH. Якщо ринок міжнародний або закордонний, конвертуй у UAH-еквівалент і чесно відобрази caveats.",
    "Відповідь має бути відчутно персоналізованою під вхідні дані. Уникай шаблонних загальних фраз.",
    "У видимому для користувача тексті уникай англіцизмів на кшталт best case, switcher, roadmap, remote. Пиши природною українською.",
    "Додатково поверни м’який індикатор ризику сценарію: рівень low|medium|high і коротке пояснення одним-двома реченнями.",
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
        "Безкоштовна сторінка має сказати, що зараз виглядає сильніше: залишатися в поточній ролі чи переходити в цільову. Пояснення має бути персональним, але без повного покрокового плану. Окремо потрібна м’яка оцінка ризику. Заклик до дії має підштовхувати до наступного кроку без детального розкриття платного функціоналу."
    },
    null,
    2
  );
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToHundreds(value: number) {
  return Math.max(0, Math.round(value / 100) * 100);
}

function buildSalaryRange(median: number): SalaryRange {
  const normalizedMedian = roundToHundreds(median);
  return {
    low: roundToHundreds(normalizedMedian * 0.82),
    median: normalizedMedian,
    high: roundToHundreds(normalizedMedian * 1.18),
    currency: "UAH"
  };
}

function getTargetEntryLevel(level: ExperienceLevel): SalaryLevel {
  if (level === "practical") {
    return "middle";
  }

  return "junior";
}

function getMarketScopeLabel(market: TargetMarket) {
  switch (market) {
    case "remote":
      return "Міжнародний ринок";
    case "abroad":
      return "Локальна робота за кордоном";
    case "ukraine":
    default:
      return "Україна";
  }
}

function buildMockCareerSwitchAnalysis(input: CareerSwitchAnalysisRequest): CareerSwitchAnalysisResult {
  const currentTitle = input.current_role_text.trim();
  const targetTitle = input.target_role_text.trim();
  const currentMedian = roundToHundreds(Math.max(input.current_income, 25000));
  const marketMultiplier = input.target_market === "remote" ? 1.28 : input.target_market === "abroad" ? 1.18 : 1;
  const experienceMultiplier =
    input.target_experience_level === "practical" ? 1.05 : input.target_experience_level === "basic" ? 0.9 : 0.72;
  const targetEntryMedian = roundToHundreds(Math.max(18000, currentMedian * experienceMultiplier * marketMultiplier));
  const currentSeniorMedian = roundToHundreds(Math.max(currentMedian + 12000, currentMedian * 1.35));
  const currentBestMedian = roundToHundreds(Math.max(currentSeniorMedian + 10000, currentMedian * 1.65));
  const targetSeniorMedian = roundToHundreds(Math.max(targetEntryMedian + 18000, targetEntryMedian * 1.55));
  const targetBestMedian = roundToHundreds(Math.max(targetSeniorMedian + 12000, targetEntryMedian * 1.9));
  const ceilingGapMedian = targetBestMedian - currentBestMedian;
  const betterLongTermDirection: BetterLongTermDirection =
    targetBestMedian > currentBestMedian * 1.08
      ? "target_role"
      : currentBestMedian > targetBestMedian * 1.08
        ? "current_role"
        : "balanced";

  const baseProbability =
    input.target_experience_level === "practical" ? 0.72 : input.target_experience_level === "basic" ? 0.61 : 0.47;
  const englishAdjustment =
    input.english_level === "advanced"
      ? 0.06
      : input.english_level === "upper_intermediate"
        ? 0.04
        : input.english_level === "basic" && input.target_market !== "ukraine"
          ? -0.08
          : 0;
  const probability = clamp(baseProbability + englishAdjustment, 0.34, 0.86);
  const baseMonths =
    (input.target_experience_level === "practical" ? 6 : input.target_experience_level === "basic" ? 9 : 12) +
    (input.english_level === "basic" && input.target_market !== "ukraine" ? 2 : 0) -
    (input.transition_priority === "speed" ? 1 : 0);
  const offerBaseMonths = Math.max(3, baseMonths);
  const targetEntryLevel = getTargetEntryLevel(input.target_experience_level);
  const riskLevel: RiskLevel =
    probability < 0.52 || (input.transition_priority === "income" && targetEntryMedian < currentMedian * 0.85)
      ? "high"
      : probability < 0.66
        ? "medium"
        : "low";
  const verdictLabel: VerdictLabel = betterLongTermDirection === "target_role" ? "switch" : "depends";
  const marketScopeLabel = getMarketScopeLabel(input.target_market);
  const generatedAt = new Date().toISOString();

  return {
    analysis: {
      market_profile: {
        current_role: {
          canonical_title: currentTitle,
          market_scope_label: "Україна",
          current_level_estimate: input.years_in_current_role >= 5 ? "senior" : input.years_in_current_role >= 2 ? "middle" : "junior",
          current_market_salary_range: buildSalaryRange(currentMedian),
          senior_salary_range: buildSalaryRange(currentSeniorMedian),
          best_case_level: "lead",
          best_case_salary_range: buildSalaryRange(currentBestMedian),
          confidence: 0.72,
          caveats: ["Локальний test mode використовує фіксований прогноз без зовнішнього AI-запиту."],
          summary: `Поточна роль ${currentTitle} взята як стартова точка для перевірки всього сценарію.`
        },
        target_role: {
          canonical_title: targetTitle,
          market_scope_label: marketScopeLabel,
          entry_level_for_switcher: targetEntryLevel,
          entry_salary_range: buildSalaryRange(targetEntryMedian),
          senior_salary_range: buildSalaryRange(targetSeniorMedian),
          best_case_level: "lead",
          best_case_salary_range: buildSalaryRange(targetBestMedian),
          time_to_first_offer_months: {
            optimistic: Math.max(2, offerBaseMonths - 3),
            base: offerBaseMonths,
            pessimistic: offerBaseMonths + 4
          },
          probability_of_getting_job_within_12_months: probability,
          confidence: 0.7,
          caveats: ["Прогноз призначений для локальної автоматичної перевірки flow, а не для реальної консультації."],
          summary: `Цільова роль ${targetTitle} оцінена для ринку: ${marketScopeLabel}.`
        },
        comparison: {
          better_long_term_direction: betterLongTermDirection,
          better_long_term_label:
            betterLongTermDirection === "target_role"
              ? targetTitle
              : betterLongTermDirection === "current_role"
                ? currentTitle
                : "Баланс між поточною та цільовою роллю",
          ceiling_gap_median: ceilingGapMedian,
          interpretation:
            ceilingGapMedian >= 0
              ? "Цільовий ринок має вищу довгострокову стелю, але потребує поетапної підготовки."
              : "Поточний напрям виглядає фінансово сильнішим, тому зміну варто робити тільки з чітким планом."
        }
      },
      narrative: {
        verdict_label: verdictLabel,
        headline: `${targetTitle}: тестовий прогноз готовий`,
        summary:
          "Decivio сформував контрольний результат без витрати OpenAI-запиту. Цей висновок потрібен, щоб автоматично перевірити шлях від симуляції до оплати й кабінету.",
        why_this_result: [
          `Поточний дохід ${currentMedian} грн/міс використано як базу для порівняння.`,
          `Цільовий ринок: ${marketScopeLabel}.`,
          `Ймовірність отримати перший офер за 12 місяців оцінена на ${Math.round(probability * 100)}%.`
        ],
        personalization_notes: [
          `Поточна роль: ${currentTitle}.`,
          `Цільова роль: ${targetTitle}.`,
          input.transition_priority === "income"
            ? "У прогнозі підсилено фокус на доході."
            : "У прогнозі підсилено фокус на швидкості результату."
        ],
        cta_title: "Відкрити практичний план підсилення",
        cta_body: "Після оплати Decivio має прив'язати цей сценарій до акаунта і відкрити кабінет."
      },
      guidance: {
        risk_assessment: {
          level: riskLevel,
          summary:
            riskLevel === "high"
              ? "Ризик підвищений: потрібен запас часу, докази досвіду і реалістичний план підготовки."
              : riskLevel === "medium"
                ? "Ризик помірний: сценарій виглядає можливим, якщо рухатись поетапно."
                : "Ризик контрольований: стартові умови достатньо сильні для активного пошуку."
        }
      }
    },
    meta: {
      model: "decivio-local-test-mock",
      latency_ms: 0,
      web_search_used: false,
      request_id: `test-${Date.now()}`,
      generated_at: generatedAt
    }
  };
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

  if (isLocalTestModeEnabled()) {
    return buildMockCareerSwitchAnalysis(input);
  }

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
