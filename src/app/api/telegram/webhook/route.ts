import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { runTelegramActions } from "@/lib/telegram/api";
import { handleTelegramUpdate } from "@/lib/telegram/bot";
import type { TelegramUpdate } from "@/lib/telegram/types";
import { isLocalTestModeEnabled } from "@/lib/test-mode";

export const maxDuration = 60;

function isAuthorized(request: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const received = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!expected) {
    return false;
  }

  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    const actions = await handleTelegramUpdate(getSupabaseServiceRoleClient(), update);

    // In local test mode the actions are returned instead of being sent, so the dialog can be tested without Telegram.
    if (isLocalTestModeEnabled()) {
      return NextResponse.json({ ok: true, actions });
    }

    await runTelegramActions(actions);
  } catch (error) {
    // Always answer 200: otherwise Telegram keeps retrying the same update.
    console.error("Telegram update failed", error);
  }

  return NextResponse.json({ ok: true });
}
