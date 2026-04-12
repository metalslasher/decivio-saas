import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { formatUah, getCheckoutHref, paidFeatureSections, pricingPlans } from "@/lib/pricing";
import { createBreadcrumbSchema, createFaqSchema, createMetadata, createSoftwareApplicationSchema } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Ціни",
  description:
    "Два плани доступу до Decivio: помісячно або на рік. Сценарії переходу, резюме, співбесіди, перевірка вакансій і план зміни кар'єри в одному доступі.",
  path: "/pricing",
  keywords: ["тарифи decivio", "ціни decivio", "вартість доступу decivio", "річний доступ decivio"]
});

const pricingFaqItems = [
  {
    question: "Чим відрізняється місячний доступ від річного?",
    answer: "Функціонал однаковий. Різниця лише в способі оплати: щомісяця або одним платежем на 12 місяців."
  },
  {
    question: "Чи однаковий функціонал в обох планах?",
    answer:
      "Так. І місячний, і річний доступ відкривають увесь набір інструментів: сценарії переходу, резюме, співбесіди, перевірку вакансій, план переходу та оцінку пропозиції роботи."
  },
  {
    question: "Який план обрати, якщо я тільки стартую?",
    answer:
      "Місячний план підійде, якщо хочете зайти гнучко й оплатити лише поточний період. Річний краще брати, якщо вже розумієте, що будете системно працювати над переходом."
  },
  {
    question: "Чи можна змінити план пізніше?",
    answer:
      "Так. Якщо стартуєте з місячного формату, згодом зможете перейти на річний, коли зрозумієте, що хочете довший цикл роботи з платформою."
  },
  {
    question: "У якій валюті проходить оплата?",
    answer: "Оплата проходить у гривні. На сторінці одразу показуємо суму без прихованих доплат."
  },
  {
    question: "Чи потрібно доплачувати за окремі інструменти?",
    answer:
      "Ні. Після оформлення доступу всі інструменти вже входять у ваш план. Окремо купувати сценарії, резюме чи підготовку до співбесід не потрібно."
  }
] as const;

const featureSectionIntros: Record<string, string> = {
  "Аналітика переходу": "Щоб розуміти не одну цифру, а повну картину зміни кар'єри.",
  "Підготовка до переходу": "Щоб швидше дійти до відгуків, співбесід і сильнішого позиціонування.",
  "Робота з вакансіями": "Щоб ухвалювати рішення по реальних вакансіях, а не навмання."
};

const planBullets: Record<(typeof pricingPlans)[number]["id"], readonly string[]> = {
  monthly: [
    "Увесь набір інструментів у доступі",
    "Оплата щомісяця без довгого циклу",
    "Зручно для гнучкого старту"
  ],
  annual: [
    "Увесь набір інструментів у доступі",
    "Найнижча ціна в перерахунку на місяць",
    "Економія 4 800 грн за рік"
  ]
};

const pricingSignals = ["Два формати доступу", "Усі інструменти входять", "Оплата у гривні"] as const;

const pricingTestimonials = [
  {
    quote:
      "Найцінніше тут те, що все зібрано в одному місці. Не треба окремо шукати сценарії, резюме і підготовку до співбесід.",
    author: "Ірина Коваль",
    role: "Marketing → Product Design"
  },
  {
    quote:
      "Річний формат виглядає найсильніше по ціні, але добре, що є і помісячний варіант. Це дає нормальний вибір під різний темп переходу.",
    author: "Олексій Мельник",
    role: "Operations → Data Analytics"
  },
  {
    quote:
      "Було важливо не купувати модулі по одному. Тут оплачуєш один доступ і далі спокійно працюєш з усім набором інструментів.",
    author: "Наталія Бондар",
    role: "HR → UX Research"
  }
] as const;

const pricingSchemas = [
  createBreadcrumbSchema([
    { name: "Головна", path: "/" },
    { name: "Ціни", path: "/pricing" }
  ]),
  createSoftwareApplicationSchema({
    path: "/pricing",
    description: "Сторінка цін Decivio з двома платними форматами доступу для зміни кар'єри.",
    featureList: paidFeatureSections.flatMap((section) => section.items.map((item) => item.title)),
    offers: pricingPlans.map((plan) => ({
      name: plan.name,
      price: plan.billedNowUah,
      description: `${plan.billingLabel}. ${plan.description}`,
      urlPath: "/pricing"
    })),
    isAccessibleForFree: false
  }),
  createFaqSchema([...pricingFaqItems])
];

type PricingPlan = (typeof pricingPlans)[number];

