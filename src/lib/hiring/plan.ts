import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserSubscriptionAccess, hasActiveAccess } from "@/lib/billing-store";
import { hasManualFullAccess } from "@/lib/manual-full-access";
import { PLAN_LIMITS, type EmployerPlan } from "@/lib/hiring/types";

export async function resolveEmployerPlan(
  supabase: SupabaseClient,
  user: { userId: string; email: string | null },
): Promise<EmployerPlan> {
  if (hasManualFullAccess(user.email)) {
    return "pro";
  }

  const subscription = await getUserSubscriptionAccess(supabase, user.userId);
  return hasActiveAccess(subscription ?? null) ? "pro" : "free";
}

export async function countActiveVacancies(supabase: SupabaseClient, ownerId: string) {
  const { count, error } = await supabase
    .from("hiring_vacancies")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("status", "active");

  if (error) {
    throw new Error(`Не вдалося перевірити ліміт вакансій: ${error.message}`);
  }

  return count ?? 0;
}

export async function countScreenedApplications(supabase: SupabaseClient, ownerId: string) {
  const { data: vacancies, error } = await supabase.from("hiring_vacancies").select("id").eq("owner_id", ownerId);
  if (error) {
    throw new Error(`Не вдалося перевірити ліміт оцінок: ${error.message}`);
  }

  const ids = (vacancies ?? []).map((row: { id: string }) => row.id);
  if (ids.length === 0) {
    return 0;
  }

  const { count, error: countError } = await supabase
    .from("hiring_applications")
    .select("id", { count: "exact", head: true })
    .in("vacancy_id", ids)
    .not("screening", "is", null);

  if (countError) {
    throw new Error(`Не вдалося перевірити ліміт оцінок: ${countError.message}`);
  }

  return count ?? 0;
}

export async function getEmployerUsage(supabase: SupabaseClient, user: { userId: string; email: string | null }) {
  const [plan, activeVacancies, screenedApplications] = await Promise.all([
    resolveEmployerPlan(supabase, user),
    countActiveVacancies(supabase, user.userId),
    countScreenedApplications(supabase, user.userId),
  ]);

  return { plan, limits: PLAN_LIMITS[plan], activeVacancies, screenedApplications };
}

export function vacancyLimitMessage(plan: EmployerPlan) {
  return plan === "free"
    ? `На безкоштовному тарифі можна мати ${PLAN_LIMITS.free.activeVacancies} активну вакансію. Закрийте поточну або перейдіть на Pro.`
    : `Досягнуто ліміт ${PLAN_LIMITS.pro.activeVacancies} активних вакансій. Закрийте одну з них, щоб відкрити нову.`;
}
