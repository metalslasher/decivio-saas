export type ScreeningQuestionKind = "yes_no" | "choice" | "text";

export type ScreeningQuestion = {
  id: string;
  text: string;
  kind: ScreeningQuestionKind;
  options: string[];
  /** Answer that disqualifies the candidate (yes_no / choice only). */
  knockout_answer: string | null;
};

export type VacancyContent = {
  title: string;
  summary: string;
  pay_hint: string;
  pay_note: string;
  schedule: string;
  offer: string[];
  duties: string[];
  requirements: string[];
  posting_text: string;
  questions: ScreeningQuestion[];
  red_flags: string[];
};

export type VacancyBrief = {
  brief: string;
  city: string | null;
  pay: string | null;
  schedule: string | null;
};

export type CandidateAnswer = {
  question_id: string;
  question: string;
  answer: string;
};

export type ScreeningVerdict = "call" | "maybe" | "reject";

export type CandidateScreening = {
  score: number;
  verdict: ScreeningVerdict;
  headline: string;
  strengths: string[];
  risks: string[];
  knockouts: string[];
  interview_questions: string[];
};

export type ApplicationStatus = "new" | "invited" | "hired" | "rejected";

export type VacancyStatus = "active" | "closed";

export type VacancySummary = {
  id: string;
  slug: string;
  status: VacancyStatus;
  title: string;
  city: string | null;
  created_at: string;
  applications_total: number;
  applications_strong: number;
  applications_new: number;
};

export type VacancyDetail = {
  id: string;
  slug: string;
  status: VacancyStatus;
  title: string;
  city: string | null;
  brief: string;
  content: VacancyContent;
  created_at: string;
};

export type ApplicationRecord = {
  id: string;
  candidate_name: string;
  candidate_phone: string;
  answers: CandidateAnswer[];
  about: string | null;
  screening: CandidateScreening | null;
  score: number | null;
  verdict: ScreeningVerdict | null;
  status: ApplicationStatus;
  created_at: string;
};

export type PublicVacancy = {
  slug: string;
  title: string;
  city: string | null;
  summary: string;
  pay_hint: string;
  schedule: string;
  offer: string[];
  duties: string[];
  requirements: string[];
  questions: ScreeningQuestion[];
  is_open: boolean;
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: "Новий",
  invited: "Запрошено",
  hired: "Найнято",
  rejected: "Відмова",
};

export const VERDICT_LABELS: Record<ScreeningVerdict, string> = {
  call: "Дзвонити першим",
  maybe: "Можливо",
  reject: "Не підходить",
};
