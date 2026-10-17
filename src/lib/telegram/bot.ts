import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { bookInterviewSlot } from "@/lib/hiring/interview";
import { formatSlot } from "@/lib/hiring/slots";
import { getVacancyById, getVacancyBySlug } from "@/lib/hiring/store";
import { buildAnswers, submitApplication } from "@/lib/hiring/submit";
import type { VacancyDetail } from "@/lib/hiring/types";
import { normalizePhone } from "@/lib/hiring/validate";
import { escapeHtml } from "@/lib/telegram/api";
import { EMPLOYER_LINK_PREFIX, handleStatusCallback, linkEmployerChat } from "@/lib/telegram/employer";
import type { TelegramAction, TelegramMessage, TelegramUpdate, TelegramUser } from "@/lib/telegram/types";

// Dialog: vacancy card → screening questions (step 0..n-1) → name (step n) → phone (step n+1) → submit.

type SessionRow = {
  chat_id: number;
  telegram_user_id: number;
  vacancy_id: string;
  step: number;
  answers: Record<string, string>;
  candidate_name: string | null;
};

const HELP_TEXT =
  "Привіт! Я допомагаю відгукнутися на вакансії за 2 хвилини.\n\nЩоб почати, відкрийте посилання «Відгукнутися в Telegram» з оголошення вакансії.";

function send(chatId: number, text: string, extra: Record<string, unknown> = {}): TelegramAction {
  return { method: "sendMessage", payload: { chat_id: chatId, text, parse_mode: "HTML", ...extra } };
}

async function loadSession(supabase: SupabaseClient, chatId: number) {
  const { data, error } = await supabase.from("telegram_sessions").select("*").eq("chat_id", chatId).maybeSingle<SessionRow>();
  if (error) throw new Error(`Telegram session load failed: ${error.message}`);
  return data;
}

async function saveSession(supabase: SupabaseClient, session: SessionRow) {
  const { error } = await supabase.from("telegram_sessions").upsert(session, { onConflict: "chat_id" });
  if (error) throw new Error(`Telegram session save failed: ${error.message}`);
}

async function deleteSession(supabase: SupabaseClient, chatId: number) {
  await supabase.from("telegram_sessions").delete().eq("chat_id", chatId);
}

function fullName(user: TelegramUser | undefined) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim().slice(0, 80);
}

function vacancyCard(vacancy: VacancyDetail) {
  const { content } = vacancy;
  const lines = [
    `<b>${escapeHtml(content.title)}</b>${vacancy.city ? `\n📍 ${escapeHtml(vacancy.city)}` : ""}`,
    `💰 ${escapeHtml(content.pay_hint)}`,
    `🕒 ${escapeHtml(content.schedule)}`,
    "",
    escapeHtml(content.summary),
    "",
    ...content.offer.slice(0, 5).map((item) => `✓ ${escapeHtml(item)}`),
    "",
    `Дайте відповідь на ${content.questions.length} коротких питань — це займе до 2 хвилин. Скасувати: /cancel`,
  ];
  return lines.join("\n");
}

