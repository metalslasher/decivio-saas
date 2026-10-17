import "server-only";

import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ApplicationRecord,
  ApplicationStatus,
  CandidateAnswer,
  CandidateScreening,
  PublicVacancy,
  VacancyContent,
  VacancyDetail,
  VacancyStatus,
  VacancySummary,
} from "@/lib/hiring/types";
import { parseVacancyContent } from "@/lib/hiring/validate";

type VacancyRow = {
  id: string;
  owner_id: string;
  slug: string;
  status: VacancyStatus;
  title: string;
  city: string | null;
  brief: string;
  content: unknown;
  created_at: string;
};

type ApplicationRow = {
  id: string;
  vacancy_id: string;
  candidate_name: string;
  candidate_phone: string;
  answers: unknown;
  about: string | null;
  screening: unknown;
  score: number | null;
  verdict: ApplicationRecord["verdict"];
  status: ApplicationStatus;
  source: ApplicationRecord["source"] | null;
  created_at: string;
};

const SLUG_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function createSlug() {
  const bytes = randomBytes(8);
  return Array.from(bytes, (byte) => SLUG_ALPHABET[byte % SLUG_ALPHABET.length]).join("");
}

function toVacancyDetail(row: VacancyRow): VacancyDetail {
  return {
    id: row.id,
    owner_id: row.owner_id,
    slug: row.slug,
    status: row.status,
    title: row.title,
    city: row.city,
    brief: row.brief,
    content: parseVacancyContent(row.content),
    created_at: row.created_at,
  };
}

function toApplicationRecord(row: ApplicationRow): ApplicationRecord {
  return {
    id: row.id,
    candidate_name: row.candidate_name,
    candidate_phone: row.candidate_phone,
    answers: Array.isArray(row.answers) ? (row.answers as CandidateAnswer[]) : [],
    about: row.about,
    screening: (row.screening as CandidateScreening | null) ?? null,
    score: row.score,
    verdict: row.verdict,
    status: row.status,
    source: row.source ?? "web",
    created_at: row.created_at,
  };
}

export async function createVacancy(
  supabase: SupabaseClient,
  input: { ownerId: string; brief: string; city: string | null; content: VacancyContent },
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase
      .from("hiring_vacancies")
      .insert({
        owner_id: input.ownerId,
        slug: createSlug(),
        title: input.content.title,
        city: input.city,
        brief: input.brief,
        content: input.content,
      })
      .select("id, slug")
      .single<{ id: string; slug: string }>();

    if (!error && data) {
      return data;
    }

    if (error && error.code !== "23505") {
      throw new Error(`Не вдалося зберегти вакансію: ${error.message}`);
    }
  }

  throw new Error("Не вдалося створити унікальне посилання. Спробуйте ще раз.");
}

export async function listOwnerVacancies(supabase: SupabaseClient, ownerId: string): Promise<VacancySummary[]> {
  const { data: vacancies, error } = await supabase
    .from("hiring_vacancies")
    .select("id, slug, status, title, city, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Не вдалося завантажити вакансії: ${error.message}`);
  }

  const rows = (vacancies ?? []) as Array<Pick<VacancyRow, "id" | "slug" | "status" | "title" | "city" | "created_at">>;
  if (rows.length === 0) {
    return [];
  }

  const { data: applications, error: applicationsError } = await supabase
    .from("hiring_applications")
    .select("vacancy_id, verdict, status")
    .in(
      "vacancy_id",
      rows.map((row) => row.id),
    );

  if (applicationsError) {
    throw new Error(`Не вдалося завантажити кандидатів: ${applicationsError.message}`);
  }

  const appRows = (applications ?? []) as Array<Pick<ApplicationRow, "vacancy_id" | "verdict" | "status">>;

  return rows.map((row) => {
    const own = appRows.filter((app) => app.vacancy_id === row.id);
    return {
      ...row,
      applications_total: own.length,
      applications_strong: own.filter((app) => app.verdict === "call").length,
      applications_new: own.filter((app) => app.status === "new").length,
    };
  });
}

export async function getOwnerVacancy(supabase: SupabaseClient, ownerId: string, vacancyId: string) {
  const { data, error } = await supabase
    .from("hiring_vacancies")
    .select("*")
    .eq("id", vacancyId)
    .eq("owner_id", ownerId)
    .maybeSingle<VacancyRow>();

  if (error) {
    throw new Error(`Не вдалося завантажити вакансію: ${error.message}`);
  }

  return data ? toVacancyDetail(data) : null;
}

export async function listVacancyApplications(supabase: SupabaseClient, vacancyId: string) {
  const { data, error } = await supabase
    .from("hiring_applications")
    .select("*")
    .eq("vacancy_id", vacancyId)
    .order("score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Не вдалося завантажити кандидатів: ${error.message}`);
  }

  return ((data ?? []) as ApplicationRow[]).map(toApplicationRecord);
}

