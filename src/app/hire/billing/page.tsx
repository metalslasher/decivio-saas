import { BillingOverviewPanel } from "@/components/hiring/billing-overview";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Тариф і оплата",
  description: "Тариф, ліміти та підписка Decivio.",
  path: "/hire/billing",
  noIndex: true,
});

export default function BillingPage() {
  return <BillingOverviewPanel />;
}
