import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { claimGuestSimulationsForUser } from "@/lib/guest-simulation-transfer";
import { GUEST_USER_COOKIE_NAME } from "@/lib/guest-session";
import { getAuthenticatedUserIdFromRequest } from "@/lib/request-auth";
import { consumeRateLimit } from "@/lib/request-rate-limit";

const CLAIM_GUEST_SIMULATIONS_RATE_LIMIT = {
  limit: 10,
  windowSeconds: 10 * 60
} as const;

function buildRateLimitSubjectHint(userId: string | null, guestSessionId: string | null) {
  if (userId?.trim()) {
    return `user:${userId.trim()}`;
  }

  if (guestSessionId?.trim()) {
    return `guest:${guestSessionId.trim()}`;
  }

  return "anonymous";
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

  let userId: string | null;

  try {
    userId = await getAuthenticatedUserIdFromRequest(supabase, request);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to verify authorization."
      },
      { status: 401 }
    );
  }

  const guestSessionId = cookies().get(GUEST_USER_COOKIE_NAME)?.value ?? null;

  let rateLimit;
  try {
    rateLimit = await consumeRateLimit(supabase, {
      route: "/api/auth/claim-guest-simulations",
      subjectHint: buildRateLimitSubjectHint(userId, guestSessionId),
      headers: request.headers,
      limit: CLAIM_GUEST_SIMULATIONS_RATE_LIMIT.limit,
      windowSeconds: CLAIM_GUEST_SIMULATIONS_RATE_LIMIT.windowSeconds
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
        error: "Too many requests in a short period. Please wait a few minutes and try again."
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds)
        }
      }
    );
  }

  if (!userId) {
    return NextResponse.json(
      {
        error: "Active authorization is required."
      },
      { status: 401 }
    );
  }

  try {
    const claimResult = await claimGuestSimulationsForUser(supabase, userId, guestSessionId);
    const response = NextResponse.json(claimResult, { status: 200 });

    if (guestSessionId) {
      response.cookies.delete(GUEST_USER_COOKIE_NAME);
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to attach guest simulations to the account."
      },
      { status: 500 }
    );
  }
}
