import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { enforceRateLimit, errorMessage, jsonError, readJsonBody, readOptionalString } from "@/lib/hiring/http";
import { getVacancyBySlug } from "@/lib/hiring/store";
import { buildAnswers, submitApplication } from "@/lib/hiring/submit";
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

    await submitApplication(supabase, vacancy, {
      name,
      phone,
      answers: buildAnswers(vacancy, isRecord(body.answers) ? body.answers : {}),
      about: readOptionalString(body.about, 2000),
      source: "web",
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return jsonError(errorMessage(error, "Не вдалося надіслати відгук."), 500);
  }
}
