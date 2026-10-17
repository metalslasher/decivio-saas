import "server-only";

import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { prepareInvite } from "@/lib/hiring/interview";
import { updateApplicationStatus } from "@/lib/hiring/store";
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
  type CandidateScreening,
  type NotifyLevel,
  type VacancyDetail,
} from "@/lib/hiring/types";
import { getPublicSiteUrl } from "@/lib/site-url";
import { escapeHtml } from "@/lib/telegram/api";
import type { TelegramAction, TelegramCallbackQuery } from "@/lib/telegram/types";

// Employer side of the bot: linking a chat to an account and notifying about new candidates.

export const EMPLOYER_LINK_PREFIX = "e_";
const LINK_TOKEN_TTL_MS = 30 * 60 * 1000;

type SettingsRow = {
  user_id: string;
  telegram_chat_id: number | null;
  notify_level: NotifyLevel;
  link_token: string | null;
  link_token_expires_at: string | null;
};

export async function getNotificationSettings(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("employer_notification_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<SettingsRow>();
  if (error) throw new Error(`Не вдалося завантажити налаштування сповіщень: ${error.message}`);
  return data;
}

export async function createLinkToken(supabase: SupabaseClient, userId: string) {
  const token = randomBytes(18).toString("base64url");
  const { error } = await supabase.from("employer_notification_settings").upsert(
    { user_id: userId, link_token: token, link_token_expires_at: new Date(Date.now() + LINK_TOKEN_TTL_MS).toISOString() },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`Не вдалося створити посилання: ${error.message}`);
  return token;
}

export async function updateNotifyLevel(supabase: SupabaseClient, userId: string, level: NotifyLevel) {
  const { error } = await supabase
    .from("employer_notification_settings")
    .upsert({ user_id: userId, notify_level: level }, { onConflict: "user_id" });
  if (error) throw new Error(`Не вдалося зберегти налаштування: ${error.message}`);
}

export async function disconnectTelegram(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase
    .from("employer_notification_settings")
    .update({ telegram_chat_id: null, link_token: null, link_token_expires_at: null })
    .eq("user_id", userId);
  if (error) throw new Error(`Не вдалося відключити Telegram: ${error.message}`);
}

/** Handles `/start e_<token>` sent by an employer from the cabinet link. */
export async function linkEmployerChat(supabase: SupabaseClient, chatId: number, token: string): Promise<TelegramAction[]> {
  const reply = (text: string): TelegramAction[] => [{ method: "sendMessage", payload: { chat_id: chatId, text, parse_mode: "HTML" } }];

  const { data: settings } = await supabase
    .from("employer_notification_settings")
    .select("*")
    .eq("link_token", token)
    .maybeSingle<SettingsRow>();

  if (!settings || !settings.link_token_expires_at || new Date(settings.link_token_expires_at).getTime() < Date.now()) {
    return reply("Посилання для підключення застаріло. Натисніть «Підключити Telegram» у кабінеті Decivio ще раз.");
  }

  // A chat can receive notifications for one account only.
  await supabase.from("employer_notification_settings").update({ telegram_chat_id: null }).eq("telegram_chat_id", chatId);
  const { error } = await supabase
    .from("employer_notification_settings")
    .update({ telegram_chat_id: chatId, link_token: null, link_token_expires_at: null })
    .eq("user_id", settings.user_id);
  if (error) {
    return reply("Не вдалося підключити сповіщення. Спробуйте ще раз пізніше.");
  }

  const levelText =
    settings.notify_level === "all" ? "про кожного нового кандидата" : "про сильних кандидатів («Дзвонити першим»)";
  return reply(`✅ Сповіщення Decivio підключено.\n\nТепер я писатиму сюди ${levelText}. Змінити це можна в кабінеті.`);
}

/** Builds a notification for the vacancy owner, or nothing if they did not opt in for this candidate. */
export async function buildCandidateNotification(
  supabase: SupabaseClient,
  vacancy: VacancyDetail,
  application: { id: string; name: string; phone: string; screening: CandidateScreening | null; source: string },
): Promise<TelegramAction[]> {
  const settings = await getNotificationSettings(supabase, vacancy.owner_id);
  if (!settings?.telegram_chat_id || settings.notify_level === "off") {
    return [];
  }

  const isStrong = application.screening?.verdict === "call";
  if (settings.notify_level === "strong" && !isStrong) {
    return [];
  }

  const screening = application.screening;
  const header = isStrong ? "🔥 Сильний кандидат" : "📨 Новий кандидат";
  const lines = [
    `${header} на «${escapeHtml(vacancy.content.title)}»`,
    "",
    `<b>${escapeHtml(application.name)}</b>${screening ? ` · ${screening.score}/100` : ""}`,
    screening ? escapeHtml(screening.headline) : "Без ШІ-оцінки (ліміт безкоштовного тарифу).",
    ...(screening?.strengths.slice(0, 3).map((item) => `✓ ${escapeHtml(item)}`) ?? []),
    "",
    `📞 ${escapeHtml(application.phone)}${application.source === "telegram" ? " · відгук з Telegram" : ""}`,
  ];

  return [
    {
      method: "sendMessage",
      payload: {
        chat_id: settings.telegram_chat_id,
        text: lines.join("\n"),
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Запросити", callback_data: `s:${application.id}:invited` },
              { text: "✖ Відмова", callback_data: `s:${application.id}:rejected` },
            ],
            [{ text: "Відкрити в Decivio", url: `${getPublicSiteUrl()}/hire/${vacancy.id}` }],
          ],
        },
      },
    },
  ];
}

