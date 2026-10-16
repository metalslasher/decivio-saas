import { NextResponse } from "next/server";
import {
  assertUserDoesNotAlreadyHavePaidAccess,
  attachMonoTargetToCheckout,
  type BillingCheckoutRow,
  createCheckoutDraft,
  findReusablePendingCheckout,
  syncCheckoutFromMonoInvoiceStatus,
  syncCheckoutFromMonoSubscriptionStatus
} from "@/lib/billing-store";
import { type BillingCheckoutStatus, getBillingPlanConfig, isPaidPlanId } from "@/lib/billing";
import { getBillingErrorMessage } from "@/lib/billing-errors";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { hasManualFullAccess } from "@/lib/manual-full-access";
import {
  buildMonoCheckoutReturnUrl,
  createMonoInvoice,
  createMonoSubscription
} from "@/lib/mono-acquiring";
import { isAllowedSameSiteRequest } from "@/lib/request-origin";
import { getAuthenticatedUserFromRequest } from "@/lib/request-auth";
import { consumeRateLimit } from "@/lib/request-rate-limit";
import { isLocalTestModeEnabled } from "@/lib/test-mode";

const CHECKOUT_RATE_LIMIT = {
  limit: 10,
  windowSeconds: 10 * 60
} as const;

function buildRateLimitSubjectHint(userId: string) {
  return `user:${userId}`;
}

