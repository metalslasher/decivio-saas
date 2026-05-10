import { DashboardShell } from "@/components/dashboard-shell";
import { createMetadata } from "@/lib/seo";

type DashboardPageProps = {
  searchParams?: Promise<{
    view?: string;
  }>;
};

export const metadata = createMetadata({
  title: "Кабінет",
  description: "Особистий кабінет користувача Decivio.",
  path: "/dashboard",
  noIndex: true,
});

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = await searchParams;

  return <DashboardShell requestedView={resolvedSearchParams?.view} />;
}