function promptForStep(chatId: number, vacancy: VacancyDetail, step: number, user: TelegramUser | undefined): TelegramAction {
  const questions = vacancy.content.questions;

  if (step < questions.length) {
    const question = questions[step];
    const header = `Питання ${step + 1} з ${questions.length}\n<b>${escapeHtml(question.text)}</b>`;
    if (question.kind === "text") {
      return send(chatId, `${header}\n\nНапишіть відповідь одним повідомленням.`, { reply_markup: { remove_keyboard: true } });
    }
    return send(chatId, header, {
      reply_markup: {
        inline_keyboard: question.options.map((option, index) => [{ text: option, callback_data: `a:${step}:${index}` }]),
      },
    });
  }

  if (step === questions.length) {
    const suggested = fullName(user);
    return send(chatId, "Як до вас звертатися? Напишіть ім'я.", {
      reply_markup: suggested ? { inline_keyboard: [[{ text: `Я — ${suggested}`, callback_data: "n:me" }]] } : { remove_keyboard: true },
    });
  }

  return send(chatId, "Останній крок: номер телефону, щоб роботодавець міг вам подзвонити.", {
    reply_markup: {
      keyboard: [[{ text: "📱 Поділитися номером", request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
}

async function startDialog(supabase: SupabaseClient, message: TelegramMessage, slug: string): Promise<TelegramAction[]> {
  const chatId = message.chat.id;
  const userId = message.from?.id ?? chatId;
  const vacancy = /^[a-z0-9]{6,16}$/.test(slug) ? await getVacancyBySlug(supabase, slug) : null;

  if (!vacancy) {
    return [send(chatId, "Не знайшли цю вакансію. Перевірте посилання з оголошення.")];
  }
  if (vacancy.status !== "active") {
    return [send(chatId, `Набір на вакансію «${escapeHtml(vacancy.content.title)}» вже закрито. Дякуємо за інтерес!`)];
  }

  const { count } = await supabase
    .from("hiring_applications")
    .select("id", { count: "exact", head: true })
    .eq("vacancy_id", vacancy.id)
    .eq("telegram_user_id", userId);
  if ((count ?? 0) > 0) {
    return [send(chatId, "Ви вже відгукнулися на цю вакансію. Роботодавець зв'яжеться з вами, якщо ви підходите.")];
  }

  await saveSession(supabase, { chat_id: chatId, telegram_user_id: userId, vacancy_id: vacancy.id, step: 0, answers: {}, candidate_name: null });
  return [send(chatId, vacancyCard(vacancy)), promptForStep(chatId, vacancy, 0, message.from)];
}

async function advance(
  supabase: SupabaseClient,
  session: SessionRow,
  vacancy: VacancyDetail,
  user: TelegramUser | undefined,
): Promise<TelegramAction[]> {
  const next = { ...session, step: session.step + 1 };
  await saveSession(supabase, next);
  return [promptForStep(session.chat_id, vacancy, next.step, user)];
}

async function finish(
  supabase: SupabaseClient,
  session: SessionRow,
  vacancy: VacancyDetail,
  phone: string,
): Promise<TelegramAction[]> {
  const employerNotifications = await submitApplication(supabase, vacancy, {
    name: session.candidate_name ?? "Кандидат з Telegram",
    phone,
    answers: buildAnswers(vacancy, session.answers),
    about: null,
    source: "telegram",
    telegramUserId: session.telegram_user_id,
  });
  await deleteSession(supabase, session.chat_id);

  return [
    ...employerNotifications,
    send(
      session.chat_id,
      `✅ Відгук на вакансію «${escapeHtml(vacancy.content.title)}» надіслано!\n\nРоботодавець отримав ваші відповіді. Якщо ви підходите — вам зателефонують найближчим часом.`,
      { reply_markup: { remove_keyboard: true } },
    ),
  ];
}

/** Candidate picks an interview slot: `i:<applicationId>:<YYYYMMDDHHmm>`. */
async function handleBookingCallback(supabase: SupabaseClient, query: NonNullable<TelegramUpdate["callback_query"]>): Promise<TelegramAction[] | null> {
  const match = /^i:([0-9a-f-]{36}):(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(query.data ?? "");
  if (!match || !query.message) return null;

  const slot = `${match[2]}-${match[3]}-${match[4]}T${match[5]}:${match[6]}`;
  const chatId = query.message.chat.id;
  const result = await bookInterviewSlot(supabase, { applicationId: match[1], telegramUserId: query.from.id }, slot);

  if (!result.ok) {
    const text =
      result.reason === "not_found"
        ? "Запрошення не знайдено."
        : "Цей час уже зайнятий або минув. Оберіть інший варіант.";
    return [{ method: "answerCallbackQuery", payload: { callback_query_id: query.id, text, show_alert: true } }];
  }

  return [
    { method: "answerCallbackQuery", payload: { callback_query_id: query.id, text: "Записано!" } },
    {
      method: "editMessageText",
      payload: {
        chat_id: chatId,
        message_id: query.message.message_id,
        text: `✅ Ви записані на співбесіду: <b>${formatSlot(slot)}</b>

Якщо плани зміняться — повідомте роботодавця за телефоном.`,
        parse_mode: "HTML",
      },
    },
    ...result.actions,
  ];
}

async function handleCallback(supabase: SupabaseClient, update: TelegramUpdate): Promise<TelegramAction[]> {
  const query = update.callback_query!;
  if (query.data === "noop") {
    return [{ method: "answerCallbackQuery", payload: { callback_query_id: query.id } }];
  }
  const statusActions = await handleStatusCallback(supabase, query);
  if (statusActions) return statusActions;

  const bookingActions = await handleBookingCallback(supabase, query);
  if (bookingActions) return bookingActions;
  const actions: TelegramAction[] = [{ method: "answerCallbackQuery", payload: { callback_query_id: query.id } }];
  const message = query.message;
  if (!message) return actions;

  const chatId = message.chat.id;
  const session = await loadSession(supabase, chatId);
  const vacancy = session ? await getVacancyById(supabase, session.vacancy_id) : null;
  if (!session || !vacancy) {
    return [...actions, send(chatId, HELP_TEXT)];
  }

  const questions = vacancy.content.questions;
  const data = query.data ?? "";
  const answerMatch = /^a:(\d+):(\d+)$/.exec(data);

  if (answerMatch) {
    const step = Number(answerMatch[1]);
    const question = questions[step];
    const option = question?.options[Number(answerMatch[2])];
    // Ignore taps on buttons of already answered questions.
    if (step !== session.step || !question || option === undefined) return actions;

    session.answers = { ...session.answers, [question.id]: option };
    actions.push({
      method: "editMessageText",
      payload: {
        chat_id: chatId,
        message_id: message.message_id,
        text: `Питання ${step + 1} з ${questions.length}\n<b>${escapeHtml(question.text)}</b>\n\n➡️ ${escapeHtml(option)}`,
        parse_mode: "HTML",
      },
    });
    return [...actions, ...(await advance(supabase, session, vacancy, query.from))];
  }

  if (data === "n:me" && session.step === questions.length) {
    session.candidate_name = fullName(query.from) || null;
    if (!session.candidate_name) return actions;
    actions.push({
      method: "editMessageText",
      payload: { chat_id: chatId, message_id: message.message_id, text: `Ім'я: ${escapeHtml(session.candidate_name)}`, parse_mode: "HTML" },
    });
    return [...actions, ...(await advance(supabase, session, vacancy, query.from))];
  }

  return actions;
}

async function handleMessage(supabase: SupabaseClient, message: TelegramMessage): Promise<TelegramAction[]> {
  const chatId = message.chat.id;
  if (message.chat.type !== "private") return [];

  const text = message.text?.trim() ?? "";

  if (text.startsWith("/start")) {
    const payload = text.split(/\s+/)[1];
    if (payload?.startsWith(EMPLOYER_LINK_PREFIX)) {
      return linkEmployerChat(supabase, chatId, payload.slice(EMPLOYER_LINK_PREFIX.length));
    }
    return payload ? startDialog(supabase, message, payload) : [send(chatId, HELP_TEXT)];
  }

  if (text === "/cancel") {
    await deleteSession(supabase, chatId);
    return [send(chatId, "Відгук скасовано. Щоб почати знову, відкрийте посилання з оголошення.", { reply_markup: { remove_keyboard: true } })];
  }

  const session = await loadSession(supabase, chatId);
  const vacancy = session ? await getVacancyById(supabase, session.vacancy_id) : null;
  if (!session || !vacancy) {
    return [send(chatId, HELP_TEXT)];
  }

  const questions = vacancy.content.questions;

  if (session.step < questions.length) {
    const question = questions[session.step];
    if (question.kind === "text") {
      if (!text) return [promptForStep(chatId, vacancy, session.step, message.from)];
      session.answers = { ...session.answers, [question.id]: text.slice(0, 1000) };
      return advance(supabase, session, vacancy, message.from);
    }

    const option = question.options.find((item) => item.toLowerCase() === text.toLowerCase());
    if (!option) {
      return [send(chatId, "Будь ласка, оберіть варіант кнопкою під питанням."), promptForStep(chatId, vacancy, session.step, message.from)];
    }
    session.answers = { ...session.answers, [question.id]: option };
    return advance(supabase, session, vacancy, message.from);
  }

  if (session.step === questions.length) {
    if (text.length < 2 || text.startsWith("/")) {
      return [send(chatId, "Напишіть, будь ласка, ваше ім'я.")];
    }
    session.candidate_name = text.slice(0, 80);
    return advance(supabase, session, vacancy, message.from);
  }

  if (message.contact) {
    if (message.contact.user_id && message.from && message.contact.user_id !== message.from.id) {
      return [send(chatId, "Надішліть, будь ласка, власний номер кнопкою «Поділитися номером».")];
    }
    const phone = normalizePhone(message.contact.phone_number);
    if (phone) return finish(supabase, session, vacancy, phone);
  }

  const typedPhone = normalizePhone(text);
  if (typedPhone) {
    return finish(supabase, session, vacancy, typedPhone);
  }

  return [send(chatId, "Не вдалося розпізнати номер. Натисніть «📱 Поділитися номером» або напишіть номер у форматі 067 123 45 67.")];
}

export async function handleTelegramUpdate(supabase: SupabaseClient, update: TelegramUpdate): Promise<TelegramAction[]> {
  if (update.callback_query) {
    return handleCallback(supabase, update);
  }
  if (update.message) {
    return handleMessage(supabase, update.message);
  }
  return [];
}
