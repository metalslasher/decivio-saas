import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { errorMessage, jsonError, readJsonBody, readOptionalString, requireUser } from "@/lib/hiring/http";
import { countActiveVacancies, getEmployerUsage, resolveEmployerPlan, vacancyLimitMessage } from "@/lib/hiring/plan";
import { createVacancy, listOwnerVacancies } from "@/lib/hiring/store";
import { PLAN_LIMITS } from "@/lib/hiring/types";
import { isRecord, parseVacancyContent } from "@/lib/hiring/validate";

export async function GET(request: Request) {
  const supabase = getSupabaseServiceRoleClient();
  const user = await requireUser(supabase, request);
  if (!user) {
    return jsonError("Потрібно увійти в акаунт.", 401);
  }

  try {
    const [vacancies, usage] = await Promise.all([listOwnerVacancies(supabase, user.userId), getEmployerUsage(supabase, user)]);
    return NextResponse.json({ vacancies, usage });
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
    const plan = await resolveEmployerPlan(supabase, user);
    if ((await countActiveVacancies(supabase, user.userId)) >= PLAN_LIMITS[plan].activeVacancies) {
      return NextResponse.json({ error: vacancyLimitMessage(plan), code: "vacancy_limit" }, { status: 402 });
    }

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