function PlanCard({ plan }: { plan: PricingPlan }) {
  const isFeatured = plan.id === "annual";
  const monthlyLabel = `${formatUah(plan.monthlyEquivalentUah)} / міс`;
  const totalLabel = isFeatured ? `${formatUah(plan.billedNowUah)} одним платежем` : `${formatUah(plan.billedNowUah)} щомісяця`;
  const ctaLabel = isFeatured ? "Обрати річний доступ" : "Обрати місячний доступ";

  return (
    <article
      className={`relative overflow-hidden rounded-[2.2rem] border px-5 py-6 md:px-6 md:py-7 ${
        isFeatured
          ? "border-[rgba(63,94,255,0.18)] bg-[linear-gradient(180deg,rgba(248,250,255,0.98),rgba(237,242,255,0.96))] shadow-[0_24px_60px_-44px_rgba(41,73,244,0.28)]"
          : "border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.82)]"
      }`}
    >
      {isFeatured ? (
        <div className="pointer-events-none absolute -right-10 top-0 h-28 w-40 rounded-full bg-[rgba(67,97,255,0.08)] blur-3xl" />
      ) : null}

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <span
              className={`inline-flex rounded-full px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] ${
                isFeatured
                  ? "border border-[rgba(63,94,255,0.16)] bg-[rgba(238,242,255,0.95)] text-[var(--accent-strong)]"
                  : "border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.88)] text-[var(--text-muted)]"
              }`}
            >
              {plan.badge}
            </span>
            <div>
              <h2 className="font-display text-[1.55rem] font-bold leading-[1.02] tracking-[-0.045em] text-[var(--text-strong)] md:text-[1.75rem]">
                {plan.name}
              </h2>
              <p className="mt-2 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">{plan.description}</p>
            </div>
          </div>

          {plan.savingsUah > 0 ? <span className="chip-positive whitespace-nowrap">Економія {formatUah(plan.savingsUah)}</span> : null}
        </div>

        <div className="mt-7 border-t border-[rgba(24,26,32,0.08)] pt-6">
          {plan.oldMonthlyEquivalentUah ? (
            <p className="text-[0.92rem] text-[var(--text-soft)] line-through">{formatUah(plan.oldMonthlyEquivalentUah)} / міс</p>
          ) : null}
          <p className="mt-2 font-display text-[2.75rem] font-bold leading-[0.92] tracking-[-0.06em] text-[var(--text-strong)] md:text-[3.1rem]">
            {monthlyLabel}
          </p>
          <p className="mt-2 text-[0.95rem] leading-[1.68] text-[var(--text-muted)]">{totalLabel}</p>
        </div>

        <div className="mt-6 space-y-3">
          {planBullets[plan.id].map((item) => (
            <p key={item} className="flex items-start gap-2.5 text-[0.94rem] leading-[1.68] text-[var(--text-muted)]">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
              <span>{item}</span>
            </p>
          ))}
        </div>

        <Link href={getCheckoutHref(plan.id)} className={`mt-7 w-full ${isFeatured ? "btn-primary" : "btn-secondary"}`}>
          {ctaLabel}
        </Link>
      </div>
    </article>
  );
}

