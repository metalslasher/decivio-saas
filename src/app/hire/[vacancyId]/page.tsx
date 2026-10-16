import { VacancyWorkspace } from "@/components/hiring/vacancy-workspace";
import { createMetadata } from "@/lib/seo";

type VacancyPageProps = {
  params: Promise<{ vacancyId: string }>;
  searchParams?: Promise<{ created?: string }>;
};

export const metadata = createMetadata({
  title: "Кандидати",
  description: "Кандидати на вакансію в Decivio.",
  path: "/hire",
  noIndex: true,
});

export default async function VacancyPage({ params, searchParams }: VacancyPageProps) {
  const { vacancyId } = await params;
  const resolvedSearchParams = await searchParams;

  return <VacancyWorkspace vacancyId={vacancyId} justCreated={resolvedSearchParams?.created === "1"} />;
}
