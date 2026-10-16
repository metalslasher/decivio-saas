import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { errorMessage, jsonError, readJsonBody, requireUser } from "@/lib/hiring/http";
import { updateApplicationStatus } from "@/lib/hiring/store";
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from "@/lib/hiring/types";
import { isRecord } from "@/lib/hiring/validate";

type RouteContext = { params: Promise<{ applicationId: string }> };

function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && value in APPLICATION_STATUS_LABELS;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { applicationId } = await params;
  const supabase = getSupabaseServiceRoleClient();
  const user = await requireUser(supabase, request);
  if (!user) {
    return jsonError("Потрібно увійти в акаунт.", 401);
  }

  const body = await readJsonBody(request);
  const status = isRecord(body) ? body.status : null;
  if (!isApplicationStatus(status)) {
    return jsonError("Некоректний статус.", 400);
  }

  try {
    const updated = await updateApplicationStatus(supabase, user.userId, applicationId, status);
    return updated ? NextResponse.json({ ok: true }) : jsonError("Кандидата не знайдено.", 404);
  } catch (error) {
    return jsonError(errorMessage(error, "Не вдалося оновити кандидата."), 500);
  }
}
