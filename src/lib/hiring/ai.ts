import "server-only";

import OpenAI from "openai";
import { isLocalTestModeEnabled } from "@/lib/test-mode";
import type {
  CandidateAnswer,
  CandidateScreening,
  VacancyBrief,
  VacancyContent,
} from "@/lib/hiring/types";
import { parseCandidateScreening, parseVacancyContent } from "@/lib/hiring/validate";

const DEFAULT_MODEL = "gpt-5.4-mini";
const FALLBACK_MODEL = "gpt-4.1";

const stringList = { type: "array", items: { type: "string" } } as const;

const vacancySchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "summary",
    "pay_hint",
    "pay_note",
    "schedule",
    "offer",
    "duties",
    "requirements",
    "posting_text",
    "questions",
    "red_flags",
  ],
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    pay_hint: { type: "string" },
    pay_note: { type: "string" },
    schedule: { type: "string" },
    offer: stringList,
    duties: stringList,
    requirements: stringList,
    posting_text: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "kind", "options", "knockout_answer"],
        properties: {
          text: { type: "string" },
          kind: { type: "string", enum: ["yes_no", "choice", "text"] },
          options: stringList,
          knockout_answer: { type: ["string", "null"] },
        },
      },
    },
    red_flags: stringList,
  },
} as const;

const screeningSchema = {
  type: "object",
  additionalProperties: false,
  required: ["score", "verdict", "headline", "strengths", "risks", "knockouts", "interview_questions"],
  properties: {
    score: { type: "number" },
    verdict: { type: "string", enum: ["call", "maybe", "reject"] },
    headline: { type: "string" },
    strengths: stringList,
    risks: stringList,
    knockouts: stringList,
    interview_questions: stringList,
  },
} as const;

const FAIRNESS_RULES = [
  "Заборонено дискримінацію: не питай і не оцінюй вік, стать, сімейний стан, наявність дітей, вагітність, здоров'я, інвалідність, національність, релігію, зовнішність.",
  "Не вигадуй фактів, яких немає у вхідних даних.",
];

function createClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 1, timeout: 45_000 });
}

function getModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

function isModelSupportError(error: unknown) {
  const maybeError = error as { status?: number; message?: string } | null;
  const message = typeof maybeError?.message === "string" ? maybeError.message.toLowerCase() : "";

  return (
    maybeError?.status === 404 ||
    (message.includes("model") &&
      (message.includes("not found") || message.includes("does not exist") || message.includes("not available")))
  );
}

