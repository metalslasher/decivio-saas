import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type BillingCheckoutStatus,
  type BillingKind,
  MONO_CCY_UAH,
  MONO_PROVIDER,
  getBillingPlanConfig,
  isAccessGrantedForCheckoutStatus,
  mapMonoInvoiceStatusToCheckoutStatus,
  mapMonoSubscriptionStatusToCheckoutStatus,
  resolveAnnualAccessEndsAt,
  resolveMonthlyAccessEndsAt
} from "@/lib/billing";
import type { MonoInvoiceStatus, MonoSubscriptionStatus } from "@/lib/mono-acquiring";
import type { PaidPlanId } from "@/lib/pricing";

export type BillingCheckoutRow = {
  id: string;
  user_id: string;
  provider: typeof MONO_PROVIDER;
  plan_id: PaidPlanId;
  billing_kind: BillingKind;
  status: BillingCheckoutStatus;
  amount: number;
  ccy: number;
  mono_invoice_id: string | null;
  mono_subscription_id: string | null;
  mono_page_url: string | null;
  redirect_url: string | null;
  last_event_at: string | null;
  last_event_status: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionAccessRow = {
  user_id: string;
  plan: "free" | "pro";
  status: "free" | "trial" | "active" | "canceled" | "past_due";
  current_period_end: string | null;
  provider?: string | null;
  mono_invoice_id?: string | null;
  mono_subscription_id?: string | null;
  activated_at?: string | null;
};

function normalizePayload(payload: unknown) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }

  return { value: payload };
}

function buildBillingEventDedupeKey(input: {
  eventType: string;
  externalId: string | null;
  status: string | null;
  eventTime: string | null;
  payload: unknown;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        eventType: input.eventType,
        externalId: input.externalId,
        status: input.status,
        eventTime: input.eventTime,
        payload: normalizePayload(input.payload)
      })
    )
    .digest("hex");
}

function shouldApplyIncomingEvent(existingEventAt: string | null | undefined, incomingEventAt: string | null | undefined) {
  if (!existingEventAt?.trim()) {
    return true;
  }

  if (!incomingEventAt?.trim()) {
    return true;
  }

  return new Date(incomingEventAt).getTime() >= new Date(existingEventAt).getTime();
}

function hasActiveAccess(subscription: Pick<SubscriptionAccessRow, "plan" | "status" | "current_period_end"> | null) {
  if (!subscription || subscription.plan !== "pro") {
    return false;
  }

  if (subscription.status !== "active" && subscription.status !== "trial" && subscription.status !== "canceled") {
    return false;
  }

  if (!subscription.current_period_end) {
    return subscription.status === "active" || subscription.status === "trial";
  }

  return new Date(subscription.current_period_end).getTime() > Date.now();
}

