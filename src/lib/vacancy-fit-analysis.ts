import "server-only";

import OpenAI from "openai";
import { isLocalTestModeEnabled } from "@/lib/test-mode";

export type VacancyFitVerdict = "apply" | "maybe" | "skip";

export type VacancyFitAnalysis = {
  verdict: VacancyFitVerdict;
  fit_score: number;
  headline: string;
  summary: string;
  salary_angle: string;
  strongest_matches: string[];
  gaps_or_risks: string[];
  resume_adjustments: string[];
  interview_salary_talking_points: string[];
  next_action: string;
  caveats: string[];
};

export type VacancyFitContext = {
  currentRole: string | null;
  targetRole: string | null;
  currentIncome: number | null;
  desiredIncome: number | null;
  currentMarket: string | null;
  targetMarket: string | null;
  seniorityLevel: string | null;
  englishLevel: string | null;
  jobSearchStatus: string | null;
  resumeStatus: string | null;
  marketVerdict: string | null;
  riskLevel: string | null;
};

export type VacancyFitAnalysisRequest = {
  vacancyText: string;
  resumeText: string | null;
  context: VacancyFitContext;
};

export type VacancyFitAnalysisResult = {
  analysis: VacancyFitAnalysis;
  meta: {
    model: string;
    latency_ms: number;
    request_id: string | null;
    generated_at: string;
    test_mode: boolean;
  };
};

const DEFAULT_MODEL = "gpt-5.4-mini";
const FALLBACK_MODEL = "gpt-4.1";
const VACANCY_FIT_SCHEMA_NAME = "decivio_vacancy_fit";

const vacancyFitSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "verdict",
    "fit_score",
    "headline",
    "summary",
    "salary_angle",
    "strongest_matches",
    "gaps_or_risks",
    "resume_adjustments",
    "interview_salary_talking_points",
    "next_action",
    "caveats",
  ],
  properties: {
    verdict: { type: "string", enum: ["apply", "maybe", "skip"] },
    fit_score: { type: "number" },
    headline: { type: "string" },
    summary: { type: "string" },
    salary_angle: { type: "string" },
    strongest_matches: { type: "array", items: { type: "string" } },
    gaps_or_risks: { type: "array", items: { type: "string" } },
    resume_adjustments: { type: "array", items: { type: "string" } },
    interview_salary_talking_points: { type: "array", items: { type: "string" } },
    next_action: { type: "string" },
    caveats: { type: "array", items: { type: "string" } },
  },
} as const;

function toObject(value: unknown, fieldName: string) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Некоректне поле "${fieldName}" у vacancy_fit.`);
  }

  return value as Record<string, unknown>;
}

function toNonEmptyString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Некоректне поле "${fieldName}" у vacancy_fit.`);
  }

  return value.trim();
}

function toStringArray(value: unknown, fieldName: string) {
  if (!Array.isArray(value)) {
    throw new Error(`Некоректне поле "${fieldName}" у vacancy_fit.`);
  }

  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  if (items.length === 0) {
    throw new Error(`Поле "${fieldName}" має містити хоча б один рядок.`);
  }

  return items.slice(0, 8);
}

function parseVerdict(value: unknown): VacancyFitVerdict {
  const normalized = toNonEmptyString(value, "verdict").toLowerCase();

  if (normalized === "apply" || normalized === "maybe" || normalized === "skip") {
    return normalized;
  }

  throw new Error('Поле "verdict" має бути apply|maybe|skip.');
}

function parseFitScore(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error('Поле "fit_score" має бути числом.');
  }

  return Math.round(Math.min(100, Math.max(0, value)));
}

export function validateVacancyFitAnalysis(value: unknown): VacancyFitAnalysis {
  const raw = toObject(value, "vacancy_fit");

  return {
    verdict: parseVerdict(raw.verdict),
    fit_score: parseFitScore(raw.fit_score),
    headline: toNonEmptyString(raw.headline, "headline"),
    summary: toNonEmptyString(raw.summary, "summary"),
    salary_angle: toNonEmptyString(raw.salary_angle, "salary_angle"),
    strongest_matches: toStringArray(raw.strongest_matches, "strongest_matches"),
    gaps_or_risks: toStringArray(raw.gaps_or_risks, "gaps_or_risks"),
    resume_adjustments: toStringArray(raw.resume_adjustments, "resume_adjustments"),
    interview_salary_talking_points: toStringArray(
      raw.interview_salary_talking_points,
      "interview_salary_talking_points",
    ),
    next_action: toNonEmptyString(raw.next_action, "next_action"),
    caveats: toStringArray(raw.caveats, "caveats"),
  };
}

