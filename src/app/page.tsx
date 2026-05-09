import Link from "next/link";
import Image from "next/image";
import { HeroBeforeAfter } from "@/components/hero-before-after";
import { JsonLd } from "@/components/json-ld";
import { Reveal } from "@/components/reveal";
import { CareerHelpSection } from "@/components/home/career-help-section";
import { FeatureStackCard } from "@/components/home/feature-stack-card";
import {
  careerBrandNames,
  faqItems,
  featureShowcases,
  painPoints,
  reviews,
  socialProof,
} from "@/components/home/home-data";
import { pricingPlans } from "@/lib/pricing";
import { createFaqSchema, createMetadata, createSoftwareApplicationSchema } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Змінюйте карʼєру з планом, а не навмання",
  description:
    "Decivio допомагає спланувати зміну карʼєри: оцінити сценарії переходу, дохід і ризики, підготувати резюме, перевірити вакансії та краще пройти співбесіди.",
  path: "/",
  keywords: [
    "аналіз зміни кар'єри",
    "прогноз доходу після зміни кар'єри",
    "кар'єрний симулятор",
    "порівняння кар'єрних сценаріїв"
  ]
});

const homeSoftwareSchema = createSoftwareApplicationSchema({
  path: "/",
  description:
    "Decivio допомагає спланувати зміну карʼєри: оцінити сценарії переходу, дохід і ризики, підготувати резюме, перевірити вакансії та краще пройти співбесіди.",
  featureList: featureShowcases.map((item) => item.title),
  offers: [
    {
      name: "Безкоштовний висновок",
      price: 0,
      description: "Перший персоналізований аналіз кар'єрного переходу без оплати.",
      urlPath: "/simulate"
    },
    ...pricingPlans.map((plan) => ({
      name: plan.name,
      price: plan.billedNowUah,
      description: plan.description,
      urlPath: "/pricing"
    }))
  ]
});

const homeFaqSchema = createFaqSchema([...faqItems]);

