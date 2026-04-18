import { DashboardShell } from "@/components/dashboard-shell";
import { createMetadata } from "@/lib/seo";

type DashboardPageProps = {
  searchParams?: {
    view?: string;
    search?: string;
  };
};

export const metadata = createMetadata({
  title: "Кабінет",
  description: "Особистий кабінет користувача Decivio.",
  path: "/dashboard",
  noIndex: true
});

export default function DashboardPage({ searchParams }: DashboardPageProps) {
  return <DashboardShell requestedView={searchParams?.view} requestedSearch={searchParams?.search} />;
}
