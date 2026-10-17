import "server-only";

import type { TelegramAction } from "@/lib/telegram/types";

export function getTelegramBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  return token ? token : null;
}

export async function callTelegram(method: string, payload: Record<string, unknown>) {
  const token = getTelegramBotToken();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
  if (!response.ok || !body?.ok) {
    throw new Error(`Telegram ${method} failed: ${body?.description ?? response.status}`);
  }

  return body;
}

export async function runTelegramActions(actions: TelegramAction[]) {
  for (const action of actions) {
    try {
      await callTelegram(action.method, action.payload);
    } catch (error) {
      // One failed call (e.g. editing an old message) must not stop the rest of the reply.
      console.error(error);
    }
  }
}

/** Escapes user and vacancy text for `parse_mode: "HTML"`. */
export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
