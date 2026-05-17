import Link from "next/link";

const ctaLabel = "Почати аналіз кар’єри";
const ctaMeta = "Безкоштовно • 2–3 хвилини";

const routeModules = [
  {
    number: "01",
    title: "Оцінка ринку",
    detail: "де є запас для росту"
  },
  {
    number: "02",
    title: "Профіль",
    detail: "резюме і аргументи"
  },
  {
    number: "03",
    title: "Співбесіди",
    detail: "відповіді та приклади"
  },
  {
    number: "04",
    title: "Пропозиції",
    detail: "зарплата, умови, рішення"
  }
] as const;

function HeroProductCard() {
  return (
    <div id="hero-preview" className="hero-forecast-card">
      <div className="hero-route-visual">
        <div className="hero-route-status">
          <div className="hero-route-state hero-route-state--current">
            <span>Зараз</span>
            <strong>Поточна позиція</strong>
            <small>дохід, профіль і переговори без чіткого ринкового орієнтира</small>
          </div>

          <div className="hero-route-arrow" aria-hidden="true">
            <span />
          </div>

          <div className="hero-route-state hero-route-state--target">
            <span>Після підготовки</span>
            <strong>Сильніша пропозиція</strong>
            <small>зрозумілий план, сильні аргументи і кращі умови</small>
          </div>
        </div>

        <div className="hero-route-modules" aria-label="Модулі підготовки до сильнішої пропозиції">
          {routeModules.map((module, index) => (
            <div key={module.number} className={`hero-route-module hero-route-module--${index + 1}`}>
              <span>{module.number}</span>
              <div>
                <strong>{module.title}</strong>
                <small>{module.detail}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="hero-route-result">
          <span>На виході</span>
          <strong>маршрут до кращої вакансії, зарплати та умов</strong>
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
            Підсиліть кар’єру <span className="text-warm">на основі вашого досвіду</span>
          </h1>

          <p className="mt-6 max-w-[21rem] text-balance text-[1rem] font-medium leading-[1.66] text-[rgba(92,103,128,0.94)] sm:max-w-[30rem] sm:text-[1.08rem] md:max-w-[34rem] md:text-[1.16rem] md:leading-[1.62]">
            Ми порівнюємо ваш дохід із ринком, показуємо сильніший напрям і допомагаємо підготувати резюме, вакансії,
            співбесіди та рішення по пропозиціях.
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
