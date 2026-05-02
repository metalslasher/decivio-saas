import { CheckoutGate } from "@/components/checkout-gate";
import { getPricingPlan } from "@/lib/pricing";
import { createMetadata } from "@/lib/seo";

type BillingReturnPageProps = {
  searchParams?: {
    plan?: string;
    checkout?: string;
  };
};

export const metadata = createMetadata({
  title: "Статус оплати",
  description: "Службова сторінка перевірки оплати й доступу Decivio.",
  path: "/billing/return",
  noIndex: true
});

function buildBillingReturnPath(planId: string, checkoutId: string | null) {
  const params = new URLSearchParams({ plan: planId });

  if (checkoutId) {
    params.set("checkout", checkoutId);
  }

  return `/billing/return?${params.toString()}`;
}

export default function BillingReturnPage({ searchParams }: BillingReturnPageProps) {
  const plan = getPricingPlan(searchParams?.plan);
  const initialCheckoutId = typeof searchParams?.checkout === "string" ? searchParams.checkout : null;
  const authNextPath = buildBillingReturnPath(plan.id, initialCheckoutId);

  return (
    <section className="space-y-8 py-4 md:space-y-10 md:py-8">
      <header className="max-w-4xl space-y-4 md:space-y-5">
        <span className="eyebrow-pill">Оплата</span>
        <h1 className="page-title max-w-[12ch]">Перевіряємо статус платежу й доступу.</h1>
        <p className="lead-copy max-w-3xl">
          Якщо mono вже підтвердив оплату, доступ автоматично закріпиться за вашим акаунтом. Якщо статус ще обробляється, сторінка
          сама оновить результат.
        </p>
      </header>

      <CheckoutGate plan={plan} initialCheckoutId={initialCheckoutId} authNextPath={authNextPath} />
    </section>
  );
}
