import Image from "next/image";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { PricingPurchaseButton } from "@/components/pricing-purchase-button";
import { formatUah, paidFeatureSections, pricingFlowSteps, pricingPlans } from "@/lib/pricing";
import { createBreadcrumbSchema, createMetadata, createSoftwareApplicationSchema } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Тарифи на доступ",
  description:
    "Оберіть місячний або 90-денний доступ після безкоштовної оцінки кар'єрної позиції: вакансії, резюме, співбесіди та зарплатні аргументи.",
  path: "/pricing",
  keywords: ["тарифи decivio", "ціни decivio", "вартість доступу decivio", "оцінка зарплати decivio", "підготовка до співбесіди decivio"]
});

const pricingReviews = [
  {
    name: "Ірина Коваль",
    avatar: "/reviews/iryna-koval.jpg",
    quote:
      "Я хотіла зрозуміти, чи недооцінюю себе. Виявилось, що для мого досвіду в маркетингу можна просити більше, але резюме треба було переписати з акцентом на результати. Після правок стало легше пояснювати свою цінність.",
    rating: 5
  },
  {
    name: "Олексій Мельник",
    avatar: "/reviews/oleksiy-melnyk.jpg",
    quote:
      "Очікував, що мені одразу покажуть найвищу зарплату. Насправді висновок був тверезіший: частина вакансій була зависока для мого профілю. Це трохи приземлило, зате я перестав витрачати час на слабкі збіги.",
    rating: 4
  },
  {
    name: "Наталія Бондар",
    avatar: "/reviews/nataliya-bondar.jpg",
    quote:
      "Найкорисніше було побачити, які історії з попередньої роботи можна нормально показати в резюме. До цього я писала загально, без цифр і результату.",
    rating: 5
  },
  {
    name: "Дмитро Литвин",
    avatar: "/reviews/dmytro-lytvyn.jpg",
    quote:
      "Я раніше відгукувався майже на все підряд. Тут відсіяв зайве, залишив кілька нормальних вакансій під мій досвід у продажах і з двох отримав перший дзвінок. Не магія, просто менше хаосу.",
    rating: 5
  },
  {
    name: "Анна Романюк",
    avatar: "/reviews/anna-romanyuk.jpg",
    quote:
      "Мені треба було не 'повір у себе', а список що робити в понеділок. План допоміг. Спочатку пунктів було забагато, я половину відклала, але маршрут нарешті став реальним.",
    rating: 4
  },
  {
    name: "Владислав Гнатюк",
    avatar: "/reviews/vladyslav-hnatyuk.jpg",
    quote:
      "Я працював у підтримці клієнтів і хотів перейти в сильнішу команду. Аналіз показав, які метрики винести першими, щоб досвід не виглядав просто операційною роботою.",
    rating: 5
  },
  {
    name: "Катерина Шевчук",
    avatar: "/reviews/kateryna-shevchuk.jpg",
    quote:
      "Прогноз трохи приземлив мої очікування, але чесно: краще знати це до співбесіди. Тепер називаю зарплату спокійніше і розумію, що треба підтягнути.",
    rating: 5
  },
  {
    name: "Ліза Марченко",
    avatar: "/reviews/liza-marchenko.jpg",
    quote:
      "Перед цим я відправила 18 відгуків і отримала тишу. Після перевірки змінила резюме під конкретні вакансії, додала результати по проєктах і прибрала слабкі формулювання. Перші відповіді з'явились через кілька днів.",
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
    description: "Тарифи для доступу до практичної підготовки після безкоштовної оцінки кар'єрної позиції.",
    featureList: paidFeatureSections.flatMap((section) => section.items.map((item) => item.title)),
    offers: pricingPlans.map((plan) => ({
      name: plan.name,
      price: plan.billedNowUah,
      description: `${plan.billingLabel}. ${plan.description}`,
      urlPath: "/pricing"
    })),
    isAccessibleForFree: false
  })
];

type PricingPlan = (typeof pricingPlans)[number];