/** Handles status buttons (`s:<applicationId>:<status>`) pressed in a notification. */
export async function handleStatusCallback(supabase: SupabaseClient, query: TelegramCallbackQuery): Promise<TelegramAction[] | null> {
  const match = /^s:([0-9a-f-]{36}):(invited|rejected|hired|new)$/.exec(query.data ?? "");
  if (!match || !query.message) {
    return null;
  }

  const chatId = query.message.chat.id;
  const ack = (text: string): TelegramAction => ({ method: "answerCallbackQuery", payload: { callback_query_id: query.id, text } });

  const { data: settings } = await supabase
    .from("employer_notification_settings")
    .select("user_id")
    .eq("telegram_chat_id", chatId)
    .maybeSingle<{ user_id: string }>();
  if (!settings) {
    return [ack("Цей чат не підключено до кабінету Decivio.")];
  }

  const status = match[2] as ApplicationStatus;
  const updated = await updateApplicationStatus(supabase, settings.user_id, match[1], status);
  if (!updated) {
    return [ack("Кандидата не знайдено.")];
  }

  const invite = status === "invited" ? await prepareInvite(supabase, settings.user_id, match[1]) : null;
  const inviteText =
    invite && invite.actions.length > 0
      ? "Кандидату надіслано вибір часу співбесіди в Telegram. Я повідомлю, коли він запишеться."
      : invite?.interviewUrl
        ? `Посилання для запису на співбесіду — надішліть кандидату у Viber чи SMS:
${invite.interviewUrl}`
        : null;
  const inviteNote =
    inviteText
      ? [
          {
            method: "sendMessage" as const,
            payload: {
              chat_id: chatId,
              text: inviteText,
            },
          },
        ]
      : [];

  return [
    ack(`Позначено: ${APPLICATION_STATUS_LABELS[status]}`),
    ...(invite?.actions ?? []),
    ...inviteNote,
    {
      method: "editMessageReplyMarkup",
      payload: {
        chat_id: chatId,
        message_id: query.message.message_id,
        reply_markup: { inline_keyboard: [[{ text: `Статус: ${APPLICATION_STATUS_LABELS[status]}`, callback_data: "noop" }]] },
      },
    },
  ];
}
