import { DashboardShell } from "@/components/dashboard-shell";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Кабінет",
  description: "Особистий кабінет користувача Decivio.",
  path: "/dashboard",
  noIndex: true
});

export default function DashboardPage() {
  return <DashboardShell />;
}