function getMissingOpenAiEnv() {
  return ["OPENAI_API_KEY"].filter((name) => {
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
    timeout: 45_000,
  });
}

function isModelSupportError(error: unknown) {
  const maybeError = error as { status?: number; message?: string } | null;
  const message =
    typeof maybeError?.message === "string" ? maybeError.message.toLowerCase() : "";

  return (
    maybeError?.status === 404 ||
    (message.includes("model") &&
      (message.includes("not found") ||
        message.includes("does not exist") ||
        message.includes("not available")))
  );
}

function buildSystemInstructions(currentDate: string) {
  return [
    "Ти кар'єрний стратег для українських спеціалістів, які активно шукають сильнішу роботу.",
    `Сьогоднішня дата: ${currentDate}.`,
    "Завдання: проаналізувати конкретну вакансію проти профілю користувача Decivio.",
    "Поверни один валідний JSON-об'єкт за схемою.",
    "Пиши українською, практично й без мотиваційної води.",
    "Не гарантуй офер, працевлаштування або підвищення зарплати.",
    "Оціни, чи варто подаватися: apply, maybe або skip.",
    "fit_score має бути 0..100 і відповідати реальному рівню відповідності, а не бути завжди оптимістичним.",
    "Поясни salary_angle як позицію для розмови про зарплату, а не як гарантований ринковий факт.",
    "Resume adjustments мають бути конкретними: що підсвітити, що переписати, які докази додати.",
    "Interview talking points мають допомогти пояснити релевантність, ризики і зарплатні очікування.",
    "Якщо даних мало або вакансія нечітка, знизь score і додай caveat.",
    "Не вигадуй фактів про користувача, яких немає у вхідних даних.",
    "Не поверни markdown і не додавай текст поза JSON.",
  ].join("\n");
}

function buildUserInput(input: VacancyFitAnalysisRequest) {
  return JSON.stringify(
    {
      product_context:
        "Decivio paid workspace. The output should help the user decide whether to apply and how to adapt resume/interview/salary positioning.",
      user_context: input.context,
      vacancy_text: input.vacancyText,
      resume_text: input.resumeText,
    },
    null,
    2,
  );
}

