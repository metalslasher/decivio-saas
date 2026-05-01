import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { formatUah, getCheckoutHref, paidFeatureSections, pricingPlans } from "@/lib/pricing";
import { createBreadcrumbSchema, createFaqSchema, createMetadata, createSoftwareApplicationSchema } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Ціни",
  description:
    "Два формати повного доступу до Decivio: помісячно або на рік. Сценарії переходу, резюме, співбесіди, перевірка вакансій і план зміни карʼєри в одному доступі.",
  path: "/pricing",
  keywords: ["тарифи decivio", "ціни decivio", "вартість доступу decivio", "річний доступ decivio"]
});

const pricingFaqItems = [
  {
    question: "Що входить у платний доступ?",
    answer:
      "Платний доступ відкриває весь набір інструментів Decivio: сценарії переходу, прогноз доходу й ризику, резюме під роль, підготовку до співбесід, план 30/60/90, перевірку вакансій і оцінку пропозиції роботи."
  },
  {
    question: "Чим місячний доступ відрізняється від річного?",
    answer:
      "Функціонал однаковий. Місячний доступ списується щомісяця, а річний оформлюється одним платежем на 12 місяців і дає нижчу ціну в перерахунку на місяць."
  },
  {
    question: "Коли краще обрати місячний доступ?",
    answer:
      "Місячний формат підходить, якщо хочете пройти один активний цикл: перевірити сценарій, посилити резюме, підготуватися до перших відгуків і не брати довший період одразу."
  },
  {
    question: "Коли вигідніше брати річний доступ?",
    answer:
      "Річний доступ доречний, якщо ви плануєте системно працювати над переходом, порівнювати кілька ролей, повертатися до вакансій і поступово посилювати підготовку протягом року."
  },
  {
    question: "Чи потрібно доплачувати за окремі модулі?",
    answer:
      "Ні. Резюме, співбесіди, сценарії, вакансії, план переходу й оцінка оферу входять в один доступ. Окремо купувати модулі не потрібно."
  },
  {
    question: "У якій валюті проходить оплата і як списуються кошти?",
    answer:
      "Оплата проходить у гривні. Місячний доступ працює як щомісячна підписка, а річний доступ оплачується одним платежем за 12 місяців."
  }
] as const;

const pricingReviews = [
  {
    name: "Ірина Коваль",
    avatar: "/reviews/iryna-koval.jpg",
    quote:
      "Я скептично ставилась до таких прогнозів. Але тут хоча б стало видно, що перші 5-6 місяців будуть просадкою, а не казкою про 'нове життя'. Після цього вже спокійніше вирішила йти в дизайн поступово.",
    rating: 5
  },
  {
    name: "Олексій Мельник",
    avatar: "/reviews/oleksiy-melnyk.jpg",
    quote:
      "Не все вийшло ідеально з першого разу: довелося кілька разів міняти рівень ринку, бо я завищив очікування. Але в результаті зрозумів, що мені краще цілитись не в junior, а в аналітичні roles ближче до operations.",
    rating: 4
  },
  {
    name: "Наталія Бондар",
    avatar: "/reviews/nataliya-bondar.jpg",
    quote:
      "До цього я чесно думала, що починаю з нуля. Після аналізу виписала 5 історій з HR, які нормально лягають у UX Research: інтерв'ю, патерни, болі людей. Це дуже зняло паніку.",
    rating: 5
  },
  {
    name: "Дмитро Литвин",
    avatar: "/reviews/dmytro-lytvyn.jpg",
    quote:
      "Я раніше відгукувався майже на все підряд. Тут відсіяв 7 вакансій, залишив 4 нормальні під мій досвід у sales і з двох отримав перший дзвінок. Не магія, просто менше хаосу.",
    rating: 5
  },
  {
    name: "Анна Романюк",
    avatar: "/reviews/anna-romanyuk.jpg",
    quote:
      "Мені треба було не 'повір у себе', а список що робити в понеділок. План на 30-60-90 днів допоміг. Спочатку пунктів було забагато, я половину відклала, але маршрут нарешті став реальним.",
    rating: 4
  },
  {
    name: "Владислав Гнатюк",
    avatar: "/reviews/vladyslav-hnatyuk.jpg",
    quote:
      "Я був майже впевнений, що без комерційного досвіду в QA мене ніхто не гляне. Аналіз витягнув задачі з support, які можна показати як релевантні, і дав список, що доробити в портфоліо.",
    rating: 5
  },
  {
    name: "Катерина Шевчук",
    avatar: "/reviews/kateryna-shevchuk.jpg",
    quote:
      "Я хотіла просити більше, ніж реально тягнула на старті. Прогноз трохи приземлив, але чесно: краще знати це до співбесіди. Зараз цілюсь у нижчий діапазон і паралельно закриваю payroll.",
    rating: 5
  },
  {
    name: "Ліза Марченко",
    avatar: "/reviews/liza-marchenko.jpg",
    quote:
      "Перед цим я відправила 18 відгуків і отримала тишу. Після перевірки змінила резюме під конкретні вакансії і прибрала зайві junior-формулювання. Перші відповіді з'явились через кілька днів.",
    rating: 5
  }
] as const;

