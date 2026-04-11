import { AuthForm } from "@/components/auth-form";
import { createMetadata } from "@/lib/seo";

type SignupPageProps = {
  searchParams?: {
    next?: string;
  };
};

export const metadata = createMetadata({
  title: "Реєстрація",
  description: "Сторінка створення акаунта в Decivio.",
  path: "/signup",
  noIndex: true
});

export default function SignupPage({ searchParams }: SignupPageProps) {
  return <AuthForm mode="signup" nextPath={searchParams?.next} />;
}
