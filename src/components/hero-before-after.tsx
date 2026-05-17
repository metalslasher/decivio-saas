import Link from "next/link";

const ctaLabel = "Почати аналіз кар’єри";
const ctaMeta = "Безкоштовно • 2–3 хвилини";

const heroCases = [
  {
    name: "Марія",
    role: "маркетологиня",
    market: "Україна",
    before: "45 000 грн",
    after: "62 000 грн",
    change: "+17 000 грн",
    focus: "Оновили резюме й аргументи для сильнішої компанії.",
    avatar: "М"
  },
  {
    name: "Олександр",
    role: "продакт-менеджер",
    market: "міжнародні вакансії",
    before: "80 000 грн",
    after: "$2 900",
    change: "новий ринок",
    focus: "Звузили ринок і підготували профіль під англомовні співбесіди.",
    avatar: "О"
  },
  {
    name: "Ірина",
    role: "HR-спеціалістка",
    market: "сильніша компанія",
    before: "38 000 грн",
    after: "55 000 грн",
    change: "+45%",
    focus: "Підсвітили навички, сильні відповіді та сценарій переговорів.",
    avatar: "І"
  },
  {
    name: "Денис",
    role: "менеджер з продажів",
    market: "нова пропозиція",
    before: "52 000 грн",
    after: "78 000 грн",
    change: "+26 000 грн",
    focus: "Порівняли умови й підготували питання до роботодавця.",
    avatar: "Д"
  }
] as const;

function HeroProductCard() {
  return (
    <div id="hero-preview" className="hero-forecast-card">
      <div className="hero-cases-visual">
        <div className="hero-cases-heading">
          <span>Анонімізовані сценарії</span>
          <strong>Як може виглядати сильніший наступний крок</strong>
        </div>

        <div className="hero-case-slider" aria-label="Приклади кар'єрних сценаріїв">
          <div className="hero-case-track">
            {heroCases.map((caseItem, index) => (
              <article className={`hero-case-card hero-case-card--${index + 1}`} key={caseItem.name}>
                <div className="hero-case-card-top">
                  <div className={`hero-case-avatar hero-case-avatar--${(index % heroCases.length) + 1}`} aria-hidden="true">
                    <span>{caseItem.avatar}</span>
                  </div>
                  <div>
                    <strong>{caseItem.name}</strong>
                    <span>{caseItem.role}</span>
                  </div>
                  <small>{caseItem.market}</small>
                </div>

                <div className="hero-case-pay">
                  <div>
                    <span>було</span>
                    <strong>{caseItem.before}</strong>
                  </div>
                  <svg viewBox="0 0 38 16" aria-hidden="true">
                    <path d="M2 8h31m-6-5 6 5-6 5" />
                  </svg>
                  <div>
                    <span>стало</span>
                    <strong>{caseItem.after}</strong>
                  </div>
                </div>

                <p>{caseItem.focus}</p>

                <div className="hero-case-result">
                  <span>{caseItem.change}</span>
                  <small>після підготовки</small>
                </div>
              </article>
            ))}
          </div>
          <div className="hero-case-dots" aria-hidden="true">
            {heroCases.map((caseItem) => (
              <span key={caseItem.name} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroBeforeAfter() {
  return (
    <section className="relative pt-0 md:pt-1 lg:pt-0">
      <div className="mx-auto grid max-w-[80rem] items-center gap-8 py-7 pb-10 md:gap-8 md:py-8 md:pb-10 lg:min-h-[clamp(30rem,calc(100svh-34rem),34rem)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-3 xl:gap-12">
        <div className="relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left">
          <h1 className="max-w-[12.5ch] font-display text-[2.28rem] font-extrabold leading-[0.96] tracking-normal text-[var(--text-strong)] sm:max-w-[13.5ch] sm:text-[2.85rem] md:text-[3.15rem] lg:max-w-[36rem] lg:text-[2.85rem] xl:max-w-[39rem] xl:text-[3.05rem]">
            Зрозумійте, де ваша кар’єра <span className="text-warm">може приносити більше</span>
          </h1>

          <p className="mt-6 max-w-[21rem] text-balance text-[1rem] font-medium leading-[1.66] text-[rgba(92,103,128,0.94)] sm:max-w-[30rem] sm:text-[1.08rem] md:max-w-[34rem] md:text-[1.16rem] md:leading-[1.62]">
            Порівнюємо ваш дохід із ринком, показуємо реалістичний потенціал і ведемо через профіль, резюме, вакансії, співбесіди та переговори про умови.
          </p>

          <div className="mt-7 flex w-full max-w-[18rem] flex-col items-center gap-3.5 sm:max-w-[22rem] lg:items-start">
            <Link href="/simulate" className="hero-main-cta">
              <span className="hero-main-cta-label">{ctaLabel}</span>
              <span className="hero-main-cta-icon">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none" aria-hidden="true">
                  <path d="M4 16l5-5 3 3 8-8M15 6h5v5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>

            <span className="inline-flex items-center gap-2 text-[0.84rem] font-semibold text-[rgba(140,151,177,0.94)] md:text-[0.92rem]">
              <svg viewBox="0 0 24 24" className="h-[1.125rem] w-[1.125rem] fill-none text-[var(--accent-strong)]" aria-hidden="true">
                <path d="M12 3l7 3v5c0 4.4-2.8 7.7-7 9-4.2-1.3-7-4.6-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {ctaMeta}
            </span>
          </div>
        </div>

        <div className="hero-forecast-shell relative z-10 mx-auto w-full">
          <HeroProductCard />
        </div>
      </div>
    </section>
  );
}
