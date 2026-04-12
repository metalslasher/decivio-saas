import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { formatUah, getCheckoutHref, paidFeatureSections, pricingFlowSteps, pricingPlans } from "@/lib/pricing";
import { createBreadcrumbSchema, createFaqSchema, createMetadata, createSoftwareApplicationSchema } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Ціни",
  description:
    "Ціни на доступ до Decivio: сценарії переходу, резюме, співбесіди, перевірка вакансій, оцінка оферу і план переходу.",
  path: "/pricing",
  keywords: ["тарифи decivio", "вартість аналізу зміни кар'єри", "ціна кар'єрного симулятора"]
});

const pricingFaqItems = [
  {
    question: "Чим відрізняється місячний доступ від річного?",
    answer:
      "Функціонал однаковий: обидва плани відкривають увесь платний набір інструментів. Різниця лише в логіці оплати: щомісяця або одним платежем на 12 місяців."
  },
  {
    question: "Чи можна спочатку пройти безкоштовний висновок?",
    answer:
      "Так. Це рекомендований сценарій: ви проходите симуляцію, дивитесь персональний висновок і лише потім вирішуєте, чи потрібен повний доступ."
  },
  {
    question: "Коли відбувається списання коштів?",
    answer:
      "Оплата відбувається після входу або реєстрації на етапі checkout. До цього моменту ви можете спокійно пройти безкоштовний висновок без списання."
  },
  {
    question: "У якій валюті проходить оплата?",
    answer: "Оплата оформлюється в гривні. На сторінці одразу показуємо фінальну суму, яку ви сплачуєте зараз."
  },
  {
    question: "Що відкривається одразу після оплати?",
    answer:
      "Після успішної оплати відкривається повний доступ до сценаріїв переходу, резюме, підготовки до співбесід, перевірки вакансій, оцінки оферу та плану переходу."
  },
  {
    question: "Чи потрібно доплачувати за окремі інструменти всередині?",
    answer:
      "Ні. Після оплати всі платні інструменти входять у доступ. Вам не потрібно окремо купувати кожен модуль."
  }
] as const;

const featureSectionIntros: Record<string, string> = {
  "Аналітика переходу": "Щоб бачити не лише стартову зарплату, а й повну траєкторію переходу.",
  "Підготовка до переходу": "Щоб швидше дійти до перших відгуків, співбесід і реального оферу.",
  "Робота з вакансіями": "Щоб приймати рішення по конкретних вакансіях і пропозиціях без гадання."
};

const pricingTestimonials = [
  {
    quote:
      "Після симуляції стало зрозуміло, де саме новий напрям починає обганяти мій поточний шлях. Це дало спокій і рамку для рішення.",
    author: "Ірина Коваль",
    role: "Marketing → Product Design"
  },
  {
    quote:
      "Найцінніше тут не стартова цифра, а вся траєкторія на кілька років уперед. Саме цього мені бракувало для реального вибору.",
    author: "Олексій Мельник",
    role: "Operations → Data Analytics"
  },
  {
    quote:
      "Результат читається швидко. Не треба вивчати таблиці, щоб зрозуміти, чи виглядає перехід здоровим фінансово.",
    author: "Наталія Бондар",
    role: "HR → UX Research"
  }
] as const;

const pricingChips = ["Сценарії переходу", "Резюме", "Співбесіди", "Вакансії", "Офер", "План 30/60/90"] as const;

const pricingSchemas = [
  createBreadcrumbSchema([
    { name: "Головна", path: "/" },
    { name: "Ціни", path: "/pricing" }
  ]),
  createSoftwareApplicationSchema({
    path: "/pricing",
    description: "Сторінка цін Decivio з доступом до повного набору інструментів для зміни кар'єри.",
    featureList: paidFeatureSections.flatMap((section) => section.items.map((item) => item.title)),
    offers: [
      {
        name: "Безкоштовний висновок",
        price: 0,
        description: "Перший персоналізований висновок про кар'єрний перехід без оплати.",
        urlPath: "/simulate"
      },
      ...pricingPlans.map((plan) => ({
        name: plan.name,
        price: plan.billedNowUah,
        description: `${plan.billingLabel}. ${plan.description}`,
        urlPath: "/pricing"
      }))
    ]
  }),
  createFaqSchema([...pricingFaqItems])
];

