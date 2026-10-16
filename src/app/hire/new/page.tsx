import { Suspense } from "react";
import { VacancyBuilder } from "@/components/hiring/vacancy-builder";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Створити вакансію з ШІ",
  description: "Опишіть, кого шукаєте, і за 30 секунд отримайте готову вакансію, оплату-орієнтир і анкету для кандидатів.",
  path: "/hire/new",
});

export default function NewVacancyPage() {
  return (
    <Suspense>
      <VacancyBuilder />
    </Suspense>
  );
}
