// Minimal subset of the Telegram Bot API types used by the candidate bot.

export type TelegramUser = {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
};

export type TelegramMessage = {
  message_id: number;
  chat: { id: number; type: string };
  from?: TelegramUser;
  text?: string;
  contact?: { phone_number: string; user_id?: number; first_name?: string };
};

export type TelegramCallbackQuery = {
  id: string;
  from: TelegramUser;
  data?: string;
  message?: TelegramMessage;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

/** An outgoing Bot API call produced by the dialog engine. */
export type TelegramAction = {
  method: "sendMessage" | "answerCallbackQuery" | "editMessageText";
  payload: Record<string, unknown>;
};