export default function HomePage() {
  return (
    <>
      <JsonLd data={homeSoftwareSchema} />
      <JsonLd data={homeFaqSchema} />
      <div className="pb-12 md:pb-16">
        <div className="space-y-10 md:space-y-16">
          <HeroBeforeAfter />

        <section className="py-6 md:py-8">
          <Reveal>
            <div className="surface-panel mx-auto grid max-w-[80rem] overflow-hidden rounded-[1.9rem] sm:grid-cols-3">
              <Link
                href="#reviews"
                className="group flex min-h-[8.2rem] flex-col items-center justify-center gap-3 px-5 py-5 text-center transition-opacity hover:opacity-85 sm:items-start sm:text-left md:min-h-[8.5rem] md:px-7"
              >
                <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  <div className="flex items-center gap-1" aria-label="Рейтинг 4.5 із 5">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const starNumber = index + 1;
                      const isFull = starNumber <= Math.floor(socialProof.ratingValue);
                      const isHalf = !isFull && starNumber - socialProof.ratingValue <= 0.5;

                      return (
                        <svg key={index} viewBox="0 0 24 24" className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true">
                          <defs>
                            <linearGradient id={`trust-half-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="50%" stopColor="var(--accent)" />
                              <stop offset="50%" stopColor="#eceef3" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.3l-5.8 3.07 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z"
                            fill={isFull ? "var(--accent)" : isHalf ? `url(#trust-half-${index})` : "#eceef3"}
                          />
                        </svg>
                      );
                    })}
                  </div>
                  <span className="font-display text-[1.35rem] font-bold leading-none tracking-normal text-[var(--text-strong)] md:text-[1.6rem]">
                    {socialProof.rating}
                  </span>
                </div>
                <p className="text-[1.03rem] font-semibold text-[var(--text-muted)] md:text-[1.15rem]">
                  {socialProof.reviews} відгуків
                </p>
              </Link>

              <article className="flex min-h-[8.2rem] flex-col items-center justify-center border-t border-[rgba(22,29,43,0.08)] px-5 py-5 text-center sm:items-start sm:border-l sm:border-t-0 sm:text-left md:min-h-[8.5rem] md:px-7">
                <div className="min-w-0">
                  <p className="font-display text-[1.65rem] font-bold leading-none tracking-normal text-[var(--text-strong)] md:text-[1.9rem]">
                    {socialProof.users}
                  </p>
                  <p className="mt-2 max-w-[13rem] text-[1.02rem] font-semibold leading-[1.25] text-[var(--text-muted)] md:text-[1.14rem]">
                    {socialProof.usersCaption}
                  </p>
                </div>
              </article>

              <article className="flex min-h-[8.2rem] flex-col items-center justify-center border-t border-[rgba(22,29,43,0.08)] px-5 py-5 text-center sm:items-start sm:border-l sm:border-t-0 sm:text-left md:min-h-[8.5rem] md:px-7">
                <div className="min-w-0">
                  <p className="font-display text-[1.65rem] font-bold leading-none tracking-normal text-[var(--text-strong)] md:text-[1.9rem]">
                    100%
                  </p>
                  <p className="mt-2 max-w-[13rem] text-[1.02rem] font-semibold leading-[1.25] text-[var(--text-muted)] md:text-[1.14rem]">
                    індивідуальний підхід
                  </p>
                </div>
              </article>
            </div>
          </Reveal>
        </section>

        <section id="career-pains" className="relative py-6 md:py-8">
          <div className="pointer-events-none absolute left-1/2 top-[38%] h-64 w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(63,94,255,0.055)] blur-3xl md:h-80" />
          <div className="relative mx-auto grid w-full max-w-[80rem] min-w-0 gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-6 xl:gap-8">
            <div className="order-2 min-w-0 lg:order-2 lg:sticky lg:top-28 lg:self-start">
              <Reveal className="min-w-0">
                <div className="surface-panel relative w-full min-w-0 overflow-hidden rounded-[2rem] px-5 py-6 text-center sm:text-left md:px-7 md:py-8 lg:px-8 lg:py-9">
                  <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[rgba(63,94,255,0.08)] blur-3xl" />
                  <h2 className="home-section-heading max-w-full break-words [overflow-wrap:anywhere]">
                    Ми поруч, щоб зробити ваш шлях до нової роботи{" "}
                    <span className="home-section-heading-accent">простішим і результативнішим</span>
                  </h2>
                  <p className="mt-4 max-w-full break-words text-[0.9rem] leading-[1.72] text-[var(--text-muted)] [overflow-wrap:anywhere] md:text-[1.04rem]">
                    За допомогою наших інструментів і практичних підказок ви швидше виходите на співбесіди, краще виглядаєте на ринку
                    та рухаєтесь до карʼєри, яку справді хочете.
                  </p>
                  <div className="mt-6 flex justify-center sm:justify-start">
                    <Link href="/simulate" className="btn-primary w-full max-w-[18rem] px-4 py-3 text-center text-[0.9rem] leading-tight sm:w-auto sm:max-w-full sm:px-7 md:px-8 md:text-[0.94rem]">
                      Отримати прогноз зміни кар’єри
                    </Link>
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal className="order-1 min-w-0 lg:order-1" delayMs={80}>
              <div className="grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-1">
                {painPoints.map((item, index) => (
                  <article
                    key={item.title}
                    className="surface-panel group relative w-full min-w-0 overflow-hidden rounded-[1.55rem] px-4 py-4 md:px-5 md:py-5 lg:min-h-[86px]"
                  >
                    <div className="pointer-events-none absolute -right-10 top-0 h-20 w-32 rounded-full bg-[rgba(63,94,255,0.045)] blur-2xl transition-opacity duration-200 group-hover:opacity-80" />
                    <div className="relative flex items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(63,94,255,0.08)] font-display text-[0.78rem] font-bold text-[var(--accent-strong)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <h3 className="break-words font-display text-[1.08rem] font-bold leading-[1.18] tracking-normal text-[var(--text-strong)] [overflow-wrap:anywhere] md:text-[1.18rem]">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <CareerHelpSection />

      </div>

      <section id="features" className="feature-stack-section mx-auto mt-12 max-w-[80rem] md:mt-16">
        <div className="feature-card-stack">
          {featureShowcases.map((item, index) => (
            <FeatureStackCard key={item.title} item={item} index={index} />
          ))}
        </div>
      </section>

      <section id="reviews" className="relative mx-auto mt-10 max-w-[80rem] md:mt-12">
        <Reveal>
          <div className="relative">
            <div className="overflow-hidden px-1 pt-4 md:px-2 md:pt-5">
              <div className="reviews-marquee-track flex w-max gap-5">
                {[...reviews, ...reviews].map((review, index) => (
                  <article
                    key={`${review.name}-${index}`}
                    aria-hidden={index >= reviews.length}
                    className="surface-panel relative flex min-h-[345px] w-[22.5rem] flex-none flex-col overflow-hidden rounded-[2rem] px-6 py-6 md:w-[23.5rem]"
                  >
                    <span className="pointer-events-none absolute left-4 top-2 font-display text-[4.6rem] leading-none text-[rgba(74,108,255,0.08)]">
                      “
                    </span>

                    <p className="relative text-[0.97rem] leading-[1.72] text-[var(--text-strong)]">
                      {review.quote}
                    </p>

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
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="career-opportunity-section relative mx-auto mt-10 max-w-[80rem] py-8 md:mt-12 md:py-10" aria-labelledby="career-brands-title">
        <Reveal>
          <div className="grid min-w-0 items-center gap-8 lg:grid-cols-[0.98fr_1.02fr] lg:gap-10">
            <div className="relative z-10 min-w-0 text-center lg:text-left">
              <h2 id="career-brands-title" className="home-section-heading mx-auto max-w-[36rem] lg:mx-0">
                Цільтеся в кращі можливості, а не просто в першу{" "}
                <span className="home-section-heading-accent">доступну вакансію</span>
              </h2>
              <p className="mx-auto mt-5 max-w-[35rem] text-[0.98rem] leading-[1.72] text-[var(--text-muted)] md:text-[1.06rem] lg:mx-0">
                Наш сервіс допомагає тверезо оцінити перехід, посилити резюме й підготовку так, щоб претендувати на ролі з кращим рівнем доходу,
                процесів і професійного росту.
              </p>
            </div>

            <div className="career-opportunity-visual" aria-hidden="true">
              <div className="career-target-board">
                <Image
                  src="/graphics/career-target-visual.webp"
                  alt=""
                  width={1400}
                  height={933}
                  sizes="(max-width: 640px) 100vw, (max-width: 1023px) 74vw, 44vw"
                  className="career-target-asset"
                />
              </div>
            </div>
          </div>

          <div className="career-brand-marquee relative mt-7 overflow-hidden py-2 md:mt-8">
            <div className="career-brand-track flex w-max items-center">
              {Array.from({ length: 3 }).map((_, groupIndex) => (
                <div
                  key={groupIndex}
                  className="career-brand-group flex items-center gap-6 md:gap-9"
                  aria-hidden={groupIndex > 0}
                >
                  {careerBrandNames.map((brand) => (
                    <span key={`${brand}-${groupIndex}`} className="career-brand-name">
                      {brand}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section id="faq" className="mx-auto mt-16 max-w-[80rem] md:mt-24" aria-label="Часті питання">
        <div className="grid gap-4 md:grid-cols-2">
          {faqItems.map((item, index) => (
            <Reveal key={item.question} delayMs={index * 35}>
              <details className="surface-panel group rounded-[1.8rem] px-5 py-4 md:px-6 md:py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[1.04rem] font-semibold leading-[1.28] tracking-normal text-[var(--text-strong)] marker:hidden [&::-webkit-details-marker]:hidden md:text-[1.12rem]">
                  <span>{item.question}</span>
                  <span className="text-[1.4rem] font-medium text-[var(--accent-strong)] transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-8 text-[0.96rem] leading-[1.72] text-[var(--text-muted)] md:text-[0.99rem]">{item.answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="final-cta-section mx-auto mt-16 max-w-[80rem] md:mt-24" aria-labelledby="final-cta-title">
        <Reveal>
          <div className="final-cta-panel">
            <div className="relative z-10 mx-auto flex max-w-[48rem] flex-col items-center text-center">
              <div className="flex items-center gap-1.5" aria-label="Рейтинг 4.5 із 5">
                {Array.from({ length: 5 }).map((_, index) => {
                  const starNumber = index + 1;
                  const isFull = starNumber <= Math.floor(socialProof.ratingValue);
                  const isHalf = !isFull && starNumber - socialProof.ratingValue <= 0.5;

                  return (
                    <svg key={index} viewBox="0 0 24 24" className="h-5 w-5 text-[var(--accent)]" aria-hidden="true">
                      <defs>
                        <linearGradient id={`final-trust-half-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="50%" stopColor="currentColor" />
                          <stop offset="50%" stopColor="rgba(102,112,133,0.24)" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.3l-5.8 3.07 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z"
                        fill={isFull ? "currentColor" : isHalf ? `url(#final-trust-half-${index})` : "rgba(102,112,133,0.24)"}
                      />
                    </svg>
                  );
                })}
                <span className="ml-2 text-[0.94rem] font-semibold text-[var(--text-muted)]">{socialProof.rating} за відгуками користувачів</span>
              </div>

              <p className="mt-7 text-[0.82rem] font-extrabold uppercase tracking-normal text-[var(--accent-strong)] md:text-[0.88rem]">
                Перед тим як вкладати місяці у новий напрям
              </p>
              <h2 id="final-cta-title" className="mt-4 max-w-[42rem] font-display text-[2.12rem] font-extrabold leading-[1.04] tracking-normal text-[var(--text-strong)] sm:text-[2.65rem] md:text-[3.25rem]">
                Перевірте, чи справді окупиться ваша зміна карʼєри
              </h2>
              <p className="mt-6 max-w-[39rem] text-[1rem] font-medium leading-[1.72] text-[var(--text-muted)] md:text-[1.12rem]">
                Decivio покаже ризик-період, потенціал доходу, сильні сторони та перші кроки, щоб ви рухались не навмання,
                а з реалістичним планом.
              </p>

              <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
                <Link href="/simulate" className="final-cta-button">
                  Почати аналіз карʼєри
                </Link>
                <span className="text-[0.9rem] font-semibold text-[var(--text-muted)]">Безкоштовно · 2–3 хвилини</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

    </div>
    </>
  );
}
