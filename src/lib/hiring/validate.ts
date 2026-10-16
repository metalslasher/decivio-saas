import type {
  CandidateScreening,
  ScreeningQuestion,
  ScreeningQuestionKind,
  ScreeningVerdict,
  VacancyContent,
} from "@/lib/hiring/types";

export const MAX_QUESTIONS = 8;
const MAX_LIST_ITEMS = 10;
const MAX_SHORT_TEXT = 400;
const MAX_POSTING_TEXT = 6000;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown, field: string, maxLength = MAX_SHORT_TEXT) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Поле "${field}" порожнє або некоректне.`);
  }

  return value.trim().slice(0, maxLength);
}

function readOptionalText(value: unknown, maxLength = MAX_SHORT_TEXT) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function readList(value: unknown, field: string, { allowEmpty = false } = {}) {
  if (!Array.isArray(value)) {
    throw new Error(`Поле "${field}" має бути списком.`);
  }

  const items = value
    .map((item) => (typeof item === "string" ? item.trim().slice(0, MAX_SHORT_TEXT) : ""))
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);

  if (!allowEmpty && items.length === 0) {
    throw new Error(`Поле "${field}" має містити хоча б один пункт.`);
  }

  return items;
}

function readQuestionKind(value: unknown): ScreeningQuestionKind {
  return value === "yes_no" || value === "choice" || value === "text" ? value : "text";
}

function parseQuestion(value: unknown, index: number): ScreeningQuestion {
  if (!isRecord(value)) {
    throw new Error("Некоректне питання анкети.");
  }

  const kind = readQuestionKind(value.kind);
  const text = readText(value.text, "question.text", 240);
  let options =
    kind === "yes_no"
      ? ["Так", "Ні"]
      : kind === "choice"
        ? readList(value.options, "question.options").slice(0, 6)
        : [];

  if (kind === "choice" && options.length < 2) {
    options = [];
  }

  const resolvedKind: ScreeningQuestionKind = kind === "choice" && options.length === 0 ? "text" : kind;
  const knockoutRaw = typeof value.knockout_answer === "string" ? value.knockout_answer.trim() : "";
  const knockout_answer =
    resolvedKind !== "text" && knockoutRaw && options.includes(knockoutRaw) ? knockoutRaw : null;

  return {
    id: `q${index + 1}`,
    text,
    kind: resolvedKind,
    options,
    knockout_answer,
  };
}

export function parseVacancyContent(value: unknown): VacancyContent {
  if (!isRecord(value)) {
    throw new Error("Некоректна структура вакансії.");
  }

  if (!Array.isArray(value.questions) || value.questions.length === 0) {
    throw new Error("Додайте хоча б одне питання для кандидатів.");
  }

  return {
    title: readText(value.title, "title", 120),
    summary: readText(value.summary, "summary"),
    pay_hint: readText(value.pay_hint, "pay_hint", 160),
    pay_note: readOptionalText(value.pay_note),
    schedule: readText(value.schedule, "schedule", 200),
    offer: readList(value.offer, "offer"),
    duties: readList(value.duties, "duties"),
    requirements: readList(value.requirements, "requirements"),
    posting_text: readText(value.posting_text, "posting_text", MAX_POSTING_TEXT),
    questions: value.questions.slice(0, MAX_QUESTIONS).map(parseQuestion),
    red_flags: readList(value.red_flags, "red_flags", { allowEmpty: true }),
  };
}

function readVerdict(value: unknown): ScreeningVerdict {
  return value === "call" || value === "maybe" || value === "reject" ? value : "maybe";
}

export function parseCandidateScreening(value: unknown): CandidateScreening {
  if (!isRecord(value)) {
    throw new Error("Некоректна оцінка кандидата.");
  }

  const rawScore = typeof value.score === "number" && Number.isFinite(value.score) ? value.score : 50;

  return {
    score: Math.round(Math.min(100, Math.max(0, rawScore))),
    verdict: readVerdict(value.verdict),
    headline: readText(value.headline, "headline", 200),
    strengths: readList(value.strengths, "strengths", { allowEmpty: true }),
    risks: readList(value.risks, "risks", { allowEmpty: true }),
    knockouts: readList(value.knockouts, "knockouts", { allowEmpty: true }),
    interview_questions: readList(value.interview_questions, "interview_questions", { allowEmpty: true }),
  };
}

export function normalizePhone(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const digits = value.replace(/\D+/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return `+38${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("380")) {
    return `+${digits}`;
  }

  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}
