import { ResetPasswordForm } from "@/components/reset-password-form";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Новий пароль",
  description: "Сторінка оновлення пароля для акаунта Decivio.",
  path: "/reset-password",
  noIndex: true
});

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
