import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { errorMessage, jsonError, readJsonBody, requireUser } from "@/lib/hiring/http";
import { countActiveVacancies, getEmployerUsage, resolveEmployerPlan, vacancyLimitMessage } from "@/lib/hiring/plan";
import { saveInterviewSettings } from "@/lib/hiring/interview";
import { deleteVacancy, getOwnerVacancy, listVacancyApplications, updateVacancyContent, updateVacancyStatus } from "@/lib/hiring/store";
import { PLAN_LIMITS } from "@/lib/hiring/types";
import { isRecord, parseVacancyContent } from "@/lib/hiring/validate";

type RouteContext = { params: Promise<{ vacancyId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { vacancyId } = await params;
  const supabase = getSupabaseServiceRoleClient();
  const user = await requireUser(supabase, request);
  if (!user) {
    return jsonError("Потрібно увійти в акаунт.", 401);
  }

  try {
    const vacancy = await getOwnerVacancy(supabase, user.userId, vacancyId);
    if (!vacancy) {
      return jsonError("Вакансію не знайдено.", 404);
    }

    const [applications, usage] = await Promise.all([listVacancyApplications(supabase, vacancy.id), getEmployerUsage(supabase, user)]);
    return NextResponse.json({ vacancy, applications, usage });
  } catch (error) {
    return jsonError(errorMessage(error, "Не вдалося завантажити вакансію."), 500);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { vacancyId } = await params;
  const supabase = getSupabaseServiceRoleClient();
  const user = await requireUser(supabase, request);
  if (!user) {
    return jsonError("Потрібно увійти в акаунт.", 401);
  }

  const body = await readJsonBody(request);

  if (isRecord(body) && body.interview !== undefined) {
    try {
      const saved = await saveInterviewSettings(supabase, user.userId, vacancyId, body.interview);
      return saved ? NextResponse.json({ interview: saved }) : jsonError("Вакансію не знайдено.", 404);
    } catch (error) {
      return jsonError(errorMessage(error, "Не вдалося зберегти слоти."), 400);
    }
  }

  if (isRecord(body) && body.content !== undefined) {
    try {
      const updated = await updateVacancyContent(supabase, user.userId, vacancyId, parseVacancyContent(body.content));
      return updated ? NextResponse.json({ ok: true }) : jsonError("Вакансію не знайдено.", 404);
    } catch (error) {
      return jsonError(errorMessage(error, "Не вдалося зберегти вакансію."), 400);
    }
  }

  const status = isRecord(body) ? body.status : null;
  if (status !== "active" && status !== "closed") {
    return jsonError("Некоректний статус.", 400);
  }

  try {
    if (status === "active") {
      const plan = await resolveEmployerPlan(supabase, user);
      if ((await countActiveVacancies(supabase, user.userId)) >= PLAN_LIMITS[plan].activeVacancies) {
        return NextResponse.json({ error: vacancyLimitMessage(plan), code: "vacancy_limit" }, { status: 402 });
      }
    }

    const updated = await updateVacancyStatus(supabase, user.userId, vacancyId, status);
    return updated ? NextResponse.json({ ok: true }) : jsonError("Вакансію не знайдено.", 404);
  } catch (error) {
    return jsonError(errorMessage(error, "Не вдалося оновити вакансію."), 500);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { vacancyId } = await params;
  const supabase = getSupabaseServiceRoleClient();
  const user = await requireUser(supabase, request);
  if (!user) {
    return jsonError("Потрібно увійти в акаунт.", 401);
  }

  try {
    const deleted = await deleteVacancy(supabase, user.userId, vacancyId);
    return deleted ? NextResponse.json({ ok: true }) : jsonError("Вакансію не знайдено.", 404);
  } catch (error) {
    return jsonError(errorMessage(error, "Не вдалося видалити вакансію."), 500);
  }
}