export default function PricingPage() {
  const monthlyPlan = pricingPlans.find((plan) => plan.id === "monthly");
  const annualPlan = pricingPlans.find((plan) => plan.id === "annual");

  if (!monthlyPlan || !annualPlan) {
    return null;
  }

  return (
    <>
      <JsonLd data={pricingSchemas} />

      <div className="space-y-10 py-4 md:space-y-14 md:py-8">
        <section className="surface-panel relative overflow-hidden rounded-[2.8rem] px-5 py-7 md:px-8 md:py-10">
          <div className="pointer-events-none absolute -left-24 top-10 h-56 w-56 rounded-full bg-[rgba(67,97,255,0.10)] blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-0 h-52 w-52 rounded-full bg-[rgba(152,165,255,0.12)] blur-3xl" />

          <div className="relative">
            <header className="mx-auto max-w-3xl text-center">
              <span className="eyebrow-pill">Ціни Decivio</span>
              <h1 className="page-title mx-auto mt-4 max-w-[12ch]">Оберіть свій формат доступу</h1>
              <p className="lead-copy mx-auto mt-4 max-w-2xl">
                У нас два платні формати: помісячна оплата або доступ на рік. В обох планах відкривається однаковий повний доступ до інструментів для зміни кар&apos;єри.
              </p>
            </header>

            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              {pricingSignals.map((signal) => (
                <span key={signal} className="chip-positive">
                  {signal}
                </span>
              ))}
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <PlanCard plan={monthlyPlan} />
              <PlanCard plan={annualPlan} />
            </div>

            <div className="mx-auto mt-6 max-w-3xl rounded-[1.8rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.76)] px-5 py-4 text-center md:px-6">
              <p className="text-[1rem] font-semibold text-[var(--text-strong)]">Функціонал у двох планах однаковий.</p>
              <p className="mt-2 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
                Обираєте лише спосіб оплати: помісячно для гнучкості або на рік для найвигіднішої ціни.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6 md:space-y-7">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow-pill">Що входить</span>
            <h2 className="section-title mt-4">Увесь доступ без дроблення на окремі модулі</h2>
            <p className="lead-copy mx-auto mt-4 max-w-2xl">
              Ви не купуєте інструменти по одному. Після оформлення доступу відкривається весь набір, який потрібен для сильного переходу.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {paidFeatureSections.map((section, index) => (
              <article key={section.heading} className="surface-panel rounded-[2rem] px-5 py-5 md:px-6 md:py-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[rgba(238,242,255,0.95)] text-[0.95rem] font-semibold text-[var(--accent-strong)]">
                    0{index + 1}
                  </span>
                  <span className="text-[0.76rem] font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">У доступі</span>
                </div>

                <h3 className="panel-title mt-5">{section.heading}</h3>
                <p className="mt-3 text-[0.94rem] leading-[1.72] text-[var(--text-muted)]">{featureSectionIntros[section.heading]}</p>

                <div className="mt-5 space-y-3">
                  {section.items.map((item) => (
                    <p key={item.title} className="flex items-start gap-2.5 text-[0.94rem] leading-[1.68] text-[var(--text-muted)]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                      <span>{item.title}</span>
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6 md:space-y-7">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow-pill">Відгуки</span>
            <h2 className="section-title mt-4">Що цінують після оформлення доступу</h2>
            <p className="lead-copy mx-auto mt-4 max-w-2xl">
              Найчастіше цінують цілісність: доступ відкриває не один інструмент, а весь маршрут переходу в одному місці.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {pricingTestimonials.map((testimonial) => (
              <article key={testimonial.author} className="surface-panel flex h-full flex-col rounded-[2rem] px-5 py-5 md:px-6 md:py-6">
                <div className="flex items-center gap-1 text-[var(--accent)]" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <svg key={index} viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.3l-5.8 3.07 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z" />
                    </svg>
                  ))}
                </div>

                <p className="mt-4 text-[0.97rem] leading-[1.8] text-[var(--text-strong)]">“{testimonial.quote}”</p>

                <div className="mt-auto pt-6">
                  <p className="font-display text-[1.04rem] font-semibold text-[var(--text-strong)]">{testimonial.author}</p>
                  <p className="mt-1 text-[0.9rem] text-[var(--text-muted)]">{testimonial.role}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-5 md:space-y-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow-pill">FAQ</span>
            <h2 className="section-title mt-4">Часті питання про оплату й доступ</h2>
          </div>

          <div className="mx-auto max-w-4xl space-y-4">
            {pricingFaqItems.map((item) => (
              <details key={item.question} className="surface-panel group rounded-[1.8rem] px-5 py-4 md:px-6 md:py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[1.02rem] font-semibold leading-[1.24] tracking-[-0.02em] text-[var(--text-strong)] marker:hidden [&::-webkit-details-marker]:hidden md:text-[1.1rem]">
                  <span>{item.question}</span>
                  <span className="text-[1.4rem] font-medium text-[var(--accent-strong)] transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-8 text-[0.94rem] leading-[1.72] text-[var(--text-muted)] md:text-[0.98rem]">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="surface-dark rounded-[2.5rem] px-5 py-7 text-center text-white md:px-8 md:py-9">
          <span className="inline-flex rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-white/78">
            Готові оформити доступ
          </span>
          <h2 className="mt-4 font-display text-[2rem] font-bold leading-[1.01] tracking-[-0.05em] md:text-[2.45rem]">
            Оберіть план і відкрийте повний доступ до Decivio
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[0.98rem] leading-[1.74] text-white/72">
            Місячний формат дає більше гнучкості. Річний дає найвигіднішу ціну, якщо ви хочете працювати над переходом системно.
          </p>

          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <Link href={getCheckoutHref("annual")} className="btn-primary">
              Обрати річний доступ
            </Link>
            <Link href={getCheckoutHref("monthly")} className="btn-secondary border-white/14 bg-white/10 text-white hover:bg-white/14 hover:text-white">
              Обрати місячний доступ
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
