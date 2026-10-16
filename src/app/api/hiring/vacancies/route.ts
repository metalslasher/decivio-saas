import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { errorMessage, jsonError, readJsonBody, readOptionalString, requireUser } from "@/lib/hiring/http";
import { createVacancy, listOwnerVacancies } from "@/lib/hiring/store";
import { isRecord, parseVacancyContent } from "@/lib/hiring/validate";

export async function GET(request: Request) {
  const supabase = getSupabaseServiceRoleClient();
  const user = await requireUser(supabase, request);
  if (!user) {
    return jsonError("Потрібно увійти в акаунт.", 401);
  }

  try {
    return NextResponse.json({ vacancies: await listOwnerVacancies(supabase, user.userId) });
  } catch (error) {
    return jsonError(errorMessage(error, "Не вдалося завантажити вакансії."), 500);
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseServiceRoleClient();
  const user = await requireUser(supabase, request);
  if (!user) {
    return jsonError("Потрібно увійти в акаунт.", 401);
  }

  const body = await readJsonBody(request);
  if (!isRecord(body)) {
    return jsonError("Некоректний запит.", 400);
  }

  try {
    const content = parseVacancyContent(body.content);
    const created = await createVacancy(supabase, {
      ownerId: user.userId,
      brief: readOptionalString(body.brief, 2000) ?? content.title,
      city: readOptionalString(body.city, 80),
      content,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return jsonError(errorMessage(error, "Не вдалося опублікувати вакансію."), 400);
  }
}
