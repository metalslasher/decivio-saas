import "server-only";

import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { futureSlots, formatSlot, parseInterviewSettings } from "@/lib/hiring/slots";
import { getOwnerVacancy, getVacancyById } from "@/lib/hiring/store";
import type { ApplicationSource, VacancyDetail } from "@/lib/hiring/types";
import { getPublicSiteUrl } from "@/lib/site-url";
import { escapeHtml } from "@/lib/telegram/api";
import type { TelegramAction } from "@/lib/telegram/types";

type InviteRow = {
  id: string;
  vacancy_id: string;
  candidate_name: string;
  candidate_phone: string;
  source: ApplicationSource | null;
  telegram_user_id: number | null;
  interview_token: string | null;
  interview_slot: string | null;
};

const MAX_TELEGRAM_SLOT_BUTTONS = 8;

export function buildInterviewUrl(token: string) {
  return `${getPublicSiteUrl()}/interview/${token}`;
}

export async function saveInterviewSettings(
  supabase: SupabaseClient,
  ownerId: string,
  vacancyId: string,
  value: unknown,
) {
  const settings = parseInterviewSettings(value);
  const { data, error } = await supabase
    .from("hiring_vacancies")
    .update({ interview: settings })
    .eq("id", vacancyId)
    .eq("owner_id", ownerId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`Не вдалося зберегти слоти: ${error.message}`);
  return data ? settings : null;
}

export async function listTakenSlots(supabase: SupabaseClient, vacancyId: string, exceptApplicationId?: string) {
  const { data, error } = await supabase
    .from("hiring_applications")
    .select("id, interview_slot")
    .eq("vacancy_id", vacancyId)
    .not("interview_slot", "is", null);
  if (error) throw new Error(`Не вдалося завантажити зайняті слоти: ${error.message}`);
  return (data ?? [])
    .filter((row: { id: string }) => row.id !== exceptApplicationId)
    .map((row: { interview_slot: string }) => row.interview_slot);
}

async function loadInviteRow(supabase: SupabaseClient, column: "id" | "interview_token", value: string) {
  const { data, error } = await supabase
    .from("hiring_applications")
    .select("id, vacancy_id, candidate_name, candidate_phone, source, telegram_user_id, interview_token, interview_slot")
    .eq(column, value)
    .maybeSingle<InviteRow>();
  if (error) throw new Error(`Не вдалося завантажити кандидата: ${error.message}`);
  return data;
}

function telegramSlotInvite(row: InviteRow, vacancy: VacancyDetail, slots: string[]): TelegramAction | null {
  if (row.source !== "telegram" || !row.telegram_user_id || slots.length === 0) return null;

  const location = vacancy.interview?.location ? `\n📍 ${escapeHtml(vacancy.interview.location)}` : "";
  return {
    method: "sendMessage",
    payload: {
      chat_id: row.telegram_user_id,
      text: `🎉 Вас запрошують на співбесіду на вакансію «${escapeHtml(vacancy.content.title)}»!${location}\n\nОберіть зручний час:`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: slots
          .slice(0, MAX_TELEGRAM_SLOT_BUTTONS)
          .map((slot) => [{ text: formatSlot(slot), callback_data: `i:${row.id}:${slot.replace(/[-:T]/g, "")}` }]),
      },
    },
  };
}

/**
 * Called when the employer marks a candidate as invited.
 * Creates the booking link and, for Telegram candidates, the bot message with slot buttons.
 */
export async function prepareInvite(
  supabase: SupabaseClient,
  ownerId: string,
  applicationId: string,
): Promise<{ interviewUrl: string | null; actions: TelegramAction[] }> {
  const row = await loadInviteRow(supabase, "id", applicationId);
  const vacancy = row ? await getOwnerVacancy(supabase, ownerId, row.vacancy_id) : null;
  if (!row || !vacancy) return { interviewUrl: null, actions: [] };

  let token = row.interview_token;
  if (!token) {
    token = randomBytes(12).toString("base64url");
    const { error } = await supabase.from("hiring_applications").update({ interview_token: token }).eq("id", row.id);
    if (error) throw new Error(`Не вдалося створити посилання для запису: ${error.message}`);
  }

  const slots = futureSlots(vacancy.interview, await listTakenSlots(supabase, vacancy.id, row.id));
  const invite = row.interview_slot ? null : telegramSlotInvite(row, vacancy, slots);
  return { interviewUrl: buildInterviewUrl(token), actions: invite ? [invite] : [] };
}

