import type { Metadata } from "next";
import { ResultsScreen } from "@/components/results-screen";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = createMetadata({
  title: "Результат",
  description: "Персоналізований результат оцінки доходу, ринку та наступного кар'єрного кроку.",
  path: "/results",
  noIndex: true
});

type SearchParams = {
  simulationId?: string | string[];
};

type ResultsPageProps = {
  searchParams?: Promise<SearchParams>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const resolvedSearchParams = await searchParams;

  return <ResultsScreen simulationId={getSingleParam(resolvedSearchParams?.simulationId) ?? null} />;
}
