import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { screenCandidate } from "@/lib/hiring/ai";
import { enforceRateLimit, errorMessage, jsonError, readJsonBody, readOptionalString } from "@/lib/hiring/http";
import { createApplication, getVacancyBySlug } from "@/lib/hiring/store";
import type { CandidateAnswer, CandidateScreening } from "@/lib/hiring/types";
import { isRecord, normalizePhone } from "@/lib/hiring/validate";

export const maxDuration = 60;

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const body = await readJsonBody(request);
  if (!isRecord(body)) {
    return jsonError("Некоректний запит.", 400);
  }

  const name = readOptionalString(body.name, 80);
  const phone = normalizePhone(body.phone);
  if (!name || name.length < 2) {
    return jsonError("Вкажіть ваше ім'я.", 400);
  }
  if (!phone) {
    return jsonError("Вкажіть коректний номер телефону.", 400);
  }

  const supabase = getSupabaseServiceRoleClient();

  try {
    const limited = await enforceRateLimit(supabase, request, `apply-${slug}`, 5, 3600);
    if (limited) {
      return limited;
    }

    const vacancy = await getVacancyBySlug(supabase, slug);
    if (!vacancy) {
      return jsonError("Вакансію не знайдено.", 404);
    }
    if (vacancy.status !== "active") {
      return jsonError("Набір на цю вакансію вже закрито.", 410);
    }

    const rawAnswers = isRecord(body.answers) ? body.answers : {};
    const answers: CandidateAnswer[] = vacancy.content.questions.map((question) => ({
      question_id: question.id,
      question: question.text,
      answer: readOptionalString(rawAnswers[question.id], 1000) ?? "—",
    }));
    const about = readOptionalString(body.about, 2000);

    let screening: CandidateScreening | null = null;
    try {
      screening = await screenCandidate({ vacancy: vacancy.content, answers, about });
    } catch (error) {
      // The application must never be lost because of an AI failure.
      console.error("Candidate screening failed", error);
    }

    await createApplication(supabase, { vacancyId: vacancy.id, name, phone, answers, about, screening });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return jsonError(errorMessage(error, "Не вдалося надіслати відгук."), 500);
  }
}
