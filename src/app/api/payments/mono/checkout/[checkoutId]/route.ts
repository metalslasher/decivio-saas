import { NextResponse } from "next/server";
import {
  formatCheckoutStatusForClient,
  getUserCheckoutById,
  getUserSubscriptionAccess,
  syncCheckoutFromMonoInvoiceStatus,
  syncCheckoutFromMonoSubscriptionStatus
} from "@/lib/billing-store";
import { getMonoInvoiceStatus, getMonoSubscriptionStatus } from "@/lib/mono-acquiring";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { getAuthenticatedUserFromRequest } from "@/lib/request-auth";
import { consumeRateLimit } from "@/lib/request-rate-limit";

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
        error: "Active authorization is required."
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
        error: error instanceof Error ? error.message : "Failed to apply request rate limiting."
      },
      { status: 500 }
    );
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many checkout status requests in a short period. Please wait a bit and try again."
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
        error: error instanceof Error ? error.message : "Failed to load checkout."
      },
      { status: 500 }
    );
  }

  if (!checkout) {
    return NextResponse.json(
      {
        error: "Checkout was not found."
      },
      { status: 404 }
    );
  }

  let syncWarning: string | null = null;

  if (checkout.status === "pending" || checkout.status === "processing") {
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
      syncWarning = error instanceof Error ? error.message : "Failed to sync checkout with mono.";
    }
  }

  let subscription = null;
  try {
    subscription = await getUserSubscriptionAccess(supabase, authenticatedUser.userId);
  } catch (error) {
    syncWarning = error instanceof Error ? error.message : syncWarning;
  }

  return NextResponse.json(
    {
      ...formatCheckoutStatusForClient(checkout, subscription),
      warning: syncWarning
    },
    { status: 200 }
  );
}
