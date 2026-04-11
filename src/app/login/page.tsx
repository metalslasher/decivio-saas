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
  return <AuthForm mode="login" nextPath={searchParams?.next} wasJustCreated={searchParams?.created === "1"} />;
}