export async function getUserSubscriptionAccess(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id, plan, status, current_period_end, provider, mono_invoice_id, mono_subscription_id, activated_at")
    .eq("user_id", userId)
    .maybeSingle<SubscriptionAccessRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function assertUserDoesNotAlreadyHavePaidAccess(supabase: SupabaseClient, userId: string) {
  const subscription = await getUserSubscriptionAccess(supabase, userId);
  if (hasActiveAccess(subscription ?? null)) {
    throw new Error("SUBSCRIPTION_ALREADY_ACTIVE");
  }

  return subscription;
}

export async function findReusablePendingCheckout(supabase: SupabaseClient, userId: string, planId: PaidPlanId) {
  const { data, error } = await supabase
    .from("billing_checkouts")
    .select("*")
    .eq("user_id", userId)
    .eq("plan_id", planId)
    .in("status", ["pending", "processing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<BillingCheckoutRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || !data.mono_page_url) {
    return null;
  }

  const createdAtMs = new Date(data.created_at).getTime();
  const ageMs = Date.now() - createdAtMs;

  if (ageMs > 30 * 60 * 1000) {
    return null;
  }

  return data;
}

export async function createCheckoutDraft(supabase: SupabaseClient, input: {
  userId: string;
  planId: PaidPlanId;
  redirectUrl: string;
}) {
  const planConfig = getBillingPlanConfig(input.planId);
  const { data, error } = await supabase
    .from("billing_checkouts")
    .insert({
      user_id: input.userId,
      provider: MONO_PROVIDER,
      plan_id: input.planId,
      billing_kind: planConfig.billingKind,
      status: "pending",
      amount: planConfig.amount,
      ccy: MONO_CCY_UAH,
      redirect_url: input.redirectUrl
    })
    .select("*")
    .single<BillingCheckoutRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function attachMonoTargetToCheckout(
  supabase: SupabaseClient,
  checkoutId: string,
  input: {
    pageUrl: string;
    invoiceId?: string;
    subscriptionId?: string;
    redirectUrl?: string;
  }
) {
  const { data, error } = await supabase
    .from("billing_checkouts")
    .update({
      mono_page_url: input.pageUrl,
      mono_invoice_id: input.invoiceId ?? null,
      mono_subscription_id: input.subscriptionId ?? null,
      redirect_url: input.redirectUrl ?? null
    })
    .eq("id", checkoutId)
    .select("*")
    .single<BillingCheckoutRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getUserCheckoutById(supabase: SupabaseClient, userId: string, checkoutId: string) {
  const { data, error } = await supabase
    .from("billing_checkouts")
    .select("*")
    .eq("id", checkoutId)
    .eq("user_id", userId)
    .maybeSingle<BillingCheckoutRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function recordBillingEvent(
  supabase: SupabaseClient,
  input: {
    userId: string;
    checkoutId: string | null;
    eventType: string;
    externalId: string | null;
    status: string | null;
    eventTime: string | null;
    signature: string | null;
    payload: unknown;
  }
) {
  const dedupeKey = buildBillingEventDedupeKey({
    eventType: input.eventType,
    externalId: input.externalId,
    status: input.status,
    eventTime: input.eventTime,
    payload: input.payload
  });

  const { error } = await supabase.from("billing_events").upsert(
    {
      user_id: input.userId,
      checkout_id: input.checkoutId,
      provider: MONO_PROVIDER,
      event_type: input.eventType,
      external_id: input.externalId,
      status: input.status,
      event_time: input.eventTime,
      signature: input.signature,
      dedupe_key: dedupeKey,
      payload: normalizePayload(input.payload)
    },
    {
      onConflict: "dedupe_key",
      ignoreDuplicates: true
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function upsertSubscriptionAccess(
  supabase: SupabaseClient,
  row: SubscriptionAccessRow
) {
  const { error } = await supabase.from("subscriptions").upsert(row, {
    onConflict: "user_id"
  });

  if (error) {
    throw new Error(error.message);
  }
}

function buildSubscriptionAccessFromInvoice(checkout: BillingCheckoutRow, status: MonoInvoiceStatus): SubscriptionAccessRow {
  const eventTime = status.modifiedDate ?? status.createdDate ?? new Date().toISOString();

  if (status.status === "success") {
    return {
      user_id: checkout.user_id,
      plan: "pro",
      status: "active",
      current_period_end: resolveAnnualAccessEndsAt(eventTime),
      provider: MONO_PROVIDER,
      mono_invoice_id: status.invoiceId,
      mono_subscription_id: null,
      activated_at: eventTime
    };
  }

  return {
    user_id: checkout.user_id,
    plan: "free",
    status: "free",
    current_period_end: null,
    provider: MONO_PROVIDER,
    mono_invoice_id: null,
    mono_subscription_id: null,
    activated_at: null
  };
}

function buildSubscriptionAccessFromMonoSubscription(checkout: BillingCheckoutRow, status: MonoSubscriptionStatus): SubscriptionAccessRow {
  const hasFutureAccess = status.endDate ? new Date(status.endDate).getTime() > Date.now() : status.status === "active";

  if (status.status === "active") {
    return {
      user_id: checkout.user_id,
      plan: "pro",
      status: "active",
      current_period_end: resolveMonthlyAccessEndsAt(status.nextChargeDate, status.startDate),
      provider: MONO_PROVIDER,
      mono_invoice_id: null,
      mono_subscription_id: status.subscriptionId,
      activated_at: status.startDate
    };
  }

  if (hasFutureAccess) {
    return {
      user_id: checkout.user_id,
      plan: "pro",
      status: "canceled",
      current_period_end: status.endDate ?? resolveMonthlyAccessEndsAt(status.nextChargeDate, status.startDate),
      provider: MONO_PROVIDER,
      mono_invoice_id: null,
      mono_subscription_id: status.subscriptionId,
      activated_at: status.startDate
    };
  }

  return {
    user_id: checkout.user_id,
    plan: "free",
    status: "free",
    current_period_end: null,
    provider: MONO_PROVIDER,
    mono_invoice_id: null,
    mono_subscription_id: null,
    activated_at: null
  };
}

export async function syncCheckoutFromMonoInvoiceStatus(
  supabase: SupabaseClient,
  invoiceStatus: MonoInvoiceStatus,
  options: {
    source: "webhook" | "poll";
    signature?: string | null;
    payload?: unknown;
  }
) {
  const { data: checkout, error } = await supabase
    .from("billing_checkouts")
    .select("*")
    .eq("mono_invoice_id", invoiceStatus.invoiceId)
    .maybeSingle<BillingCheckoutRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!checkout) {
    return null;
  }

  const eventTime = invoiceStatus.modifiedDate ?? invoiceStatus.createdDate ?? new Date().toISOString();
  const nextStatus = mapMonoInvoiceStatusToCheckoutStatus(invoiceStatus.status);

  await recordBillingEvent(supabase, {
    userId: checkout.user_id,
    checkoutId: checkout.id,
    eventType: `mono_invoice_${options.source}`,
    externalId: invoiceStatus.invoiceId,
    status: invoiceStatus.status,
    eventTime,
    signature: options.signature ?? null,
    payload: options.payload ?? invoiceStatus
  });

  if (shouldApplyIncomingEvent(checkout.last_event_at, eventTime)) {
    const { error: checkoutUpdateError } = await supabase
      .from("billing_checkouts")
      .update({
        status: nextStatus,
        last_event_at: eventTime,
        last_event_status: invoiceStatus.status
      })
      .eq("id", checkout.id);

    if (checkoutUpdateError) {
      throw new Error(checkoutUpdateError.message);
    }

    await upsertSubscriptionAccess(supabase, buildSubscriptionAccessFromInvoice(checkout, invoiceStatus));
  }

  return getUserCheckoutById(supabase, checkout.user_id, checkout.id);
}

export async function syncCheckoutFromMonoSubscriptionStatus(
  supabase: SupabaseClient,
  subscriptionStatus: MonoSubscriptionStatus,
  options: {
    source: "webhook_status" | "webhook_charge" | "poll";
    signature?: string | null;
    payload?: unknown;
  }
) {
  const { data: checkout, error } = await supabase
    .from("billing_checkouts")
    .select("*")
    .eq("mono_subscription_id", subscriptionStatus.subscriptionId)
    .maybeSingle<BillingCheckoutRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!checkout) {
    return null;
  }

  const recordedEventTime =
    subscriptionStatus.nextChargeDate ??
    subscriptionStatus.endDate ??
    subscriptionStatus.startDate ??
    null;
  const appliedAt = new Date().toISOString();
  const nextStatus = mapMonoSubscriptionStatusToCheckoutStatus(subscriptionStatus.status);

  await recordBillingEvent(supabase, {
    userId: checkout.user_id,
    checkoutId: checkout.id,
    eventType: `mono_subscription_${options.source}`,
    externalId: subscriptionStatus.subscriptionId,
    status: subscriptionStatus.status,
    eventTime: recordedEventTime,
    signature: options.signature ?? null,
    payload: options.payload ?? subscriptionStatus
  });

  if (shouldApplyIncomingEvent(checkout.last_event_at, appliedAt)) {
    const { error: checkoutUpdateError } = await supabase
      .from("billing_checkouts")
      .update({
        status: nextStatus,
        last_event_at: appliedAt,
        last_event_status: subscriptionStatus.status
      })
      .eq("id", checkout.id);

    if (checkoutUpdateError) {
      throw new Error(checkoutUpdateError.message);
    }

    await upsertSubscriptionAccess(supabase, buildSubscriptionAccessFromMonoSubscription(checkout, subscriptionStatus));
  }

  return getUserCheckoutById(supabase, checkout.user_id, checkout.id);
}

export async function recordRawMonoSubscriptionChargeEvent(
  supabase: SupabaseClient,
  checkout: BillingCheckoutRow,
  input: {
    status: string | null;
    eventTime: string | null;
    signature?: string | null;
    payload: unknown;
  }
) {
  await recordBillingEvent(supabase, {
    userId: checkout.user_id,
    checkoutId: checkout.id,
    eventType: "mono_subscription_charge_webhook",
    externalId: checkout.mono_subscription_id,
    status: input.status,
    eventTime: input.eventTime,
    signature: input.signature ?? null,
    payload: input.payload
  });
}

export function formatCheckoutStatusForClient(checkout: BillingCheckoutRow | null, subscription: SubscriptionAccessRow | null) {
  if (!checkout) {
    return null;
  }

  return {
    checkoutId: checkout.id,
    planId: checkout.plan_id,
    billingKind: checkout.billing_kind,
    status: checkout.status,
    accessGranted: isAccessGrantedForCheckoutStatus(checkout.status) && hasActiveAccess(subscription),
    redirectUrl: checkout.mono_page_url,
    subscription: subscription
      ? {
          plan: subscription.plan,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end
        }
      : null
  };
}