export type BookingView = {
  applicationId: string;
  candidateName: string;
  vacancyTitle: string;
  city: string | null;
  location: string;
  bookedSlot: string | null;
  freeSlots: string[];
};

export async function getBookingView(supabase: SupabaseClient, token: string): Promise<BookingView | null> {
  if (!/^[A-Za-z0-9_-]{10,40}$/.test(token)) return null;
  const row = await loadInviteRow(supabase, "interview_token", token);
  const vacancy = row ? await getVacancyById(supabase, row.vacancy_id) : null;
  if (!row || !vacancy) return null;

  return {
    applicationId: row.id,
    candidateName: row.candidate_name,
    vacancyTitle: vacancy.content.title,
    city: vacancy.city,
    location: vacancy.interview?.location ?? "",
    bookedSlot: row.interview_slot,
    freeSlots: futureSlots(vacancy.interview, await listTakenSlots(supabase, vacancy.id, row.id)),
  };
}

function bookingNotice(row: InviteRow, vacancy: VacancyDetail, slot: string, chatId: number): TelegramAction {
  return {
    method: "sendMessage",
    payload: {
      chat_id: chatId,
      text: `📅 <b>${escapeHtml(row.candidate_name)}</b> записався(-лася) на співбесіду «${escapeHtml(vacancy.content.title)}»\n🕒 ${formatSlot(slot)}\n📞 ${escapeHtml(row.candidate_phone)}`,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "Відкрити в Decivio", url: `${getPublicSiteUrl()}/hire/${vacancy.id}` }]] },
    },
  };
}

export type BookingResult =
  | { ok: true; slot: string; actions: TelegramAction[] }
  | { ok: false; reason: "not_found" | "invalid_slot" | "taken" };

/** Books a slot for an invited candidate. Identified either by booking token or by application id + Telegram user. */
export async function bookInterviewSlot(
  supabase: SupabaseClient,
  target: { token: string } | { applicationId: string; telegramUserId: number },
  slot: string,
): Promise<BookingResult> {
  const row =
    "token" in target
      ? await loadInviteRow(supabase, "interview_token", target.token)
      : await loadInviteRow(supabase, "id", target.applicationId);
  if (!row || ("telegramUserId" in target && row.telegram_user_id !== target.telegramUserId)) {
    return { ok: false, reason: "not_found" };
  }

  const vacancy = await getVacancyById(supabase, row.vacancy_id);
  if (!vacancy) return { ok: false, reason: "not_found" };

  const allowed = futureSlots(vacancy.interview, await listTakenSlots(supabase, vacancy.id, row.id));
  if (!allowed.includes(slot)) {
    const taken = (vacancy.interview?.slots ?? []).includes(slot);
    return { ok: false, reason: taken ? "taken" : "invalid_slot" };
  }

  const { error } = await supabase.from("hiring_applications").update({ interview_slot: slot, interview_reminded_at: null, interview_confirmed: null })
    .eq("id", row.id);
  if (error) {
    // Unique index (vacancy_id, interview_slot): somebody booked it a moment earlier.
    if (error.code === "23505") return { ok: false, reason: "taken" };
    throw new Error(`Не вдалося записати на співбесіду: ${error.message}`);
  }

  const { data: settings } = await supabase
    .from("employer_notification_settings")
    .select("telegram_chat_id, notify_level")
    .eq("user_id", vacancy.owner_id)
    .maybeSingle<{ telegram_chat_id: number | null; notify_level: string }>();
  const actions = settings?.telegram_chat_id && settings.notify_level !== "off" ? [bookingNotice(row, vacancy, slot, settings.telegram_chat_id)] : [];
  return { ok: true, slot, actions };
}
