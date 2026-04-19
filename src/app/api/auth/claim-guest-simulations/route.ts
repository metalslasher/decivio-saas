import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/db/supabase";
import { claimGuestSimulationsForUser } from "@/lib/guest-simulation-transfer";
import { GUEST_USER_COOKIE_NAME } from "@/lib/guest-session";
import { getAuthenticatedUserIdFromRequest } from "@/lib/request-auth";

export async function POST(request: Request) {
  let supabase;

  try {
    supabase = getSupabaseAdminClient();
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Сервер Supabase не налаштовано."
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
        error: error instanceof Error ? error.message : "Не вдалося підтвердити авторизацію."
      },
      { status: 401 }
    );
  }

  if (!userId) {
    return NextResponse.json(
      {
        error: "Потрібна активна авторизація."
      },
      { status: 401 }
    );
  }

  const guestSessionId = cookies().get(GUEST_USER_COOKIE_NAME)?.value ?? null;

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
        error: error instanceof Error ? error.message : "Не вдалося закріпити сценарії за акаунтом."
      },
      { status: 500 }
    );
  }
}
