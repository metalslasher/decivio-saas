import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { errorMessage, jsonError, requireUser } from "@/lib/hiring/http";
import { countActiveVacancies, resolveEmployerPlan, vacancyLimitMessage } from "@/lib/hiring/plan";
import { createVacancy, getOwnerVacancy } from "@/lib/hiring/store";
import { PLAN_LIMITS } from "@/lib/hiring/types";

type RouteContext = { params: Promise<{ vacancyId: string }> };

/** Re-hiring for the same role: copies text, questions and interview location (not candidates or booked slots). */
export async function POST(request: Request, { params }: RouteContext) {
  const { vacancyId } = await params;
  const supabase = getSupabaseServiceRoleClient();
  const user = await requireUser(supabase, request);
  if (!user) return jsonError("Потрібно увійти в акаунт.", 401);

  try {
    const source = await getOwnerVacancy(supabase, user.userId, vacancyId);
    if (!source) return jsonError("Вакансію не знайдено.", 404);

    const plan = await resolveEmployerPlan(supabase, user);
    if ((await countActiveVacancies(supabase, user.userId)) >= PLAN_LIMITS[plan].activeVacancies) {
      return NextResponse.json(
        { error: `${vacancyLimitMessage(plan)} Щоб найняти на ту саму посаду, закрийте набір на цій вакансії і дублюйте знову.`, code: "vacancy_limit" },
        { status: 402 },
      );
    }

    const created = await createVacancy(supabase, {
      ownerId: user.userId,
      brief: source.brief,
      city: source.city,
      content: source.content,
    });

    if (source.interview?.location) {
      await supabase.from("hiring_vacancies").update({ interview: { location: source.interview.location, slots: [] } }).eq("id", created.id);
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return jsonError(errorMessage(error, "Не вдалося скопіювати вакансію."), 500);
  }
}
