import type { Metadata } from "next";
import { ResultsScreen } from "@/components/results-screen";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = createMetadata({
  title: "Результат",
  description: "Персоналізований результат симуляції зміни кар'єри.",
  path: "/results",
  noIndex: true
});

type SearchParams = {
  simulationId?: string | string[];
};

type ResultsPageProps = {
  searchParams?: SearchParams;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ResultsPage({ searchParams }: ResultsPageProps) {
  return <ResultsScreen simulationId={getSingleParam(searchParams?.simulationId) ?? null} />;
}
