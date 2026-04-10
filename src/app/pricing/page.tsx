import Link from "next/link";
import { formatUah, getCheckoutHref, paidFeatureSections, pricingFlowSteps, pricingPlans } from "@/lib/pricing";

export default function PricingPage() {
  return (
    <section className="space-y-8 py-4 md:space-y-10 md:py-8">
      <header className="max-w-4xl space-y-4 md:space-y-5">
        <span className="eyebrow-pill">Тарифи</span>
        <h1 className="page-title max-w-[13ch]">Один платний доступ. Два формати оплати.</h1>
        <p className="lead-copy max-w-3xl">
          Усі платні інструменти однакові в обох планах. Різниця тільки в періоді списання: місяць або рік. Безкоштовний AI-висновок
          залишається окремим першим кроком перед покупкою.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-[var(--text-muted)]">
          <Link href="/simulate" className="text-[var(--accent-strong)] transition hover:text-[var(--accent)]">
            Спочатку пройти безкоштовну симуляцію
          </Link>
          <span className="hidden h-1.5 w-1.5 rounded-full bg-[var(--accent)]/45 md:inline-flex" />
          <span>Річний план дешевший на {formatUah(pricingPlans[1].savingsUah)} за повний рік</span>
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        {pricingPlans.map((plan) => {
          const monthlyLine =
            plan.id === "annual"
              ? `${formatUah(plan.monthlyEquivalentUah)} / міс`
              : `${formatUah(plan.monthlyEquivalentUah)} / місяць`;

          return (
            <article key={plan.id} className={`rounded-[2.2rem] p-6 md:p-7 ${plan.featured ? "surface-dark text-white" : "surface-panel"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-sm font-semibold uppercase tracking-[0.14em] ${plan.featured ? "text-white/58" : "text-[var(--accent-strong)]"}`}>
                    {plan.badge}
                  </p>
                  <h2
                    className={`mt-3 font-display text-[1.72rem] font-bold leading-[0.98] tracking-[-0.045em] md:text-[2.12rem] ${
                      plan.featured ? "text-white" : "text-[var(--text-strong)]"
                    }`}
                  >
                    {plan.name}
                  </h2>
                </div>

                {plan.featured ? (
                  <span className="rounded-full border border-white/14 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                    Економія {formatUah(plan.savingsUah)}
                  </span>
                ) : null}
              </div>

              <p
                className={`mt-5 font-display text-[2.6rem] font-bold leading-[0.94] tracking-[-0.055em] md:text-[3.3rem] ${
                  plan.featured ? "text-white" : "text-[var(--text-strong)]"
                }`}
              >
                {monthlyLine}
              </p>
              <p className={`mt-2 text-[0.98rem] leading-[1.68] ${plan.featured ? "text-white/68" : "text-[var(--text-muted)]"}`}>
                {plan.billingLabel}. {plan.id === "annual" ? `Разом зараз ${formatUah(plan.billedNowUah)}.` : "Повний доступ без довгого циклу."}
              </p>

              <div className={`mt-6 rounded-[1.45rem] px-4 py-4 ${plan.featured ? "border border-white/10 bg-white/8" : "surface-soft"}`}>
                <p className={`text-sm font-semibold ${plan.featured ? "text-white/84" : "text-[var(--text-strong)]"}`}>Що ви купуєте</p>
                <p className={`mt-2 text-[0.95rem] leading-[1.72] ${plan.featured ? "text-white/72" : "text-[var(--text-muted)]"}`}>
                  {plan.description}
                </p>
              </div>

              <div className={`mt-4 rounded-[1.45rem] px-4 py-4 ${plan.featured ? "border border-white/10 bg-white/8" : "surface-soft"}`}>
                <p className={`text-sm font-semibold ${plan.featured ? "text-white/84" : "text-[var(--text-strong)]"}`}>У комплекті</p>
                <p className={`mt-2 text-[0.95rem] leading-[1.72] ${plan.featured ? "text-white/72" : "text-[var(--text-muted)]"}`}>
                  Увесь платний набір із головної сторінки: сценарії переходу, резюме, співбесіди, перевірка вакансій, оцінка оферу,
                  модель робочого дня і покроковий план переходу.
                </p>
              </div>

              <Link href={getCheckoutHref(plan.id)} className={`mt-7 ${plan.featured ? "btn-secondary border-white/14 bg-white/10 text-white" : "btn-primary"}`}>
                Перейти до оформлення
              </Link>
            </article>
          );
        })}
      </div>

      <section className="surface-panel rounded-[2.3rem] px-6 py-6 md:px-8 md:py-8">
        <div className="grid gap-7 md:grid-cols-[0.8fr,1.2fr] md:gap-8">
          <div className="space-y-4">
            <span className="eyebrow-pill">Що входить</span>
            <h2 className="font-display text-[1.65rem] font-bold leading-[1.02] tracking-[-0.045em] text-[var(--text-strong)] md:text-[2.16rem]">
              Платите не за один інструмент, а за повний робочий набір під перехід.
            </h2>
            <p className="text-[0.98rem] leading-[1.72] text-[var(--text-muted)]">
              Щоб не дублювати однакові функції в двох планах, ми винесли весь платний функціонал окремо. Обидві підписки дають той самий
              доступ, але з різною логікою списання.
            </p>
          </div>

          <div className="space-y-5">
            {paidFeatureSections.map((section) => (
              <div key={section.heading} className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">{section.heading}</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {section.items.map((item) => (
                    <article key={item.title} className="surface-soft rounded-[1.45rem] px-4 py-4">
                      <p className="text-[1rem] font-semibold text-[var(--text-strong)]">{item.title}</p>
                      <p className="mt-2 text-[0.93rem] leading-[1.7] text-[var(--text-muted)]">{item.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {pricingFlowSteps.map((step, index) => (
          <article key={step.title} className="surface-panel rounded-[2rem] px-5 py-6 md:px-6 md:py-7">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">0{index + 1}</p>
            <h2 className="mt-4 font-display text-[1.34rem] font-bold leading-[1.03] tracking-[-0.04em] text-[var(--text-strong)]">
              {step.title}
            </h2>
            <p className="mt-3 text-[0.94rem] leading-[1.72] text-[var(--text-muted)]">{step.description}</p>
          </article>
        ))}
      </section>
    </section>
  );
}
