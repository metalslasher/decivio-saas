import { redirect } from "next/navigation";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Реєстрація",
  description: "Сторінка створення акаунта в Decivio.",
  path: "/signup",
  noIndex: true
});

export default function SignupPage() {
  redirect("/pricing");
}
