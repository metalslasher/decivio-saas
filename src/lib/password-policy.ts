export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_POLICY_HINT =
  "Пароль має містити щонайменше 8 символів, одну цифру, одну велику та одну малу літеру.";

export function validateStrongPassword(value: string) {
  if (!value) {
    return "Введіть пароль.";
  }

  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Пароль має містити щонайменше ${PASSWORD_MIN_LENGTH} символів.`;
  }

  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    return "Пароль має містити цифру, велику та малу літеру.";
  }

  return null;
}
