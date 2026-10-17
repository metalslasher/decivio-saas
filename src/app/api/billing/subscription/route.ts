import { NextResponse } from "next/server";
import { getUserSubscriptionAccess, hasActiveAccess, markSubscriptionCanceled } from "@/lib/billing-store";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { errorMessage, jsonError, readJsonBody, requireUser } from "@/lib/hiring/http";
import { getEmployerUsage } from "@/lib/hiring/plan";
import type { BillingOverview } from "@/lib/hiring/types";
import { isRecord } from "@/lib/hiring/validate";
import { hasManualFullAccess } from "@/lib/manual-full-access";
import { cancelMonoSubscription } from "@/lib/mono-acquiring";
import { isLocalTestModeEnabled } from "@/lib/test-mode";

export async function GET(request: Request) {
  const supabase = getSupabaseServiceRoleClient();
  const user = await requireUser(supabase, request);
  if (!user) {
    return jsonError("Потрібно увійти в акаунт.", 401);
  }

  try {
    const [subscription, usage] = await Promise.all([
      getUserSubscriptionAccess(supabase, user.userId),
      getEmployerUsage(supabase, user),
    ]);
    const isManual = hasManualFullAccess(user.email);
    const isPaid = hasActiveAccess(subscription ?? null);
    const source: BillingOverview["source"] = isManual
      ? "manual"
      : isPaid
        ? subscription?.mono_subscription_id
          ? "subscription"
          : "one_time"
        : null;

    const overview: BillingOverview = {
      plan: usage.plan,
      source,
      status: subscription?.status ?? null,
      currentPeriodEnd: subscription?.current_period_end ?? null,
      canCancel: source === "subscription" && subscription?.status === "active",
      usage,
    };

    return NextResponse.json(overview);
  } catch (error) {
    return jsonError(errorMessage(error, "Не вдалося завантажити дані про тариф."), 500);
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseServiceRoleClient();
  const user = await requireUser(supabase, request);
  if (!user) {
    return jsonError("Потрібно увійти в акаунт.", 401);
  }

  const body = await readJsonBody(request);
  if (!isRecord(body) || body.action !== "cancel") {
    return jsonError("Некоректна дія.", 400);
  }

  try {
    const subscription = await getUserSubscriptionAccess(supabase, user.userId);
    if (!subscription?.mono_subscription_id || subscription.status !== "active") {
      return jsonError("Активної щомісячної підписки не знайдено.", 404);
    }

    if (!isLocalTestModeEnabled()) {
      await cancelMonoSubscription(subscription.mono_subscription_id);
    }
    await markSubscriptionCanceled(supabase, user.userId);

    return NextResponse.json({ ok: true, currentPeriodEnd: subscription.current_period_end });
  } catch (error) {
    return jsonError(errorMessage(error, "Не вдалося скасувати підписку. Спробуйте пізніше."), 502);
  }
}
