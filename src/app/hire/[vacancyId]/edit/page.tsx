import { VacancyEdit } from "@/components/hiring/vacancy-edit";
import { createMetadata } from "@/lib/seo";

type EditVacancyPageProps = { params: Promise<{ vacancyId: string }> };

export const metadata = createMetadata({
  title: "Редагувати вакансію",
  description: "Редагування вакансії в Decivio.",
  path: "/hire",
  noIndex: true,
});

export default async function EditVacancyPage({ params }: EditVacancyPageProps) {
  const { vacancyId } = await params;
  return <VacancyEdit vacancyId={vacancyId} />;
}