function includesAny(source: string, values: Array<string | null>) {
  const normalizedSource = source.toLowerCase();

  return values
    .filter((value): value is string => typeof value === "string" && value.trim() !== "")
    .some((value) => {
      const words = value
        .toLowerCase()
        .split(/[^a-zа-яіїєґ0-9+#]+/i)
        .filter((word) => word.length >= 3);

      return words.some((word) => normalizedSource.includes(word));
    });
}

function buildMockVacancyFitAnalysis(input: VacancyFitAnalysisRequest): VacancyFitAnalysisResult {
  const vacancy = input.vacancyText.toLowerCase();
  const hasRoleMatch = includesAny(vacancy, [
    input.context.targetRole,
    input.context.currentRole,
  ]);
  const hasEnglishSignal =
    vacancy.includes("english") ||
    vacancy.includes("англ") ||
    vacancy.includes("b2") ||
    vacancy.includes("upper");
  const hasSalarySignal =
    vacancy.includes("salary") ||
    vacancy.includes("зарп") ||
    vacancy.includes("$") ||
    vacancy.includes("грн");
  const score = Math.min(
    92,
    Math.max(
      42,
      58 +
        (hasRoleMatch ? 18 : 0) +
        (input.resumeText ? 8 : 0) +
        (hasEnglishSignal && input.context.englishLevel !== "basic" ? 6 : 0) +
        (hasSalarySignal ? 4 : 0),
    ),
  );
  const verdict: VacancyFitVerdict =
    score >= 74 ? "apply" : score >= 56 ? "maybe" : "skip";

  return {
    analysis: {
      verdict,
      fit_score: score,
      headline:
        verdict === "apply"
          ? "Вакансія виглядає вартою подачі"
          : verdict === "maybe"
            ? "Вакансію варто перевірити точніше перед подачею"
            : "Вакансія поки виглядає слабкою ціллю",
      summary:
        "Це test-mode оцінка без OpenAI-запиту. Вона перевіряє, чи workspace, авторизація і платний flow працюють наскрізно.",
      salary_angle:
        input.context.desiredIncome && input.context.currentIncome
          ? `Позиціонуйте очікування через приріст від ${input.context.currentIncome} до ${input.context.desiredIncome} грн/міс, але прив'яжіть суму до вимог вакансії та доказів досвіду.`
          : "Підготуйте зарплатну позицію після уточнення поточного й бажаного доходу.",
      strongest_matches: [
        hasRoleMatch
          ? "У тексті вакансії є перетин із вашою поточною або цільовою роллю."
          : "Вакансія може бути релевантною, але роль не збігається очевидно з профілем.",
        input.context.seniorityLevel
          ? `У профілі є рівень ${input.context.seniorityLevel}, його варто прямо показати в резюме.`
          : "Рівень seniority не зафіксований, тому відповідність треба доводити прикладами.",
      ],
      gaps_or_risks: [
        hasEnglishSignal && input.context.englishLevel === "basic"
          ? "Вакансія має англомовний сигнал, а поточний рівень англійської може бути ризиком."
          : "Перевірте, чи в резюме є докази саме під ключові вимоги вакансії.",
        "Без повного резюме оцінка не може точно передбачити відповідь рекрутера.",
      ],
      resume_adjustments: [
        "Перший блок резюме перепишіть під вимоги цієї вакансії, а не як загальний опис досвіду.",
        "Додайте 2-3 вимірювані результати, які збігаються з очікуваннями ролі.",
        "Підсвітіть інструменти, домени й типи задач, які прямо згадані у вакансії.",
      ],
      interview_salary_talking_points: [
        "Поясніть, чому ваш досвід скорочує час входу в роль.",
        "Підготуйте один приклад результату, який підтверджує seniority.",
        "Зарплатне очікування формулюйте як діапазон, прив'язаний до відповідальності ролі.",
      ],
      next_action:
        verdict === "apply"
          ? "Адаптуйте верхній блок резюме під цю вакансію і подавайтеся."
          : verdict === "maybe"
            ? "Спочатку уточніть слабкі місця в резюме, потім вирішуйте щодо подачі."
            : "Краще знайти ближчу вакансію або суттєво переробити позиціонування.",
      caveats: [
        "Test mode не робить реального AI-аналізу.",
        "Оцінка не гарантує відповідь рекрутера або офер.",
      ],
    },
    meta: {
      model: "decivio-local-test-mock",
      latency_ms: 0,
      request_id: `test-${Date.now()}`,
      generated_at: new Date().toISOString(),
      test_mode: true,
    },
  };
}

async function requestVacancyFitAttempt(
  input: VacancyFitAnalysisRequest,
  model: string,
): Promise<VacancyFitAnalysisResult> {
  const client = createOpenAiClient();
  const startedAt = Date.now();

  const response = await client.responses.create({
    model,
    instructions: buildSystemInstructions(new Date().toISOString().slice(0, 10)),
    input: buildUserInput(input),
    temperature: 0.25,
    max_output_tokens: 2600,
    store: false,
    text: {
      format: {
        type: "json_schema",
        name: VACANCY_FIT_SCHEMA_NAME,
        strict: true,
        schema: vacancyFitSchema,
      },
    },
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  const rawContent = response.output_text?.trim();
  if (!rawContent) {
    throw new Error("Сервіс аналізу вакансії повернув порожню відповідь.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error("Сервіс аналізу вакансії повернув невалідний JSON.");
  }

  return {
    analysis: validateVacancyFitAnalysis(parsed),
    meta: {
      model,
      latency_ms: Date.now() - startedAt,
      request_id: response._request_id ?? null,
      generated_at: new Date().toISOString(),
      test_mode: false,
    },
  };
}

export async function generateVacancyFitAnalysis(
  input: VacancyFitAnalysisRequest,
): Promise<VacancyFitAnalysisResult> {
  if (input.vacancyText.trim().length < 80) {
    throw new Error("Додайте повніший текст вакансії для аналізу.");
  }

  if (isLocalTestModeEnabled()) {
    return buildMockVacancyFitAnalysis(input);
  }

  const missingOpenAiEnv = getMissingOpenAiEnv();
  if (missingOpenAiEnv.length > 0) {
    throw new Error(
      `Сервіс аналізу вакансії не налаштовано. Відсутні env змінні: ${missingOpenAiEnv.join(", ")}.`,
    );
  }

  const configuredModel = getConfiguredModel();

  try {
    return await requestVacancyFitAttempt(input, configuredModel);
  } catch (error) {
    if (!isModelSupportError(error) || configuredModel === FALLBACK_MODEL) {
      throw error;
    }

    return requestVacancyFitAttempt(input, FALLBACK_MODEL);
  }
}

