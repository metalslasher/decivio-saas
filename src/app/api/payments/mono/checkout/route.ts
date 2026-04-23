import { NextResponse } from "next/server";
import {
  assertUserDoesNotAlreadyHavePaidAccess,
  attachMonoTargetToCheckout,
  createCheckoutDraft,
  findReusablePendingCheckout
} from "@/lib/billing-store";
import { getBillingPlanConfig, isPaidPlanId } from "@/lib/billing";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import {
  buildMonoCheckoutReturnUrl,
  createMonoInvoice,
  createMonoSubscription
} from "@/lib/mono-acquiring";
import { getAuthenticatedUserFromRequest } from "@/lib/request-auth";
import { consumeRateLimit } from "@/lib/request-rate-limit";

const CHECKOUT_RATE_LIMIT = {
  limit: 10,
  windowSeconds: 10 * 60
} as const;

function buildRateLimitSubjectHint(userId: string) {
  return `user:${userId}`;
}

export async function POST(request: Request) {
  let supabase;

  try {
    supabase = getSupabaseServiceRoleClient();
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Supabase server is not configured."
      },
      { status: 500 }
    );
  }

  let authenticatedUser;
  try {
    authenticatedUser = await getAuthenticatedUserFromRequest(supabase, request);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to verify authorization."
      },
      { status: 401 }
    );
  }

  if (!authenticatedUser) {
    return NextResponse.json(
      {
        error: "Active authorization is required before payment."
      },
      { status: 401 }
    );
  }

  let rateLimit;
  try {
    rateLimit = await consumeRateLimit(supabase, {
      route: "/api/payments/mono/checkout",
      subjectHint: buildRateLimitSubjectHint(authenticatedUser.userId),
      headers: request.headers,
      limit: CHECKOUT_RATE_LIMIT.limit,
      windowSeconds: CHECKOUT_RATE_LIMIT.windowSeconds
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to apply request rate limiting."
      },
      { status: 500 }
    );
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many payment attempts in a short period. Please wait a few minutes and try again."
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds)
        }
      }
    );
  }

  let payload: { planId?: unknown };
  try {
    payload = (await request.json()) as { planId?: unknown };
  } catch {
    return NextResponse.json(
      {
        error: "Invalid request payload."
      },
      { status: 400 }
    );
  }

  if (!isPaidPlanId(payload.planId)) {
    return NextResponse.json(
      {
        error: "Unknown plan for checkout."
      },
      { status: 400 }
    );
  }

  try {
    await assertUserDoesNotAlreadyHavePaidAccess(supabase, authenticatedUser.userId);
  } catch (error) {
    if (error instanceof Error && error.message === "SUBSCRIPTION_ALREADY_ACTIVE") {
      return NextResponse.json(
        {
          error: "Pro access is already active for this account.",
          code: "subscription_already_active",
          redirectTo: "/dashboard?view=access"
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to validate current access."
      },
      { status: 500 }
    );
  }

  try {
    const reusableCheckout = await findReusablePendingCheckout(supabase, authenticatedUser.userId, payload.planId);
    if (reusableCheckout?.mono_page_url) {
      return NextResponse.json(
        {
          checkoutId: reusableCheckout.id,
          redirectUrl: reusableCheckout.mono_page_url
        },
        { status: 200 }
      );
    }

    const draft = await createCheckoutDraft(supabase, {
      userId: authenticatedUser.userId,
      planId: payload.planId,
      redirectUrl: buildMonoCheckoutReturnUrl(payload.planId, "pending")
    });
    const returnUrl = buildMonoCheckoutReturnUrl(payload.planId, draft.id);
    const planConfig = getBillingPlanConfig(payload.planId);

    let monoResponse;
    try {
      monoResponse =
        planConfig.billingKind === "one_time"
          ? await createMonoInvoice({
              amount: planConfig.amount,
              reference: draft.id,
              destination: planConfig.destination,
              redirectUrl: returnUrl
            })
          : await createMonoSubscription({
              amount: planConfig.amount,
              interval: planConfig.monoInterval ?? "1m",
              redirectUrl: returnUrl
            });
    } catch (error) {
      await supabase
        .from("billing_checkouts")
        .update({
          status: "failed",
          last_event_at: new Date().toISOString(),
          last_event_status: "create_failed"
        })
        .eq("id", draft.id);

      throw error;
    }

    const checkout = await attachMonoTargetToCheckout(supabase, draft.id, {
      pageUrl: monoResponse.pageUrl,
      invoiceId: "invoiceId" in monoResponse ? monoResponse.invoiceId : undefined,
      subscriptionId: "subscriptionId" in monoResponse ? monoResponse.subscriptionId : undefined,
      redirectUrl: returnUrl
    });

    return NextResponse.json(
      {
        checkoutId: checkout.id,
        redirectUrl: checkout.mono_page_url
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create mono checkout."
      },
      { status: 502 }
    );
  }
}
