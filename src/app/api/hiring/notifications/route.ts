import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { errorMessage, jsonError, readJsonBody, requireUser } from "@/lib/hiring/http";
import type { NotificationSettings, NotifyLevel } from "@/lib/hiring/types";
import { isRecord } from "@/lib/hiring/validate";
import { getTelegramBotToken } from "@/lib/telegram/api";
import {
  EMPLOYER_LINK_PREFIX,
  createLinkToken,
  disconnectTelegram,
  getNotificationSettings,
  updateNotifyLevel,
} from "@/lib/telegram/employer";

function getBotUsername() {
  return process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "") || null;
}

function isNotifyLevel(value: unknown): value is NotifyLevel {
  return value === "strong" || value === "all" || value === "off";
}

export async function GET(request: Request) {
  const supabase = getSupabaseServiceRoleClient();
  const user = await requireUser(supabase, request);
  if (!user) return jsonError("Потрібно увійти в акаунт.", 401);

  try {
    const settings = await getNotificationSettings(supabase, user.userId);
    const result: NotificationSettings = {
      botConfigured: Boolean(getBotUsername() && getTelegramBotToken()),
      connected: Boolean(settings?.telegram_chat_id),
      level: settings?.notify_level ?? "strong",
    };
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(errorMessage(error, "Не вдалося завантажити налаштування."), 500);
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseServiceRoleClient();
  const user = await requireUser(supabase, request);
  if (!user) return jsonError("Потрібно увійти в акаунт.", 401);

  const body = await readJsonBody(request);
  if (!isRecord(body)) return jsonError("Некоректний запит.", 400);

  try {
    if (body.action === "link") {
      const username = getBotUsername();
      if (!username) return jsonError("Telegram-бот ще не налаштований.", 503);
      const token = await createLinkToken(supabase, user.userId);
      return NextResponse.json({ url: `https://t.me/${username}?start=${EMPLOYER_LINK_PREFIX}${token}` });
    }

    if (body.action === "level" && isNotifyLevel(body.level)) {
      await updateNotifyLevel(supabase, user.userId, body.level);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "disconnect") {
      await disconnectTelegram(supabase, user.userId);
      return NextResponse.json({ ok: true });
    }

    return jsonError("Некоректна дія.", 400);
  } catch (error) {
    return jsonError(errorMessage(error, "Не вдалося оновити налаштування."), 500);
  }
}
