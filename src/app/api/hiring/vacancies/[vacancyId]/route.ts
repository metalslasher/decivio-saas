import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { errorMessage, jsonError, readJsonBody, requireUser } from "@/lib/hiring/http";
import { getOwnerVacancy, listVacancyApplications, updateVacancyStatus } from "@/lib/hiring/store";
import { isRecord } from "@/lib/hiring/validate";

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

    const applications = await listVacancyApplications(supabase, vacancy.id);
    return NextResponse.json({ vacancy, applications });
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
  const status = isRecord(body) ? body.status : null;
  if (status !== "active" && status !== "closed") {
    return jsonError("Некоректний статус.", 400);
  }

  try {
    const updated = await updateVacancyStatus(supabase, user.userId, vacancyId, status);
    return updated ? NextResponse.json({ ok: true }) : jsonError("Вакансію не знайдено.", 404);
  } catch (error) {
    return jsonError(errorMessage(error, "Не вдалося оновити вакансію."), 500);
  }
}
