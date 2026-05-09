import { validateStrongPassword } from "@/lib/password-policy";

export type AuthView = "login" | "signup" | "reset";

export type AuthFormProps = {
  initialView: AuthView;
  nextPath?: string | null;
  initialNotice?: string | null;
  display?: "page" | "modal";
  onClose?: () => void;
  titleId?: string;
};

export type FieldName = "fullName" | "email" | "password" | "confirmPassword";
export type TouchedFields = Record<FieldName, boolean>;

export function normalizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export function buildCallbackUrl(nextPath: string) {
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("next", nextPath);
  return url.toString();
}

export function mapAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("failed to fetch") || normalized.includes("networkerror")) {
    return "Не вдалося підключитися до сервісу авторизації. Якщо ви працюєте локально, перевірте, чи запущений Supabase.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "Неправильний email або пароль.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Пошта ще не підтверджена. Спершу відкрийте лист і підтвердьте акаунт.";
  }

  if (normalized.includes("user already registered")) {
    return "Користувач із таким email уже існує.";
  }

  if (normalized.includes("same password")) {
    return "Новий пароль має відрізнятися від попереднього.";
  }

  if (normalized.includes("password")) {
    return "Пароль занадто слабкий або не відповідає вимогам.";
  }

  if (normalized.includes("rate limit")) {
    return "Забагато спроб. Спробуйте ще раз трохи пізніше.";
  }

  return message;
}

export function getViewCopy(view: AuthView) {
  switch (view) {
    case "signup":
      return {
        title: "Реєстрація",
        description: null,
        submitLabel: "Зареєструватися",
        submitBusyLabel: "Створюємо акаунт..."
      };
    case "reset":
      return {
        title: "Відновлення пароля",
        description: "Введіть email, і ми надішлемо посилання для зміни пароля.",
        submitLabel: "Надіслати посилання",
        submitBusyLabel: "Надсилаємо лист..."
      };
    default:
      return {
        title: "Вхід",
        description: null,
        submitLabel: "Увійти",
        submitBusyLabel: "Входимо..."
      };
  }
}

export function isEmailFormatValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function getEmailValidationError(value: string) {
  if (!value.trim()) {
    return "Введіть email.";
  }

  if (!isEmailFormatValid(value)) {
    return "Вкажіть коректний email.";
  }

  return null;
}

export function getFullNameValidationError(value: string, view: AuthView) {
  if (view !== "signup") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return "Введіть ім'я.";
  }

  if (normalized.length > 80) {
    return "Ім'я має бути коротшим за 80 символів.";
  }

  return null;
}

export function getPasswordValidationError(value: string, view: AuthView) {
  if (view === "reset") {
    return null;
  }

  if (!value) {
    return "Введіть пароль.";
  }

  if (view === "signup") {
    return validateStrongPassword(value);
  }

  return null;
}

export function getConfirmPasswordValidationError(password: string, confirmPassword: string, view: AuthView) {
  if (view !== "signup") {
    return null;
  }

  if (!confirmPassword) {
    return "Підтвердіть пароль.";
  }

  if (password !== confirmPassword) {
    return "Паролі не збігаються.";
  }

  return null;
}
