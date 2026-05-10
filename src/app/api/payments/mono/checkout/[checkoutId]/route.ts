import { NextResponse } from "next/server";
import {
  formatCheckoutStatusForClient,
  getUserCheckoutById,
  getUserSubscriptionAccess,
  syncCheckoutFromMonoInvoiceStatus,
  syncCheckoutFromMonoSubscriptionStatus
} from "@/lib/billing-store";
import { getMonoInvoiceStatus, getMonoSubscriptionStatus } from "@/lib/mono-acquiring";
import { getBillingErrorMessage } from "@/lib/billing-errors";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { getAuthenticatedUserFromRequest } from "@/lib/request-auth";
import { consumeRateLimit } from "@/lib/request-rate-limit";
import { isLocalTestModeEnabled } from "@/lib/test-mode";

const CHECKOUT_STATUS_RATE_LIMIT = {
  limit: 60,
  windowSeconds: 10 * 60
} as const;

function buildRateLimitSubjectHint(userId: string) {
  return `user:${userId}`;
}

type RouteContext = {
  params: {
    checkoutId: string;
  };
};

export async function GET(request: Request, { params }: RouteContext) {
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
        error: getBillingErrorMessage(error, "Сесію не вдалося підтвердити. Увійдіть ще раз і повторіть дію.")
      },
      { status: 401 }
    );
  }

  if (!authenticatedUser) {
    return NextResponse.json(
      {
        error: "Потрібно увійти в акаунт, щоб перевірити статус оплати."
      },
      { status: 401 }
    );
  }

  let rateLimit;
  try {
    rateLimit = await consumeRateLimit(supabase, {
      route: "/api/payments/mono/checkout/[checkoutId]",
      subjectHint: buildRateLimitSubjectHint(authenticatedUser.userId),
      headers: request.headers,
      limit: CHECKOUT_STATUS_RATE_LIMIT.limit,
      windowSeconds: CHECKOUT_STATUS_RATE_LIMIT.windowSeconds
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: getBillingErrorMessage(error, "Не вдалося перевірити ліміт запитів. Спробуйте ще раз.")
      },
      { status: 500 }
    );
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Забагато перевірок статусу за короткий час. Зачекайте трохи і спробуйте ще раз."
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds)
        }
      }
    );
  }

  let checkout;
  try {
    checkout = await getUserCheckoutById(supabase, authenticatedUser.userId, params.checkoutId);
  } catch (error) {
    return NextResponse.json(
      {
        error: getBillingErrorMessage(error, "Не вдалося завантажити оплату. Спробуйте ще раз.")
      },
      { status: 500 }
    );
  }

  if (!checkout) {
    return NextResponse.json(
      {
        error: "Оплату не знайдено для цього акаунта."
      },
      { status: 404 }
    );
  }

  let syncWarning: string | null = null;

  if (!isLocalTestModeEnabled() && (checkout.status === "pending" || checkout.status === "processing")) {
    try {
      if (checkout.mono_invoice_id) {
        const invoiceStatus = await getMonoInvoiceStatus(checkout.mono_invoice_id);
        checkout = (await syncCheckoutFromMonoInvoiceStatus(supabase, invoiceStatus, {
          source: "poll"
        })) ?? checkout;
      } else if (checkout.mono_subscription_id) {
        const subscriptionStatus = await getMonoSubscriptionStatus(checkout.mono_subscription_id);
        checkout = (await syncCheckoutFromMonoSubscriptionStatus(supabase, subscriptionStatus, {
          source: "poll"
        })) ?? checkout;
      }
    } catch (error) {
      syncWarning = getBillingErrorMessage(error, "Не вдалося оновити статус mono. Спробуйте перевірити ще раз трохи пізніше.");
    }
  }

  let subscription = null;
  try {
    subscription = await getUserSubscriptionAccess(supabase, authenticatedUser.userId);
  } catch (error) {
    syncWarning = getBillingErrorMessage(error, syncWarning ?? "Не вдалося повторно перевірити доступ. Спробуйте оновити сторінку.");
  }

  return NextResponse.json(
    {
      ...formatCheckoutStatusForClient(checkout, subscription),
      warning: syncWarning
    },
    { status: 200 }
  );
}