async function requestStructured(options: {
  name: string;
  schema: object;
  instructions: string;
  input: string;
  maxOutputTokens: number;
}): Promise<unknown> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error("ШІ-сервіс не налаштовано: відсутній OPENAI_API_KEY.");
  }

  const run = async (model: string) => {
    const response = await createClient().responses.create({
      model,
      instructions: options.instructions,
      input: options.input,
      max_output_tokens: options.maxOutputTokens,
      store: false,
      text: {
        format: { type: "json_schema", name: options.name, strict: true, schema: options.schema as Record<string, unknown> },
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    const raw = response.output_text?.trim();
    if (!raw) {
      throw new Error("ШІ-сервіс повернув порожню відповідь.");
    }

    return JSON.parse(raw) as unknown;
  };

  const model = getModel();
  try {
    return await run(model);
  } catch (error) {
    if (!isModelSupportError(error) || model === FALLBACK_MODEL) {
      throw error;
    }

    return run(FALLBACK_MODEL);
  }
}

// ---------------------------------------------------------------------------
// Vacancy draft
// ---------------------------------------------------------------------------

function buildVacancyInstructions() {
  return [
    "Ти досвідчений рекрутер для малого й середнього бізнесу в Україні (кафе, ритейл, логістика, будівництво, виробництво, сервіс).",
    `Сьогодні: ${new Date().toISOString().slice(0, 10)}.`,
    "Роботодавець коротко описав, кого шукає. Склади сильну, чесну вакансію українською мовою, яка приваблює саме потрібних людей.",
    "title: коротка назва посади, як її шукають кандидати (наприклад, 'Бариста', 'Водій категорії C').",
    "summary: 1–2 речення, чому тут варто працювати.",
    "pay_hint: конкретна сума або діапазон у грн на місяць (або за зміну/годину, якщо так прийнято для ролі), формат '24 000 – 30 000 грн/міс'. Якщо роботодавець вказав оплату — використай її. Якщо ні — дай реалістичну ринкову оцінку для міста й ролі на 2026 рік.",
    "Орієнтири ринку 2026: медіанна зарплата у вакансіях ~28 000 грн/міс; через дефіцит кадрів зарплати лінійного персоналу у великих містах (Київ, Львів, Дніпро, Одеса) зазвичай 22 000–35 000 грн, робітничі спеціальності (водії C/E, зварювальники, електрики) 30 000–50 000+ грн; у малих містах на 15–25% нижче. Не занижуй оплату — занижена вакансія не збирає відгуків.",
    "Якщо місто не вказано, не вигадуй його і орієнтуйся на велике місто.",
    "pay_note: одне речення-пояснення до оплати (наприклад, що це орієнтир ринку, або від чого залежить бонус).",
    "schedule: графік коротко.",
    "offer: 3–6 пунктів, що отримує працівник. duties: 3–6 обов'язків. requirements: 2–5 справді обов'язкових вимог, без зайвого.",
    "posting_text: готовий текст оголошення для Work.ua / OLX / Telegram-каналу: заголовок, оплата, графік, що пропонуємо, обов'язки, вимоги, заклик пройти коротку анкету за посиланням (напиши '👉 Відгукнутися за 2 хвилини: [посилання]'). Без markdown-заголовків #, можна емодзі помірно, списки через '• '. Між блоками обов'язково порожній рядок (\\n\\n), щоб текст легко читався з телефону.",
    "questions: 4–6 коротких питань для анкети кандидата, які допоможуть роботодавцю відсіяти невідповідних ДО дзвінка. Перевага питанням yes_no і choice (на телефоні відповідати швидше). Обов'язково: готовність до графіка, час дороги до роботи (choice: 'До 30 хвилин', '30–60 хвилин', 'Більше години'), ключовий досвід/навичка, коли може почати. Одне питання kind=text про досвід. Питання формулюй на 'ви', коротко, без канцеляриту.",
    "Для питань-фільтрів (без яких людина точно не підходить) заповни knockout_answer точним текстом варіанту, що дискваліфікує (для yes_no це 'Так' або 'Ні'). Для решти knockout_answer = null. Для yes_no options = ['Так','Ні']. Для text options = [].",
    "red_flags: 2–4 ознаки в відповідях, на які роботодавцю варто звернути увагу.",
    ...FAIRNESS_RULES,
    "Поверни лише JSON за схемою.",
  ].join("\n");
}

export async function generateVacancyDraft(brief: VacancyBrief): Promise<VacancyContent> {
  if (isLocalTestModeEnabled()) {
    return buildMockVacancy(brief);
  }

  const raw = await requestStructured({
    name: "decivio_vacancy",
    schema: vacancySchema,
    instructions: buildVacancyInstructions(),
    input: JSON.stringify(brief, null, 2),
    maxOutputTokens: 3000,
  });

  return parseVacancyContent(raw);
}

// ---------------------------------------------------------------------------
// Candidate screening
// ---------------------------------------------------------------------------

export function findKnockouts(vacancy: VacancyContent, answers: CandidateAnswer[]) {
  return vacancy.questions
    .filter((question) => question.knockout_answer)
    .filter((question) => {
      const answer = answers.find((item) => item.question_id === question.id);
      return answer?.answer === question.knockout_answer;
    })
    .map((question) => `${question.text} — «${question.knockout_answer}»`);
}

function buildScreeningInstructions() {
  return [
    "Ти рекрутер-асистент власника малого бізнесу в Україні. Оціни відповідь кандидата на вакансію.",
    "score 0..100: наскільки варто дзвонити цьому кандидату. Будь реалістичним, не завищуй.",
    "verdict: call (дзвонити першим, score ≥ 70), maybe (40–69), reject (< 40 або є критичний фільтр).",
    "Якщо в hard_knockouts є пункти — verdict = reject, score ≤ 30, перелічи їх у knockouts.",
    "headline: одне речення-висновок для власника, без води.",
    "strengths і risks: по 1–4 коротких пункти, лише на основі відповідей.",
    "interview_questions: 2–3 конкретні питання для телефонної розмови, щоб перевірити слабкі місця.",
    "Відповіді коротких анкет часто лаконічні — це нормально, не штрафуй за стиль чи помилки в тексті.",
    ...FAIRNESS_RULES,
    "Поверни лише JSON за схемою.",
  ].join("\n");
}

export async function screenCandidate(input: {
  vacancy: VacancyContent;
  answers: CandidateAnswer[];
  about: string | null;
}): Promise<CandidateScreening> {
  const knockouts = findKnockouts(input.vacancy, input.answers);

  if (isLocalTestModeEnabled()) {
    return buildMockScreening(input.answers, input.about, knockouts);
  }

  const raw = await requestStructured({
    name: "decivio_screening",
    schema: screeningSchema,
    instructions: buildScreeningInstructions(),
    input: JSON.stringify(
      {
        vacancy: {
          title: input.vacancy.title,
          requirements: input.vacancy.requirements,
          duties: input.vacancy.duties,
          schedule: input.vacancy.schedule,
          red_flags: input.vacancy.red_flags,
        },
        answers: input.answers,
        about_candidate: input.about,
        hard_knockouts: knockouts,
      },
      null,
      2,
    ),
    maxOutputTokens: 1200,
  });

  const screening = parseCandidateScreening(raw);

  if (knockouts.length > 0) {
    return {
      ...screening,
      verdict: "reject",
      score: Math.min(screening.score, 30),
      knockouts: Array.from(new Set([...knockouts, ...screening.knockouts])),
    };
  }

  return screening;
}

// ---------------------------------------------------------------------------
// Test-mode mocks (deterministic, no OpenAI calls)
// ---------------------------------------------------------------------------

function guessTitle(brief: string) {
  const firstChunk = brief.split(/[,.;\n]/)[0]?.trim() ?? "";
  const cleaned = firstChunk.replace(/^(шукаю|шукаємо|потрібен|потрібна|потрібні|треба|ищу|нужен)\s+/i, "");
  const title = cleaned.length > 2 && cleaned.length < 60 ? cleaned : "Працівник";
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function buildMockVacancy(brief: VacancyBrief): VacancyContent {
  const title = guessTitle(brief.brief);
  const city = brief.city ?? "Київ";
  const pay = brief.pay ?? "22 000 – 28 000 грн/міс";
  const schedule = brief.schedule ?? "2/2 по 11 годин";

  return {
    title,
    summary: `Стабільна команда в місті ${city}, офіційне оформлення і виплати без затримок.`,
    pay_hint: pay,
    pay_note: "Тестовий режим: орієнтир згенеровано без ШІ.",
    schedule,
    offer: ["Офіційне оформлення", "Виплати двічі на місяць", "Навчання з першого дня", "Знижки для персоналу"],
    duties: ["Робота з клієнтами", "Підтримка порядку на робочому місці", "Виконання стандартів сервісу"],
    requirements: ["Відповідальність і пунктуальність", "Готовність працювати за графіком"],
    posting_text: [
      `${title} — ${city}`,
      `💰 ${pay}`,
      `🕒 ${schedule}`,
      "",
      "Що пропонуємо:",
      "• Офіційне оформлення",
      "• Виплати двічі на місяць",
      "• Навчання з першого дня",
      "",
      "👉 Відгукнутися за 2 хвилини: [посилання]",
    ].join("\n"),
    questions: [
      { id: "q1", text: `Чи підходить вам графік ${schedule}?`, kind: "yes_no", options: ["Так", "Ні"], knockout_answer: "Ні" },
      {
        id: "q2",
        text: "Скільки часу вам добиратися до роботи?",
        kind: "choice",
        options: ["До 30 хвилин", "30–60 хвилин", "Більше години"],
        knockout_answer: null,
      },
      {
        id: "q3",
        text: "Чи є у вас досвід на схожій посаді?",
        kind: "choice",
        options: ["Немає", "До 1 року", "1–3 роки", "Більше 3 років"],
        knockout_answer: null,
      },
      {
        id: "q4",
        text: "Коли можете почати?",
        kind: "choice",
        options: ["Одразу", "Через тиждень", "Через 2+ тижні"],
        knockout_answer: null,
      },
      { id: "q5", text: "Коротко опишіть ваш досвід", kind: "text", options: [], knockout_answer: null },
    ],
    red_flags: ["Часта зміна місць роботи без пояснень", "Не готовий до графіка вихідних"],
  };
}

function buildMockScreening(answers: CandidateAnswer[], about: string | null, knockouts: string[]): CandidateScreening {
  if (knockouts.length > 0) {
    return {
      score: 18,
      verdict: "reject",
      headline: "Не проходить обов'язковий фільтр вакансії.",
      strengths: [],
      risks: ["Відповідь на ключове питання не відповідає умовам"],
      knockouts,
      interview_questions: [],
    };
  }

  const text = answers.map((item) => item.answer.toLowerCase()).join(" ") + " " + (about ?? "").toLowerCase();
  let score = 55;
  if (text.includes("більше 3") || text.includes("1–3")) score += 18;
  if (text.includes("одразу")) score += 10;
  if (text.includes("до 30")) score += 8;
  if (text.includes("більше години")) score -= 15;
  if (text.includes("немає")) score -= 12;
  score = Math.max(5, Math.min(96, score));

  return {
    score,
    verdict: score >= 70 ? "call" : score >= 40 ? "maybe" : "reject",
    headline: score >= 70 ? "Сильний кандидат — варто подзвонити сьогодні." : "Є питання, уточніть під час дзвінка.",
    strengths: score >= 70 ? ["Релевантний досвід", "Готовий почати швидко"] : ["Готовий до графіка"],
    risks: score >= 70 ? [] : ["Мало досвіду або далеко добиратися"],
    knockouts: [],
    interview_questions: ["Розкажіть про останнє місце роботи: що робили щодня?", "Чому шукаєте роботу зараз?"],
  };
}
