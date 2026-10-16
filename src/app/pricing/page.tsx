import Link from "next/link";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { PricingPurchaseButton } from "@/components/pricing-purchase-button";
import { PLAN_LIMITS } from "@/lib/hiring/types";
import { formatUah, paidFeatureSections, pricingFlowSteps, pricingPlans } from "@/lib/pricing";
import { createBreadcrumbSchema, createMetadata, createSoftwareApplicationSchema } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Тарифи",
  description: "Тарифи Decivio для бізнесу: безкоштовний старт, Pro за 990 грн/міс або 90 днів одним платежем.",
  path: "/pricing",
  keywords: ["тарифи decivio", "вартість найму персоналу", "сервіс підбору персоналу ціна"],
});

const pricingSchemas = [
  createBreadcrumbSchema([
    { name: "Головна", path: "/" },
    { name: "Тарифи", path: "/pricing" },
  ]),
  createSoftwareApplicationSchema({
    path: "/pricing",
    description: "Тарифи ШІ-асистента найму Decivio для малого й середнього бізнесу.",
    featureList: paidFeatureSections.flatMap((section) => section.items.map((item) => item.title)),
    offers: pricingPlans.map((plan) => ({
      name: plan.name,
      price: plan.billedNowUah,
      description: plan.description,
      urlPath: "/pricing",
    })),
  }),
];

const comparisonRows: Array<{ label: string; free: string; pro: string }> = [
  { label: "Активні вакансії", free: String(PLAN_LIMITS.free.activeVacancies), pro: String(PLAN_LIMITS.pro.activeVacancies) },
  { label: "ШІ-оцінка кандидатів", free: `до ${PLAN_LIMITS.free.screenedApplications}`, pro: "Без обмежень" },
  { label: "Генерація вакансії та анкети", free: "✓", pro: "✓" },
  { label: "Стоп-фільтри і рейтинг", free: "✓", pro: "✓" },
  { label: "Питання для дзвінка", free: "✓", pro: "✓" },
  { label: "Пріоритетна підтримка", free: "—", pro: "✓" },
];

export default function PricingPage() {
  return (
    <>
      <JsonLd data={pricingSchemas} />

      <div className="py-4 md:py-8">
        <header className="mx-auto max-w-3xl text-center fade-up">
          <span className="eyebrow-pill">Тарифи</span>
          <h1 className="page-title mx-auto mt-5 max-w-[18ch]">Одна вдала наймана людина окупає рік підписки</h1>
          <p className="lead-copy mx-auto mt-4 max-w-2xl">
            Почніть безкоштовно на реальній вакансії. Переходьте на Pro, коли наймаєте регулярно або на кілька посад одночасно.
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <article className="card flex flex-col p-7">
            <p className="text-lg font-extrabold text-[var(--text-strong)]">Старт</p>
            <p className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--text-strong)]">0 грн</p>
            <p className="body-copy mt-2">Спробуйте на одній вакансії — без картки.</p>
            <ul className="mt-5 flex-1 space-y-2 text-sm font-semibold text-[var(--text-strong)]">
              <li>✓ 1 активна вакансія</li>
              <li>✓ До 10 оцінених кандидатів</li>
              <li>✓ Текст вакансії, анкета, рейтинг</li>
            </ul>
            <Link href="/hire/new" className="btn-secondary mt-7">
              Почати безкоштовно
            </Link>
          </article>

          {pricingPlans.map((plan) => (
            <article key={plan.id} className={`flex flex-col p-7 ${plan.featured ? "card-ink" : "card"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-extrabold">{plan.name}</p>
                <span className={`chip ${plan.featured ? "!bg-white/10 !text-white" : ""}`}>{plan.badge}</span>
              </div>
              <p className="mt-3 text-4xl font-extrabold tracking-tight">
                {formatUah(plan.billedNowUah)}
                <span className={`text-base font-semibold ${plan.featured ? "text-white/60" : "text-[var(--text-muted)]"}`}>
                  {plan.id === "monthly" ? " / міс" : " / 90 днів"}
                </span>
              </p>
              <p className={`mt-2 text-[0.95rem] leading-relaxed ${plan.featured ? "text-white/70" : "text-[var(--text-muted)]"}`}>{plan.description}</p>
              <p className={`mt-3 text-xs font-bold ${plan.featured ? "text-white/50" : "text-[var(--text-soft)]"}`}>
                {plan.billingLabel}
                {plan.savingsUah > 0 ? ` · економія ${formatUah(plan.savingsUah)}` : ""}
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm font-semibold">
                <li>✓ До {PLAN_LIMITS.pro.activeVacancies} активних вакансій</li>
                <li>✓ Необмежена ШІ-оцінка кандидатів</li>
                <li>✓ Пріоритетна підтримка</li>
              </ul>
              <div className="mt-7">
                <Suspense fallback={<button type="button" disabled className="btn-primary w-full opacity-70">Обрати {plan.name}</button>}>
                  <PricingPurchaseButton
                    planId={plan.id}
                    label={`Обрати ${plan.name}`}
                    className={`w-full ${plan.featured ? "btn-primary" : "btn-secondary"}`}
                  />
                </Suspense>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-16">
          <h2 className="section-title">Що входить</h2>
          <div className="card mt-6 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line-soft)] text-[var(--text-muted)]">
                  <th className="p-4 font-bold">Можливість</th>
                  <th className="p-4 font-bold">Старт</th>
                  <th className="p-4 font-bold text-[var(--accent-strong)]">Pro</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label} className="border-b border-[var(--line-soft)] last:border-0">
                    <td className="p-4 font-semibold text-[var(--text-strong)]">{row.label}</td>
                    <td className="p-4 text-[var(--text-muted)]">{row.free}</td>
                    <td className="p-4 font-bold text-[var(--text-strong)]">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3">
          {pricingFlowSteps.map((step, index) => (
            <div key={step.title} className="card p-6">
              <span className="chip">Крок {index + 1}</span>
              <h3 className="mt-4 text-lg font-extrabold text-[var(--text-strong)]">{step.title}</h3>
              <p className="body-copy mt-2">{step.description}</p>
            </div>
          ))}
        </section>

        <p className="body-copy mt-10 text-center text-sm">
          Оплата карткою через monobank. Ціни вказано в гривнях.
        </p>
      </div>
    </>
  );
}