function PlanCard({ plan }: { plan: PricingPlan }) {
  const isFeatured = plan.featured;
  const monthlyDiscount = plan.oldMonthlyEquivalentUah ? Math.round((1 - plan.monthlyEquivalentUah / plan.oldMonthlyEquivalentUah) * 100) : null;
  const ctaLabel = plan.id === "annual" ? "Обрати 90-денний план" : "Обрати місячний доступ";

  return (
    <article
      className={`surface-panel relative flex min-h-[14.5rem] flex-col overflow-visible rounded-[2rem] px-5 pb-5 pt-7 md:px-6 md:pb-6 md:pt-8 ${
        isFeatured ? "ring-2 ring-[rgba(67,97,255,0.26)]" : ""
      }`}
    >
      <div className="absolute left-5 top-0 -translate-y-1/2">
        <span className="inline-flex rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-4 py-2 text-[0.78rem] font-extrabold leading-none text-white shadow-[0_14px_28px_-20px_rgba(41,73,244,0.52)]">
          {isFeatured && monthlyDiscount ? `Економія ${monthlyDiscount}%` : plan.badge}
        </span>
      </div>

      {isFeatured ? (
        <div className="absolute right-5 top-0 hidden -translate-y-1/2 sm:block">
          <span className="inline-flex rounded-full border border-[rgba(67,97,255,0.16)] bg-[rgba(238,242,255,0.96)] px-5 py-3 text-[0.95rem] font-extrabold leading-none text-[var(--accent-strong)] shadow-[0_18px_34px_-24px_rgba(41,73,244,0.36)]">
            Основний план
          </span>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 sm:max-w-[32rem]">
          <h2 className="font-display text-[1.28rem] font-extrabold leading-[1.12] tracking-normal text-[var(--text-strong)] md:text-[1.42rem]">
            {plan.name}
          </h2>
          <p className="mt-3 text-[0.94rem] leading-[1.62] text-[var(--text-muted)] md:text-[0.98rem]">{plan.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.68)] px-3 py-1.5 text-[0.78rem] font-bold text-[var(--text-muted)]">
              {plan.billingLabel}
            </span>
            {plan.savingsUah > 0 ? (
              <span className="rounded-full border border-[rgba(67,97,255,0.18)] bg-[rgba(238,242,255,0.92)] px-3 py-1.5 text-[0.78rem] font-bold text-[var(--accent-strong)]">
                Економія {formatUah(plan.savingsUah)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          {plan.oldMonthlyEquivalentUah ? (
            <p className="text-[0.92rem] font-semibold text-[var(--text-soft)] line-through">{formatUah(plan.oldMonthlyEquivalentUah)}</p>
          ) : null}
          <p className="mt-1 font-display text-[2rem] font-extrabold leading-none tracking-normal text-[var(--accent-strong)] md:text-[2.25rem]">
            {formatUah(plan.monthlyEquivalentUah)}
          </p>
          <p className="mt-1 text-[0.94rem] font-semibold text-[var(--text-strong)]">за місяць</p>
          <p className="mt-2 text-[0.86rem] font-semibold leading-[1.45] text-[var(--text-muted)]">
            Списання зараз: {formatUah(plan.billedNowUah)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Suspense
          fallback={
            <button type="button" disabled className={`w-full ${isFeatured ? "btn-primary justify-center" : "btn-secondary justify-center"} opacity-70`}>
              {ctaLabel}
            </button>
          }
        >
          <PricingPurchaseButton
            planId={plan.id}
            label={ctaLabel}
            className={`w-full ${isFeatured ? "btn-primary justify-center" : "btn-secondary justify-center"}`}
          />
        </Suspense>
      </div>
    </article>
  );
}

function PricingReviewCard({ review, index }: { review: (typeof pricingReviews)[number]; index: number }) {
  return (
    <article
      aria-hidden={index >= pricingReviews.length}
      className="surface-panel relative flex min-h-[285px] w-[22.5rem] flex-none flex-col overflow-hidden rounded-[2rem] px-6 py-6 md:w-[23.5rem]"
    >
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
  const mainPlan = pricingPlans.find((plan) => plan.id === "annual");

  if (!monthlyPlan || !mainPlan) {
    return null;
  }

  return (
    <>
      <JsonLd data={pricingSchemas} />

      <div className="space-y-10 py-4 md:space-y-14 md:py-8">
        <section className="relative py-3 md:py-5">
          <div className="relative">
            <header className="mx-auto max-w-3xl text-center">
              <h1 className="page-title mx-auto max-w-[16ch]">
                Перевіряйте вакансії перед <span className="text-accent">подачею</span>
              </h1>
              <p className="lead-copy mx-auto mt-4 max-w-2xl">
                Безкоштовна оцінка показує вашу ринкову позицію. Платний доступ відкриває Vacancy Fit: аналіз конкретних вакансій, resume-правки і зарплатні аргументи для подачі.
              </p>
            </header>

            <div className="mt-12 grid gap-5 md:mt-14 lg:grid-cols-2">
              <PlanCard plan={monthlyPlan} />
              <PlanCard plan={mainPlan} />
            </div>
          </div>
        </section>

        <section className="py-3 md:py-5" aria-label="Як відкривається доступ">
          <div className="grid gap-4 md:grid-cols-3">
            {pricingFlowSteps.map((step, index) => (
              <article key={step.title} className="surface-panel rounded-[1.8rem] px-5 py-5 md:px-6 md:py-6">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[0.78rem] font-extrabold text-[var(--accent-strong)]">
                  {index + 1}
                </span>
                <h2 className="panel-title mt-4">{step.title}</h2>
                <p className="body-copy mt-3">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-8 py-6 md:space-y-10 md:py-9">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="section-title mx-auto max-w-[15ch]">
              Що входить у <span className="text-accent">платний доступ</span>
            </h2>
            <p className="body-copy mx-auto mt-4 max-w-2xl">
              Фокус не на кількості модулів, а на робочому циклі: оцінити позицію, перевірити вакансію, посилити подачу й підготувати розмову про зарплату.
            </p>
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
          <div className="overflow-hidden px-1 pb-12 pt-2 md:px-2 md:pb-14">
            <div className="reviews-marquee-track flex w-max items-start gap-5">
              {[...pricingReviews, ...pricingReviews].map((review, index) => (
                <PricingReviewCard key={`${review.name}-${index}`} review={review} index={index} />
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
