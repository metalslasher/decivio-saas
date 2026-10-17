import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { screenCandidate } from "@/lib/hiring/ai";
import { errorMessage, jsonError, requireUser } from "@/lib/hiring/http";
import { countScreenedApplications, resolveEmployerPlan } from "@/lib/hiring/plan";
import { getOwnerVacancy, listUnscreenedApplications, saveApplicationScreening } from "@/lib/hiring/store";
import { PLAN_LIMITS } from "@/lib/hiring/types";

export const maxDuration = 60;

// Keeps one request well inside the serverless time limit; the client calls again while `remaining > 0`.
const BATCH_SIZE = 5;

type RouteContext = { params: Promise<{ vacancyId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
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

    const plan = await resolveEmployerPlan(supabase, user);
    const screenLimit = PLAN_LIMITS[plan].screenedApplications;
    const quota = screenLimit === null ? BATCH_SIZE : Math.max(0, screenLimit - (await countScreenedApplications(supabase, user.userId)));
    if (quota === 0) {
      return NextResponse.json(
        { error: "Безкоштовні ШІ-оцінки закінчились. Перейдіть на Pro, щоб оцінити всіх кандидатів.", code: "screen_limit" },
        { status: 402 },
      );
    }

    const batch = await listUnscreenedApplications(supabase, vacancy.id, Math.min(BATCH_SIZE, quota));
    let screened = 0;
    for (const application of batch) {
      const screening = await screenCandidate({ vacancy: vacancy.content, answers: application.answers, about: application.about });
      await saveApplicationScreening(supabase, application.id, screening);
      screened += 1;
    }

    const remaining = (await listUnscreenedApplications(supabase, vacancy.id, 100)).length;
    return NextResponse.json({ screened, remaining });
  } catch (error) {
    return jsonError(errorMessage(error, "Не вдалося оцінити кандидатів."), 502);
  }
}