async function activateLocalTestCheckout(
  supabase: ReturnType<typeof getSupabaseServiceRoleClient>,
  input: {
    draft: Awaited<ReturnType<typeof createCheckoutDraft>>;
    returnUrl: string;
    status: BillingCheckoutStatus;
  }
) {
  const now = new Date().toISOString();

  async function setLocalCheckoutStatus(status: BillingCheckoutStatus) {
    const { data, error } = await supabase
      .from("billing_checkouts")
      .update({
        status,
        last_event_at: now,
        last_event_status: `local_test_${status}`
      })
      .eq("id", input.draft.id)
      .select("*")
      .single<BillingCheckoutRow>();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  if (input.draft.billing_kind === "subscription") {
    const subscriptionId = `test_subscription_${input.draft.id}`;
    const nextChargeDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const attachedCheckout = await attachMonoTargetToCheckout(supabase, input.draft.id, {
      pageUrl: input.returnUrl,
      subscriptionId,
      redirectUrl: input.returnUrl
    });

    if (input.status === "pending") {
      return attachedCheckout;
    }

    if (input.status === "processing") {
      return setLocalCheckoutStatus("processing");
    }

    if (input.status === "canceled") {
      const syncedCheckout = await syncCheckoutFromMonoSubscriptionStatus(
        supabase,
        {
          subscriptionId,
          status: "cancelled",
          startDate: now,
          endDate: now,
          amount: attachedCheckout.amount,
          ccy: attachedCheckout.ccy,
          interval: "1m",
          cancellationDesc: "Decivio local test checkout"
        },
        {
          source: "poll",
          payload: {
            testMode: true,
            checkoutId: attachedCheckout.id,
            planId: attachedCheckout.plan_id,
            requestedStatus: input.status
          }
        }
      );

      return syncedCheckout ?? attachedCheckout;
    }

    if (input.status !== "active") {
      return setLocalCheckoutStatus(input.status);
    }

    const syncedCheckout = await syncCheckoutFromMonoSubscriptionStatus(
      supabase,
      {
        subscriptionId,
        status: "active",
        startDate: now,
        amount: attachedCheckout.amount,
        ccy: attachedCheckout.ccy,
        interval: "1m",
        nextChargeDate
      },
      {
        source: "poll",
        payload: {
          testMode: true,
          checkoutId: attachedCheckout.id,
          planId: attachedCheckout.plan_id,
          requestedStatus: input.status
        }
      }
    );

    return syncedCheckout ?? attachedCheckout;
  }

  const invoiceId = `test_invoice_${input.draft.id}`;

  const attachedCheckout = await attachMonoTargetToCheckout(supabase, input.draft.id, {
    pageUrl: input.returnUrl,
    invoiceId,
    redirectUrl: input.returnUrl
  });

  if (input.status === "pending") {
    return attachedCheckout;
  }

  if (input.status === "processing") {
    return setLocalCheckoutStatus("processing");
  }

  if (input.status === "failed" || input.status === "expired" || input.status === "reversed") {
    const monoStatus =
      input.status === "failed"
        ? "failure"
        : input.status === "expired"
          ? "expired"
          : "reversed";

    const syncedCheckout = await syncCheckoutFromMonoInvoiceStatus(
      supabase,
      {
        invoiceId,
        status: monoStatus,
        amount: attachedCheckout.amount,
        ccy: attachedCheckout.ccy,
        finalAmount: 0,
        createdDate: now,
        modifiedDate: now,
        reference: attachedCheckout.id,
        destination: "Decivio local test checkout"
      },
      {
        source: "poll",
        payload: {
          testMode: true,
          checkoutId: attachedCheckout.id,
          planId: attachedCheckout.plan_id,
          requestedStatus: input.status
        }
      }
    );

    return syncedCheckout ?? attachedCheckout;
  }

  const syncedCheckout = await syncCheckoutFromMonoInvoiceStatus(
    supabase,
    {
      invoiceId,
      status: "success",
      amount: attachedCheckout.amount,
      ccy: attachedCheckout.ccy,
      finalAmount: attachedCheckout.amount,
      createdDate: now,
      modifiedDate: now,
      reference: attachedCheckout.id,
      destination: "Decivio local test checkout"
    },
    {
      source: "poll",
      payload: {
        testMode: true,
        checkoutId: attachedCheckout.id,
        planId: attachedCheckout.plan_id,
        requestedStatus: input.status
      }
    }
  );

  return syncedCheckout ?? attachedCheckout;
}

function getLocalTestCheckoutStatus(
  value: unknown,
  billingKind: "subscription" | "one_time"
): BillingCheckoutStatus {
  if (!isLocalTestModeEnabled()) {
    return billingKind === "subscription" ? "active" : "paid";
  }

  if (billingKind === "subscription") {
    if (value === "pending" || value === "processing" || value === "active" || value === "canceled" || value === "failed") {
      return value;
    }

    return "active";
  }

  if (value === "pending" || value === "processing" || value === "paid" || value === "failed" || value === "expired" || value === "reversed") {
    return value;
  }

  return "paid";
}

export async function POST(request: Request) {
  if (!isAllowedSameSiteRequest(request)) {
    return NextResponse.json(
      {
        error: "Запит на оплату має бути створений із сайту Decivio."
      },
      { status: 403 }
    );
  }

  let supabase;

  try {
    supabase = getSupabaseServiceRoleClient();
  } catch (error) {
    return NextResponse.json(
      {
        error: getBillingErrorMessage(error, "Оплата тимчасово недоступна: не вдалося підготувати сервер.")
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
        error: getBillingErrorMessage(error, "Сесію не вдалося підтвердити. Увійдіть ще раз і повторіть оплату.")
      },
      { status: 401 }
    );
  }

  if (!authenticatedUser) {
    return NextResponse.json(
      {
        error: "Перед оплатою потрібно увійти або створити акаунт."
      },
      { status: 401 }
    );
  }

  let rateLimit = {
    allowed: true,
    retryAfterSeconds: 0
  };
  try {
    if (!isLocalTestModeEnabled()) {
      rateLimit = await consumeRateLimit(supabase, {
        route: "/api/payments/mono/checkout",
        subjectHint: buildRateLimitSubjectHint(authenticatedUser.userId),
        headers: request.headers,
        limit: CHECKOUT_RATE_LIMIT.limit,
        windowSeconds: CHECKOUT_RATE_LIMIT.windowSeconds
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: getBillingErrorMessage(error, "Не вдалося перевірити ліміт платіжних запитів. Спробуйте ще раз.")
      },
      { status: 500 }
    );
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Забагато спроб оплати за короткий час. Зачекайте кілька хвилин і спробуйте ще раз."
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds)
        }
      }
    );
  }

  let payload: { planId?: unknown; testCheckoutStatus?: unknown };
  try {
    payload = (await request.json()) as { planId?: unknown };
  } catch {
    return NextResponse.json(
      {
        error: "Некоректний запит на оплату."
      },
      { status: 400 }
    );
  }

  if (!isPaidPlanId(payload.planId)) {
    return NextResponse.json(
      {
        error: "Невідомий тариф для оплати."
      },
      { status: 400 }
    );
  }

  try {
    if (hasManualFullAccess(authenticatedUser.email)) {
      throw new Error("SUBSCRIPTION_ALREADY_ACTIVE");
    }

    await assertUserDoesNotAlreadyHavePaidAccess(supabase, authenticatedUser.userId);
  } catch (error) {
    if (error instanceof Error && error.message === "SUBSCRIPTION_ALREADY_ACTIVE") {
      return NextResponse.json(
        {
          error: "Pro-доступ уже активний для цього акаунта.",
          code: "subscription_already_active",
          redirectTo: "/hire"
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: getBillingErrorMessage(error, "Не вдалося перевірити поточний доступ. Спробуйте ще раз.")
      },
      { status: 500 }
    );
  }

  try {
    const isTestMode = isLocalTestModeEnabled();
    const planConfig = getBillingPlanConfig(payload.planId);
    const localTestCheckoutStatus = getLocalTestCheckoutStatus(payload.testCheckoutStatus, planConfig.billingKind);
    const reusableCheckout = await findReusablePendingCheckout(supabase, authenticatedUser.userId, payload.planId);
    if (reusableCheckout?.mono_page_url) {
      if (!isTestMode) {
        return NextResponse.json(
          {
            checkoutId: reusableCheckout.id,
            redirectUrl: reusableCheckout.mono_page_url
          },
          { status: 200 }
        );
      }
    }

    const draft = await createCheckoutDraft(supabase, {
      userId: authenticatedUser.userId,
      planId: payload.planId,
      redirectUrl: buildMonoCheckoutReturnUrl(payload.planId, "pending")
    });
    const returnUrl = buildMonoCheckoutReturnUrl(payload.planId, draft.id);

    if (isTestMode) {
      const checkout = await activateLocalTestCheckout(supabase, {
        draft,
        returnUrl,
        status: localTestCheckoutStatus
      });

      return NextResponse.json(
        {
          checkoutId: checkout.id,
          redirectUrl: returnUrl,
          status: checkout.status,
          testMode: true
        },
        { status: 201 }
      );
    }

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
        error: getBillingErrorMessage(error, "Не вдалося створити оплату mono. Спробуйте ще раз трохи пізніше.")
      },
      { status: 502 }
    );
  }
}
