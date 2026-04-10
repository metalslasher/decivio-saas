import { AuthForm } from "@/components/auth-form";

type SignupPageProps = {
  searchParams?: {
    next?: string;
  };
};

export default function SignupPage({ searchParams }: SignupPageProps) {
  return <AuthForm mode="signup" nextPath={searchParams?.next} />;
}
