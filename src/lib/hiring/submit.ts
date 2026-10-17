import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { screenCandidate } from "@/lib/hiring/ai";
import { countScreenedApplications, resolveEmployerPlan } from "@/lib/hiring/plan";
import { createApplication } from "@/lib/hiring/store";
import { buildCandidateNotification } from "@/lib/telegram/employer";
import type { TelegramAction } from "@/lib/telegram/types";
import { PLAN_LIMITS, type ApplicationSource, type CandidateAnswer, type CandidateScreening, type VacancyDetail } from "@/lib/hiring/types";

/** Builds the answer list in vacancy question order from a `{ questionId: answer }` map. */
export function buildAnswers(vacancy: VacancyDetail, raw: Record<string, unknown>): CandidateAnswer[] {
  return vacancy.content.questions.map((question) => {
    const value = raw[question.id];
    const answer = typeof value === "string" && value.trim() ? value.trim().slice(0, 1000) : "—";
    return { question_id: question.id, question: question.text, answer };
  });
}

/**
 * Screens (within the owner's plan quota) and stores an application.
 * Screening failures never block saving: the candidate must not be lost.
 * Returns Telegram actions notifying the employer (the caller decides how to send them).
 */
export async function submitApplication(
  supabase: SupabaseClient,
  vacancy: VacancyDetail,
  input: {
    name: string;
    phone: string;
    answers: CandidateAnswer[];
    about: string | null;
    source: ApplicationSource;
    telegramUserId?: number | null;
  },
): Promise<TelegramAction[]> {
  let screening: CandidateScreening | null = null;

  try {
    const { data: owner } = await supabase.auth.admin.getUserById(vacancy.owner_id);
    const plan = await resolveEmployerPlan(supabase, { userId: vacancy.owner_id, email: owner.user?.email ?? null });
    const screenLimit = PLAN_LIMITS[plan].screenedApplications;
    const canScreen = screenLimit === null || (await countScreenedApplications(supabase, vacancy.owner_id)) < screenLimit;

    if (canScreen) {
      screening = await screenCandidate({ vacancy: vacancy.content, answers: input.answers, about: input.about });
    }
  } catch (error) {
    console.error("Candidate screening failed", error);
  }

  const applicationId = await createApplication(supabase, {
    vacancyId: vacancy.id,
    name: input.name,
    phone: input.phone,
    answers: input.answers,
    about: input.about,
    screening,
    source: input.source,
    telegramUserId: input.telegramUserId ?? null,
  });

  try {
    return await buildCandidateNotification(supabase, vacancy, {
      id: applicationId,
      name: input.name,
      phone: input.phone,
      screening,
      source: input.source,
    });
  } catch (error) {
    console.error("Employer notification failed", error);
    return [];
  }
}
