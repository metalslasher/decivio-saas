import { AuthForm } from "@/components/auth-form";
import { createMetadata } from "@/lib/seo";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
    created?: string;
  }>;
};

export const metadata = createMetadata({
  title: "Вхід",
  description: "Сторінка входу в акаунт Decivio.",
  path: "/login",
  noIndex: true
});

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <AuthForm
      initialView="login"
      nextPath={resolvedSearchParams?.next}
      initialNotice={resolvedSearchParams?.created === "1" ? "Акаунт створено. Підтвердьте email у листі, а потім увійдіть у свій профіль." : null}
    />
  );
}