const pricingSchemas = [
  createBreadcrumbSchema([
    { name: "Головна", path: "/" },
    { name: "Ціни", path: "/pricing" }
  ]),
  createSoftwareApplicationSchema({
    path: "/pricing",
    description: "Сторінка цін Decivio з двома платними форматами повного доступу для зміни карʼєри.",
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

function getMonthlyDiscount(plan: PricingPlan) {
  if (!plan.oldMonthlyEquivalentUah) {
    return null;
  }

  return Math.round((1 - plan.monthlyEquivalentUah / plan.oldMonthlyEquivalentUah) * 100);
}

function PlanCard({ plan }: { plan: PricingPlan }) {
  const isFeatured = plan.featured;
  const discount = getMonthlyDiscount(plan);
  const totalLabel =
    plan.id === "annual" ? `${formatUah(plan.billedNowUah)} одним платежем на 12 місяців` : `${formatUah(plan.billedNowUah)} щомісяця`;
  const ctaLabel = plan.id === "annual" ? "Обрати річний доступ" : "Обрати місячний доступ";

  return (
    <article
      className={`surface-panel relative flex min-h-[15.5rem] flex-col overflow-visible rounded-[2rem] px-5 pb-5 pt-7 md:px-6 md:pb-6 md:pt-8 ${
        isFeatured ? "ring-2 ring-[rgba(14,181,166,0.48)]" : ""
      }`}
    >
      <div className="absolute left-5 top-0 -translate-y-1/2">
        <span className="inline-flex rounded-full bg-[#0bb5a5] px-4 py-2 text-[0.78rem] font-extrabold leading-none text-white shadow-[0_14px_28px_-20px_rgba(11,181,165,0.62)]">
          {isFeatured && discount ? `Економія ${discount}%` : plan.badge}
        </span>
      </div>

      {isFeatured ? (
        <div className="absolute right-5 top-0 hidden -translate-y-1/2 sm:block">
          <span className="inline-flex rounded-full bg-[#ffd34d] px-5 py-3 text-[0.95rem] font-extrabold leading-none text-[#131722] shadow-[0_18px_34px_-22px_rgba(190,146,0,0.5)]">
            Найкраща ціна
          </span>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3.5">
          <span
            className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
              isFeatured ? "border-[#0bb5a5] bg-[#0bb5a5] text-white" : "border-[var(--text-strong)] text-transparent"
            }`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none">
              <path d="M5 12.5l4.2 4.1L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>

          <div className="min-w-0">
            <h2 className="font-display text-[1.28rem] font-extrabold leading-[1.12] tracking-normal text-[var(--text-strong)] md:text-[1.42rem]">
              {plan.name}
            </h2>
            <p className="mt-3 max-w-[29rem] text-[0.94rem] leading-[1.66] text-[var(--text-muted)]">{plan.description}</p>
          </div>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          {plan.oldMonthlyEquivalentUah ? (
            <p className="text-[0.92rem] font-semibold text-[var(--text-soft)] line-through">{formatUah(plan.oldMonthlyEquivalentUah)} / міс</p>
          ) : null}
          <p className="mt-1 font-display text-[2rem] font-extrabold leading-none tracking-normal text-[var(--accent-strong)] md:text-[2.25rem]">
            {formatUah(plan.monthlyEquivalentUah)}
          </p>
          <p className="mt-1 text-[0.94rem] font-semibold text-[var(--text-strong)]">за місяць</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-[rgba(22,29,43,0.08)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.9rem] leading-[1.5] text-[var(--text-muted)]">{totalLabel}</p>
        <Link href={getCheckoutHref(plan.id)} className={isFeatured ? "btn-primary justify-center" : "btn-secondary justify-center"}>
          {ctaLabel}
        </Link>
      </div>
    </article>
  );
}

function PricingReviewCard({ review, index }: { review: (typeof pricingReviews)[number]; index: number }) {
  return (
    <article
      aria-hidden={index >= pricingReviews.length}
      className="surface-panel relative flex min-h-[345px] w-[22.5rem] flex-none flex-col overflow-hidden rounded-[2rem] px-6 py-6 md:w-[23.5rem]"
    >
      <span className="pointer-events-none absolute left-4 top-2 font-display text-[4.6rem] leading-none text-[rgba(74,108,255,0.08)]">
        “
      </span>

      <p className="relative text-[0.97rem] leading-[1.72] text-[var(--text-strong)]">{review.quote}</p>

      <div className="relative mt-auto flex items-center gap-4 pt-5">
        <Image
          src={review.avatar}
          alt=""
          aria-hidden="true"
          width={112}
          height={112}
          sizes="56px"
          className="h-14 w-14 shrink-0 rounded-full object-cover ring-4 ring-white shadow-[0_12px_28px_rgba(35,48,78,0.16)]"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[1.06rem] font-semibold text-[var(--text-strong)] md:text-[1.12rem]">{review.name}</p>
          <div className="mt-1.5 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, starIndex) => {
              const filled = starIndex < review.rating;

              return (
                <svg
                  key={`${review.name}-${index}-${starIndex}`}
                  viewBox="0 0 24 24"
                  className={`h-5 w-5 ${filled ? "fill-[var(--accent)] text-[var(--accent)]" : "fill-[#eceef3] text-[#eceef3]"}`}
                  aria-hidden="true"
                >
                  <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.3l-5.8 3.07 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z" />
                </svg>
              );
            })}
          </div>
        </div>
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
        <section className="relative py-3 md:py-5">
          <div className="pointer-events-none absolute -left-24 top-10 h-56 w-56 rounded-full bg-[rgba(67,97,255,0.10)] blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-0 h-52 w-52 rounded-full bg-[rgba(152,165,255,0.12)] blur-3xl" />

          <div className="relative">
            <header className="mx-auto max-w-3xl text-center">
              <span className="eyebrow-pill">Повний доступ</span>
              <h1 className="page-title mx-auto mt-4 max-w-[14ch]">
                Оберіть формат <span className="text-accent">доступу</span>
              </h1>
              <p className="lead-copy mx-auto mt-5 max-w-2xl">
                В обох тарифах відкритий весь набір Decivio. Відрізняється тільки формат списання і ціна в перерахунку на місяць.
              </p>
            </header>

            <div className="mt-12 grid gap-5 md:mt-14 lg:grid-cols-2">
              <PlanCard plan={monthlyPlan} />
              <PlanCard plan={annualPlan} />
            </div>
          </div>
        </section>

        <section className="space-y-6 md:space-y-7">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="section-title">Усі інструменти Decivio в одному доступі</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {paidFeatureSections.map((section, index) => (
              <article key={section.heading} className="surface-panel rounded-[2rem] px-5 py-5 md:px-6 md:py-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[rgba(238,242,255,0.95)] text-[0.95rem] font-semibold text-[var(--accent-strong)]">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="panel-title mt-5">{section.heading}</h3>

                <div className="mt-5 space-y-4">
                  {section.items.map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                      <div className="min-w-0">
                        <p className="font-semibold leading-[1.35] text-[var(--text-strong)]">{item.title}</p>
                        <p className="mt-1.5 text-[0.9rem] leading-[1.65] text-[var(--text-muted)]">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="relative mx-auto max-w-[80rem]" aria-label="Відгуки користувачів">
          <div className="overflow-hidden px-1 py-2 md:px-2">
            <div className="reviews-marquee-track flex w-max gap-5">
              {[...pricingReviews, ...pricingReviews].map((review, index) => (
                <PricingReviewCard key={`${review.name}-${index}`} review={review} index={index} />
              ))}
            </div>
          </div>
        </section>

        <section id="faq">
          <div className="grid gap-4 md:grid-cols-2">
            {pricingFaqItems.map((item) => (
              <details key={item.question} className="surface-panel group rounded-[1.8rem] px-5 py-4 md:px-6 md:py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[1.02rem] font-semibold leading-[1.24] tracking-normal text-[var(--text-strong)] marker:hidden [&::-webkit-details-marker]:hidden md:text-[1.1rem]">
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
      </div>
    </>
  );
}
