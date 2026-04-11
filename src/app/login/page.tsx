import { AuthForm } from "@/components/auth-form";
import { createMetadata } from "@/lib/seo";

type LoginPageProps = {
  searchParams?: {
    next?: string;
    created?: string;
  };
};

export const metadata = createMetadata({
  title: "Вхід",
  description: "Сторінка входу в акаунт Decivio.",
  path: "/login",
  noIndex: true
});

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <AuthForm
      initialView="login"
      nextPath={searchParams?.next}
      initialNotice={searchParams?.created === "1" ? "Акаунт створено. Підтвердьте email у листі, а потім увійдіть у свій профіль." : null}
    />
  );
}