export default function PricingPage() {
  const monthlyPlan = pricingPlans.find((plan) => plan.id === "monthly");
  const annualPlan = pricingPlans.find((plan) => plan.id === "annual");

  if (!monthlyPlan || !annualPlan) {
    return null;
  }

  const renderPlanCard = (plan: (typeof pricingPlans)[number]) => {
    const monthlyLabel = `${formatUah(plan.monthlyEquivalentUah)} / міс`;
    const billedLabel =
      plan.id === "annual" ? `Один платіж ${formatUah(plan.billedNowUah)}` : `Списання зараз ${formatUah(plan.billedNowUah)}`;

    return (
      <article
        key={plan.id}
        className={`relative flex h-full flex-col rounded-[2.1rem] px-5 py-5 md:px-6 md:py-6 ${
          plan.featured ? "surface-dark text-white" : "surface-soft"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className={`text-[0.76rem] font-semibold uppercase tracking-[0.14em] ${
                plan.featured ? "text-white/62" : "text-[var(--accent-strong)]"
              }`}
            >
              {plan.badge}
            </p>
            <h2
              className={`mt-3 font-display text-[1.5rem] font-bold leading-[1.02] tracking-[-0.045em] ${
                plan.featured ? "text-white" : "text-[var(--text-strong)]"
              }`}
            >
              {plan.name}
            </h2>
          </div>

          {plan.savingsUah > 0 ? (
            <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white">
              Економія {formatUah(plan.savingsUah)}
            </span>
          ) : null}
        </div>

        <div className="mt-6">
          {plan.oldMonthlyEquivalentUah ? (
            <p className={`text-sm ${plan.featured ? "text-white/48" : "text-[var(--text-soft)]"}`}>
              <span className="line-through">{formatUah(plan.oldMonthlyEquivalentUah)} / міс</span>
            </p>
          ) : null}

          <p
            className={`mt-2 font-display text-[2.7rem] font-bold leading-[0.92] tracking-[-0.06em] md:text-[3.15rem] ${
              plan.featured ? "text-white" : "text-[var(--text-strong)]"
            }`}
          >
            {monthlyLabel}
          </p>
          <p className={`mt-2 text-[0.95rem] leading-[1.7] ${plan.featured ? "text-white/72" : "text-[var(--text-muted)]"}`}>
            {billedLabel}
          </p>
        </div>

        <p className={`mt-5 text-[0.95rem] leading-[1.72] ${plan.featured ? "text-white/72" : "text-[var(--text-muted)]"}`}>
          {plan.description}
        </p>

        <div className={`mt-5 space-y-3 rounded-[1.5rem] px-4 py-4 ${plan.featured ? "border border-white/10 bg-white/8" : "bg-white/60"}`}>
          <p className={`text-sm font-semibold ${plan.featured ? "text-white/84" : "text-[var(--text-strong)]"}`}>У доступі</p>
          <div className="space-y-2.5">
            {[
              "Увесь платний набір інструментів",
              plan.id === "annual" ? "Найвигідніша ціна в перерахунку на місяць" : "Зручний варіант для швидкого старту",
              "Доступ до сценаріїв, резюме, співбесід і вакансій"
            ].map((item) => (
              <p key={item} className={`flex items-start gap-2.5 text-[0.9rem] leading-[1.6] ${plan.featured ? "text-white/76" : "text-[var(--text-muted)]"}`}>
                <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${plan.featured ? "bg-white" : "bg-[var(--accent)]"}`} />
                <span>{item}</span>
              </p>
            ))}
          </div>
        </div>

        <Link href={getCheckoutHref(plan.id)} className={`mt-6 ${plan.featured ? "btn-secondary border-white/14 bg-white/10 text-white" : "btn-primary"}`}>
          {plan.id === "annual" ? "Взяти річний доступ" : "Взяти місячний доступ"}
        </Link>
      </article>
    );
  };

  return (
    <>
      <JsonLd data={pricingSchemas} />

      <div className="space-y-10 py-4 md:space-y-14 md:py-8">
        <section className="surface-panel relative overflow-hidden rounded-[2.6rem] px-5 py-6 md:px-8 md:py-8">
          <div className="pointer-events-none absolute -left-20 top-8 h-48 w-48 rounded-full bg-[rgba(67,97,255,0.12)] blur-3xl" />
          <div className="pointer-events-none absolute -right-12 top-0 h-52 w-52 rounded-full bg-[rgba(152,165,255,0.12)] blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.28))]" />

          <div className="relative space-y-7 md:space-y-8">
            <header className="mx-auto max-w-3xl text-center">
              <span className="eyebrow-pill">Тарифи Decivio</span>
              <h1 className="page-title mx-auto mt-4 max-w-[12ch]">Оберіть свій формат доступу</h1>
              <p className="lead-copy mx-auto mt-4 max-w-2xl">
                Почніть із безкоштовного висновку, а коли захочете рухатись глибше, оберіть місячний або річний доступ до
                повного набору інструментів переходу.
              </p>
            </header>

            <div className="grid gap-4 xl:grid-cols-[1fr,0.92fr,1fr]">
              {renderPlanCard(monthlyPlan)}

              <article className="surface-panel relative flex h-full flex-col overflow-hidden rounded-[2.1rem] px-5 py-5 md:px-6 md:py-6">
                <div className="pointer-events-none absolute inset-x-6 top-0 h-20 rounded-b-full bg-[rgba(67,97,255,0.08)] blur-2xl" />

                <div className="relative">
                  <span className="chip-positive">0 грн на старті</span>
                  <h2 className="mt-4 font-display text-[1.5rem] font-bold leading-[1.02] tracking-[-0.045em] text-[var(--text-strong)]">
                    Безкоштовний висновок
                  </h2>
                </div>

                <div className="mt-6">
                  <p className="font-display text-[2.7rem] font-bold leading-[0.92] tracking-[-0.06em] text-[var(--text-strong)] md:text-[3.15rem]">
                    0 грн
                  </p>
                  <p className="mt-2 text-[0.95rem] leading-[1.7] text-[var(--text-muted)]">Починаєте без ризику й вирішуєте про оплату вже після результату.</p>
                </div>

                <div className="mt-5 space-y-2.5">
                  {[
                    "Персональний висновок про ваш сценарій переходу",
                    "Розуміння, чи варто йти глибше саме зараз",
                    "Рішення про оплату тільки після першого результату"
                  ].map((item) => (
                    <p key={item} className="flex items-start gap-2.5 text-[0.92rem] leading-[1.68] text-[var(--text-muted)]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                      <span>{item}</span>
                    </p>
                  ))}
                </div>

                <div className="mt-auto pt-6">
                  <Link href="/simulate" className="btn-primary w-full">
                    Почати безкоштовно
                  </Link>
                </div>
              </article>

              {renderPlanCard(annualPlan)}
            </div>

            <div className="surface-soft rounded-[2rem] px-5 py-5 md:px-6">
              <div className="grid gap-4 lg:grid-cols-[0.92fr,1.08fr] lg:items-center">
                <div>
                  <p className="text-[1rem] font-semibold text-[var(--text-strong)]">У місячному й річному доступі однаковий функціонал.</p>
                  <p className="mt-2 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
                    Ви купуєте не окремий AI-чекер, а повний маршрут переходу. Відрізняється лише спосіб оплати: щомісяця або
                    одним платежем на рік.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {pricingChips.map((chip) => (
                    <span key={chip} className="chip-positive">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6 md:space-y-7">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow-pill">Що входить</span>
            <h2 className="section-title mt-4">Увесь платний набір в одному доступі</h2>
            <p className="lead-copy mx-auto mt-4 max-w-2xl">
              Ми не дробимо інструменти на дрібні upsell-блоки. Після оплати ви відкриваєте весь набір, який потрібен для переходу.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {paidFeatureSections.map((section, index) => (
              <article key={section.heading} className="surface-panel flex h-full flex-col rounded-[2rem] px-5 py-5 md:px-6 md:py-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[rgba(238,242,255,0.95)] text-[0.95rem] font-semibold text-[var(--accent-strong)]">
                    0{index + 1}
                  </span>
                  <span className="text-[0.76rem] font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                    Повний доступ
                  </span>
                </div>

                <div className="mt-5">
                  <h3 className="panel-title">{section.heading}</h3>
                  <p className="mt-3 text-[0.94rem] leading-[1.72] text-[var(--text-muted)]">{featureSectionIntros[section.heading]}</p>
                </div>

                <div className="mt-5 space-y-3">
                  {section.items.map((item) => (
                    <div key={item.title} className="rounded-[1.35rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.62)] px-4 py-4">
                      <p className="text-[0.98rem] font-semibold text-[var(--text-strong)]">{item.title}</p>
                      <p className="mt-2 text-[0.9rem] leading-[1.68] text-[var(--text-muted)]">{item.description}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.82fr,1.18fr]">
          <article className="surface-dark overflow-hidden rounded-[2.3rem] px-5 py-6 text-white md:px-6 md:py-7">
            <span className="inline-flex rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-white/78">
              Чому це працює
            </span>
            <h2 className="mt-4 font-display text-[1.9rem] font-bold leading-[1.01] tracking-[-0.05em] text-white md:text-[2.3rem]">
              Купуєте не окремий інструмент, а систему для переходу.
            </h2>
            <p className="mt-4 text-[0.96rem] leading-[1.74] text-white/72">
              Спочатку отримуєте безкоштовний сигнал, а після оплати відкриваєте набір, який підтягує весь маршрут: від рішення
              про перехід до відгуків, співбесід і оцінки оферу.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {[
                { value: "0 грн", label: "старт без ризику" },
                { value: "2 плани", label: "той самий функціонал" },
                { value: "1 доступ", label: "усі платні модулі" }
              ].map((item) => (
                <div key={item.label} className="rounded-[1.35rem] border border-white/10 bg-white/8 px-4 py-4">
                  <p className="font-display text-[1.5rem] font-bold tracking-[-0.04em] text-white">{item.value}</p>
                  <p className="mt-1 text-[0.9rem] text-white/64">{item.label}</p>
                </div>
              ))}
            </div>
          </article>

          <div className="grid gap-4 md:grid-cols-3">
            {pricingFlowSteps.map((step, index) => (
              <article key={step.title} className="surface-panel rounded-[2rem] px-5 py-6 md:px-6 md:py-7">
                <p className="text-[0.76rem] font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">Крок 0{index + 1}</p>
                <h3 className="mt-4 font-display text-[1.32rem] font-bold leading-[1.04] tracking-[-0.04em] text-[var(--text-strong)]">
                  {step.title}
                </h3>
                <p className="mt-3 text-[0.93rem] leading-[1.72] text-[var(--text-muted)]">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6 md:space-y-7">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow-pill">Відгуки</span>
            <h2 className="section-title mt-4">Що люди кажуть після симуляції</h2>
            <p className="lead-copy mx-auto mt-4 max-w-2xl">
              Найчастіше цінують не окрему фічу, а ясність: де ризик, де потенціал і який сценарій реально сильніший.
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

          <div className="grid gap-4 md:grid-cols-2">
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

        <section className="surface-panel rounded-[2.4rem] px-5 py-6 text-center md:px-8 md:py-8">
          <span className="eyebrow-pill">Готові почати</span>
          <h2 className="section-title mt-4">Спершу отримайте безкоштовний висновок</h2>
          <p className="lead-copy mx-auto mt-4 max-w-2xl">
            Це найпростіший спосіб зрозуміти, чи потрібен вам повний доступ прямо зараз. Нульовий бар&apos;єр на старті, рішення вже після результату.
          </p>

          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <Link href="/simulate" className="btn-primary">
              Почати безкоштовно
            </Link>
            <Link href={getCheckoutHref("annual")} className="btn-secondary">
              Одразу взяти річний доступ
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
