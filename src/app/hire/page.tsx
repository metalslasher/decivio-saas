import { HireCabinet } from "@/components/hiring/hire-cabinet";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Мої вакансії",
  description: "Вакансії та кандидати в Decivio.",
  path: "/hire",
  noIndex: true,
});

export default function HirePage() {
  return <HireCabinet />;
}
