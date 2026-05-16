import Link from "next/link";

const ctaLabel = "Почати аналіз кар’єри";
const ctaMeta = "Безкоштовно • 2–3 хвилини";

const routeStages = [
  {
    step: "01",
    title: "Оцінка доходу",
    description: "поточна роль, ринок і реалістичний потенціал",
    gain: "+0%"
  },
  {
    step: "02",
    title: "Сильніша позиція",
    description: "резюме, профіль і аргументи для роботодавця",
    gain: "+11%"
  },
  {
    step: "03",
    title: "Кращі розмови",
    description: "підготовка до співбесід і відповідей",
    gain: "+19%"
  },
  {
    step: "04",
    title: "Рішення по пропозиціях",
    description: "порівняння умов, зарплати й наступного кроку",
    gain: "+28%"
  }
] as const;

function HeroProductCard() {
  return (
    <div id="hero-preview" className="hero-forecast-card">
      <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[rgba(67,97,255,0.12)] blur-3xl" />
      <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[rgba(152,165,255,0.14)] blur-3xl" />

      <div className="relative z-10 flex h-full min-h-[18.5rem] flex-col justify-between p-4 sm:min-h-[23rem] sm:p-5 md:p-6 lg:min-h-[24rem]">
        <div className="flex items-start justify-between gap-3">
          <div className="hero-career-pill">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(238,242,255,0.94)] text-[var(--accent-strong)]">
              <svg viewBox="0 0 24 24" className="h-[1.125rem] w-[1.125rem] fill-none" aria-hidden="true">
                <path d="M9 7V6.4A3.4 3.4 0 0 1 12.4 3h0A3.4 3.4 0 0 1 15.8 6.4V7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                <rect x="4" y="7" width="16" height="12" rx="2.6" stroke="currentColor" strokeWidth="1.9" />
                <path d="M4 12h16M10 12v1.5h4V12" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block text-[0.74rem] font-semibold text-[rgba(102,112,133,0.78)]">Ваша ситуація зараз</span>
              <span className="block truncate text-[0.9rem] font-extrabold text-[var(--text-strong)]">Маркетолог · 45 000 грн</span>
            </span>
          </div>

          <div className="hero-growth-pill">
            <span className="block text-[1.8rem] font-extrabold leading-none text-[#28b86f]">+28%</span>
            <span className="mt-1 block max-w-[5.8rem] text-[0.74rem] font-semibold leading-[1.16] text-[rgba(92,103,128,0.9)]">
              потенціал росту
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {routeStages.map((stage, index) => (
            <div
              key={stage.step}
              className="relative overflow-hidden rounded-[1.25rem] border border-white/70 bg-white/72 px-4 py-3 shadow-[0_14px_36px_rgba(34,43,84,0.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(238,242,255,0.96)] text-xs font-extrabold text-[var(--accent-strong)]">
                    {stage.step}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-extrabold text-[var(--text-strong)] sm:text-[0.98rem]">{stage.title}</span>
                    <span className="mt-0.5 block text-xs font-medium leading-[1.45] text-[var(--text-muted)] sm:text-[0.82rem]">
                      {stage.description}
                    </span>
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-[rgba(40,184,111,0.11)] px-2.5 py-1 text-xs font-extrabold text-[#28a866]">
                  {stage.gain}
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgba(226,231,244,0.92)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent-strong),rgba(40,184,111,0.82))]"
                  style={{ width: `${32 + index * 18}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-[rgba(67,97,255,0.16)] bg-[rgba(248,250,255,0.82)] px-4 py-3">
          <span className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent-strong)]">Після аналізу</span>
          <strong className="mt-1 block text-sm leading-[1.45] text-[var(--text-strong)]">
            Зрозумілий маршрут: що змінити в профілі, де шукати кращі вакансії і як говорити про зарплату.
          </strong>
        </div>
      </div>
    </div>
  );
}

export function HeroBeforeAfter() {
  return (
    <section className="relative pt-0 md:pt-1 lg:pt-0">
      <div className="mx-auto grid max-w-[80rem] items-center gap-8 py-7 pb-10 md:gap-8 md:py-8 md:pb-10 lg:min-h-[clamp(30rem,calc(100svh-34rem),34rem)] lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 lg:py-3 xl:gap-12">
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

        <div className="hero-forecast-shell relative z-10 mx-auto">
          <HeroProductCard />
        </div>
      </div>
    </section>
  );
}