export async function updateVacancyStatus(
  supabase: SupabaseClient,
  ownerId: string,
  vacancyId: string,
  status: VacancyStatus,
) {
  const { data, error } = await supabase
    .from("hiring_vacancies")
    .update({ status })
    .eq("id", vacancyId)
    .eq("owner_id", ownerId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Не вдалося оновити вакансію: ${error.message}`);
  }

  return Boolean(data);
}

export async function updateVacancyContent(
  supabase: SupabaseClient,
  ownerId: string,
  vacancyId: string,
  content: VacancyContent,
) {
  const { data, error } = await supabase
    .from("hiring_vacancies")
    .update({ title: content.title, content })
    .eq("id", vacancyId)
    .eq("owner_id", ownerId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Не вдалося зберегти вакансію: ${error.message}`);
  }

  return Boolean(data);
}

export async function updateApplicationStatus(
  supabase: SupabaseClient,
  ownerId: string,
  applicationId: string,
  status: ApplicationStatus,
) {
  const { data: application, error } = await supabase
    .from("hiring_applications")
    .select("id, vacancy_id")
    .eq("id", applicationId)
    .maybeSingle<{ id: string; vacancy_id: string }>();

  if (error) {
    throw new Error(`Не вдалося знайти кандидата: ${error.message}`);
  }

  if (!application || !(await getOwnerVacancy(supabase, ownerId, application.vacancy_id))) {
    return false;
  }

  const { error: updateError } = await supabase
    .from("hiring_applications")
    .update({ status })
    .eq("id", applicationId);

  if (updateError) {
    throw new Error(`Не вдалося оновити кандидата: ${updateError.message}`);
  }

  return true;
}

export async function listUnscreenedApplications(supabase: SupabaseClient, vacancyId: string, limit: number) {
  const { data, error } = await supabase
    .from("hiring_applications")
    .select("*")
    .eq("vacancy_id", vacancyId)
    .is("screening", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Не вдалося завантажити кандидатів: ${error.message}`);
  }

  return ((data ?? []) as ApplicationRow[]).map(toApplicationRecord);
}

export async function saveApplicationScreening(supabase: SupabaseClient, applicationId: string, screening: CandidateScreening) {
  const { error } = await supabase
    .from("hiring_applications")
    .update({ screening, score: screening.score, verdict: screening.verdict })
    .eq("id", applicationId);

  if (error) {
    throw new Error(`Не вдалося зберегти оцінку: ${error.message}`);
  }
}

/** Server-side lookup without ownership check (public candidate channels only). */
export async function getVacancyById(supabase: SupabaseClient, vacancyId: string) {
  const { data, error } = await supabase.from("hiring_vacancies").select("*").eq("id", vacancyId).maybeSingle<VacancyRow>();

  if (error) {
    throw new Error(`Не вдалося завантажити вакансію: ${error.message}`);
  }

  return data ? toVacancyDetail(data) : null;
}

export async function getVacancyBySlug(supabase: SupabaseClient, slug: string) {
  const { data, error } = await supabase
    .from("hiring_vacancies")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<VacancyRow>();

  if (error) {
    throw new Error(`Не вдалося завантажити вакансію: ${error.message}`);
  }

  return data ? toVacancyDetail(data) : null;
}

export function toPublicVacancy(vacancy: VacancyDetail): PublicVacancy {
  return {
    slug: vacancy.slug,
    title: vacancy.content.title,
    city: vacancy.city,
    summary: vacancy.content.summary,
    pay_hint: vacancy.content.pay_hint,
    schedule: vacancy.content.schedule,
    offer: vacancy.content.offer,
    duties: vacancy.content.duties,
    requirements: vacancy.content.requirements,
    questions: vacancy.content.questions,
    is_open: vacancy.status === "active",
  };
}

export async function createApplication(
  supabase: SupabaseClient,
  input: {
    vacancyId: string;
    name: string;
    phone: string;
    answers: CandidateAnswer[];
    about: string | null;
    screening: CandidateScreening | null;
    source: ApplicationRecord["source"];
    telegramUserId: number | null;
  },
) {
  const { error } = await supabase.from("hiring_applications").insert({
    source: input.source,
    telegram_user_id: input.telegramUserId,
    vacancy_id: input.vacancyId,
    candidate_name: input.name,
    candidate_phone: input.phone,
    answers: input.answers,
    about: input.about,
    screening: input.screening,
    score: input.screening?.score ?? null,
    verdict: input.screening?.verdict ?? null,
  });

  if (error) {
    throw new Error(`Не вдалося зберегти відгук: ${error.message}`);
  }
}
