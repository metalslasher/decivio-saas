import Link from "next/link";
import { CheckoutGate } from "@/components/checkout-gate";
import { getPricingPlan, pricingPlans } from "@/lib/pricing";

type CheckoutPageProps = {
  searchParams?: {
    plan?: string;
  };
};

export default function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const plan = getPricingPlan(searchParams?.plan);

  return (
    <section className="space-y-8 py-4 md:space-y-10 md:py-8">
      <header className="max-w-4xl space-y-4 md:space-y-5">
        <span className="eyebrow-pill">Оформлення</span>
        <h1 className="page-title max-w-[12ch]">Підготуємо оплату і закріпимо доступ за вашим акаунтом.</h1>
        <p className="lead-copy max-w-3xl">
          Ви обрали <strong>{plan.name.toLowerCase()}</strong>. Сам платіжний крок під mono підключається окремо, але сам флоу вже
          побудований так, як і потрібно для продакшен-версії.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        {pricingPlans.map((item) => {
          const isActive = item.id === plan.id;

          return (
            <Link
              key={item.id}
              href={`/checkout?plan=${item.id}`}
              className={`inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-[var(--accent-strong)] text-white shadow-[0_14px_30px_-22px_rgba(41,73,244,0.54)]"
                  : "border border-[var(--line-soft)] bg-[rgba(255,255,255,0.76)] text-[var(--text-muted)] hover:text-[var(--text-strong)]"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>

      <CheckoutGate plan={plan} />
    </section>
  );
}
