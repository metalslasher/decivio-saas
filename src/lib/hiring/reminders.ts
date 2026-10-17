import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { addDaysToDate, formatSlot, kyivNowLocal, parseInterviewSettings } from "@/lib/hiring/slots";
import { parseVacancyContent } from "@/lib/hiring/validate";
import { getPublicSiteUrl } from "@/lib/site-url";
import { escapeHtml } from "@/lib/telegram/api";
import type { TelegramAction, TelegramCallbackQuery } from "@/lib/telegram/types";

type ReminderRow = {
  id: string;
  candidate_name: string;
  candidate_phone: string;
  source: string | null;
  telegram_user_id: number | null;
  interview_slot: string;
  vacancy_id: string;
  hiring_vacancies: { id: string; owner_id: string; content: unknown; interview: unknown } | null;
};

/**
 * Runs once a day (Vercel Cron, 18:00 Kyiv): reminds Telegram candidates about tomorrow's interviews
 * and sends each employer a digest of tomorrow's schedule.
 */
export async function buildInterviewReminders(supabase: SupabaseClient, now = new Date()) {
  const tomorrow = addDaysToDate(kyivNowLocal(now).slice(0, 10), 1);

  const { data, error } = await supabase
    .from("hiring_applications")
    .select(
      "id, candidate_name, candidate_phone, source, telegram_user_id, interview_slot, vacancy_id, hiring_vacancies(id, owner_id, content, interview)",
    )
    .like("interview_slot", `${tomorrow}T%`)
    .eq("status", "invited")
    .is("interview_reminded_at", null);
  if (error) throw new Error(`Reminder query failed: ${error.message}`);

  const rows = (data ?? []) as unknown as ReminderRow[];
  const actions: TelegramAction[] = [];
  const byOwner = new Map<string, ReminderRow[]>();

  for (const row of rows) {
    const vacancy = row.hiring_vacancies;
    if (!vacancy) continue;
    byOwner.set(vacancy.owner_id, [...(byOwner.get(vacancy.owner_id) ?? []), row]);

    if (row.source === "telegram" && row.telegram_user_id) {
      const title = parseVacancyContent(vacancy.content).title;
      const location = parseInterviewSettings(vacancy.interview)?.location;
      actions.push({
        method: "sendMessage",
        payload: {
          chat_id: row.telegram_user_id,
          text: `⏰ Нагадування: завтра співбесіда на вакансію «${escapeHtml(title)}»\n🕒 <b>${formatSlot(row.interview_slot)}</b>${location ? `\n📍 ${escapeHtml(location)}` : ""}\n\nПідтвердьте, будь ласка:`,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ Буду", callback_data: `r:${row.id}:yes` },
                { text: "❌ Не зможу", callback_data: `r:${row.id}:no` },
              ],
            ],
          },
        },
      });
    }
  }

  if (byOwner.size > 0) {
    const { data: settings } = await supabase
      .from("employer_notification_settings")
      .select("user_id, telegram_chat_id, notify_level")
      .in("user_id", Array.from(byOwner.keys()));

    for (const setting of (settings ?? []) as Array<{ user_id: string; telegram_chat_id: number | null; notify_level: string }>) {
      if (!setting.telegram_chat_id || setting.notify_level === "off") continue;
      const owned = (byOwner.get(setting.user_id) ?? []).sort((a, b) => a.interview_slot.localeCompare(b.interview_slot));
      const lines = owned.map((row) => {
        const title = row.hiring_vacancies ? parseVacancyContent(row.hiring_vacancies.content).title : "";
        return `• ${row.interview_slot.slice(11)} — ${escapeHtml(row.candidate_name)} (${escapeHtml(title)}), ${escapeHtml(row.candidate_phone)}`;
      });
      actions.push({
        method: "sendMessage",
        payload: {
          chat_id: setting.telegram_chat_id,
          text: `📅 Завтра ${owned.length === 1 ? "1 співбесіда" : `співбесід: ${owned.length}`}\n\n${lines.join("\n")}\n\nКандидатам з Telegram я вже нагадав і попросив підтвердити.`,
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: [[{ text: "Відкрити кабінет", url: `${getPublicSiteUrl()}/hire` }]] },
        },
      });
    }
  }

  if (rows.length > 0) {
    await supabase
      .from("hiring_applications")
      .update({ interview_reminded_at: now.toISOString() })
      .in(
        "id",
        rows.map((row) => row.id),
      );
  }

  return { reminded: rows.length, actions };
}

/** Candidate answers the reminder: `r:<applicationId>:yes|no`. */
export async function handleReminderCallback(supabase: SupabaseClient, query: TelegramCallbackQuery): Promise<TelegramAction[] | null> {
  const match = /^r:([0-9a-f-]{36}):(yes|no)$/.exec(query.data ?? "");
  if (!match || !query.message) return null;

  const { data: row } = await supabase
    .from("hiring_applications")
    .select("id, candidate_name, candidate_phone, telegram_user_id, interview_slot, hiring_vacancies(id, owner_id, content)")
    .eq("id", match[1])
    .maybeSingle<Omit<ReminderRow, "hiring_vacancies" | "source" | "vacancy_id"> & { hiring_vacancies: { id: string; owner_id: string; content: unknown } | null }>();

  const ack = (text: string, alert = false): TelegramAction => ({
    method: "answerCallbackQuery",
    payload: { callback_query_id: query.id, text, show_alert: alert },
  });

  if (!row || row.telegram_user_id !== query.from.id || !row.hiring_vacancies) {
    return [ack("Запрошення не знайдено.", true)];
  }
  if (!row.interview_slot) {
    return [ack("Цю співбесіду вже скасовано.", true)];
  }

  const coming = match[2] === "yes";
  const slot = row.interview_slot;
  await supabase
    .from("hiring_applications")
    .update(coming ? { interview_confirmed: true } : { interview_confirmed: false, interview_slot: null })
    .eq("id", row.id);

  const title = parseVacancyContent(row.hiring_vacancies.content).title;
  const actions: TelegramAction[] = [
    ack(coming ? "Дякуємо, чекаємо на вас!" : "Добре, ми повідомили роботодавця."),
    {
      method: "editMessageText",
      payload: {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        text: coming
          ? `✅ Ви підтвердили співбесіду «${escapeHtml(title)}»: <b>${formatSlot(slot)}</b>. До зустрічі!`
          : `Співбесіду «${escapeHtml(title)}» скасовано. Роботодавець може запропонувати інший час.`,
        parse_mode: "HTML",
      },
    },
  ];

  const { data: settings } = await supabase
    .from("employer_notification_settings")
    .select("telegram_chat_id, notify_level")
    .eq("user_id", row.hiring_vacancies.owner_id)
    .maybeSingle<{ telegram_chat_id: number | null; notify_level: string }>();
  if (settings?.telegram_chat_id && settings.notify_level !== "off") {
    actions.push({
      method: "sendMessage",
      payload: {
        chat_id: settings.telegram_chat_id,
        text: coming
          ? `✅ <b>${escapeHtml(row.candidate_name)}</b> підтвердив(-ла) співбесіду завтра о ${slot.slice(11)} («${escapeHtml(title)}»).`
          : `❌ <b>${escapeHtml(row.candidate_name)}</b> не зможе прийти завтра о ${slot.slice(11)} («${escapeHtml(title)}»). Слот знову вільний.\n📞 ${escapeHtml(row.candidate_phone)}`,
        parse_mode: "HTML",
      },
    });
  }

  return actions;
}
