import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { buildInterviewReminders } from "@/lib/hiring/reminders";
import { getTelegramBotToken, runTelegramActions } from "@/lib/telegram/api";
import { isLocalTestModeEnabled } from "@/lib/test-mode";

export const maxDuration = 60;

// Called by Vercel Cron (see vercel.json). Vercel sends `Authorization: Bearer <CRON_SECRET>`.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const { reminded, actions } = await buildInterviewReminders(getSupabaseServiceRoleClient());

    if (isLocalTestModeEnabled()) {
      return NextResponse.json({ ok: true, reminded, actions });
    }
    if (getTelegramBotToken()) {
      await runTelegramActions(actions);
    }

    return NextResponse.json({ ok: true, reminded, sent: actions.length });
  } catch (error) {
    console.error("Interview reminders failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
