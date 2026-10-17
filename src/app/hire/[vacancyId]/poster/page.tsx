import { VacancyPoster } from "@/components/hiring/vacancy-poster";
import { createMetadata } from "@/lib/seo";

type PosterPageProps = { params: Promise<{ vacancyId: string }> };

export const metadata = createMetadata({
  title: "QR-постер вакансії",
  description: "Друкований постер вакансії з QR-кодом на анкету.",
  path: "/hire",
  noIndex: true,
});

export default async function PosterPage({ params }: PosterPageProps) {
  const { vacancyId } = await params;
  return <VacancyPoster vacancyId={vacancyId} />;
}
