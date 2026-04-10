import { AuthForm } from "@/components/auth-form";

type LoginPageProps = {
  searchParams?: {
    next?: string;
    created?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return <AuthForm mode="login" nextPath={searchParams?.next} wasJustCreated={searchParams?.created === "1"} />;
}
