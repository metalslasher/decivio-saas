const technicalErrorPatterns = [
  "missing env var",
  "missing env vars",
  "supabase server is not configured",
  "failed to fetch",
  "fetch failed",
  "econnrefused",
  "enotfound",
  "jwt",
  "invalid api key",
  "mono api",
  "failed to apply request rate limiting",
  "failed to verify authorization",
  "failed to load checkout",
  "failed to sync checkout"
];

function getRawErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const value = (error as { message?: unknown }).message;
    return typeof value === "string" ? value : null;
  }

  return null;
}

function looksTechnical(message: string) {
  const normalized = message.toLowerCase();
  return technicalErrorPatterns.some((pattern) => normalized.includes(pattern));
}

function isFriendlyUkrainianMessage(message: string) {
  return /[А-Яа-яІіЇїЄєҐґ]/.test(message) && !looksTechnical(message);
}

export function getBillingErrorMessage(error: unknown, fallback: string) {
  const rawMessage = getRawErrorMessage(error)?.trim();

  if (!rawMessage) {
    return fallback;
  }

  if (isFriendlyUkrainianMessage(rawMessage)) {
    return rawMessage;
  }

  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("subscription_already_active")) {
    return "Pro-доступ уже активний для цього акаунта.";
  }

  if (normalized.includes("mono api") || normalized.includes("x-token")) {
    return "Не вдалося зв'язатися з mono. Спробуйте ще раз трохи пізніше.";
  }

  if (normalized.includes("missing env")) {
    return "Оплата тимчасово недоступна: серверні налаштування ще не завершені.";
  }

  if (normalized.includes("fetch failed") || normalized.includes("failed to fetch") || normalized.includes("econnrefused")) {
    return "Не вдалося підключитися до платіжного сервісу. Спробуйте ще раз трохи пізніше.";
  }

  if (normalized.includes("jwt") || normalized.includes("authorization") || normalized.includes("auth")) {
    return "Сесію не вдалося підтвердити. Увійдіть в акаунт ще раз і повторіть дію.";
  }

  if (normalized.includes("rate")) {
    return "Забагато запитів за короткий час. Зачекайте кілька хвилин і спробуйте ще раз.";
  }

  return fallback;
}
