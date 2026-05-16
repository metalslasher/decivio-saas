import Link from "next/link";

const ctaLabel = "Почати аналіз кар’єри";
const ctaMeta = "Безкоштовно • 2–3 хвилини";

const insightCards = [
  {
    label: "Ринок",
    value: "58 000 грн"
  },
  {
    label: "Ціль",
    value: "65 000 грн"
  },
  {
    label: "Фокус",
    value: "резюме + співбесіди"
  }
] as const;

function HeroProductCard() {
  return (
    <div id="hero-preview" className="hero-forecast-card">
      <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[rgba(67,97,255,0.12)] blur-3xl" />
      <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[rgba(152,165,255,0.14)] blur-3xl" />

      <div className="relative z-10 flex h-full min-h-[17rem] flex-col justify-between p-4 sm:min-h-[20rem] sm:p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-strong)]">Після аналізу</span>
            <h2 className="mt-2 max-w-[18rem] font-display text-[1.45rem] font-extrabold leading-[1.06] text-[var(--text-strong)] sm:text-[1.7rem]">
              Видно, де ваш дохід можна посилити
            </h2>
          </div>
          <span className="shrink-0 rounded-full bg-[rgba(40,184,111,0.12)] px-3 py-2 text-sm font-extrabold text-[#28a866]">
            +20 000 грн
          </span>
        </div>

        <div className="mt-6 rounded-[1.45rem] border border-white/72 bg-white/72 p-4 shadow-[0_18px_44px_-34px_rgba(22,29,43,0.26)]">
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-soft)]">Зараз</span>
              <strong className="mt-1 block text-[1.35rem] leading-none text-[var(--text-strong)]">45 000</strong>
            </div>
            <div className="text-right">
              <span className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-soft)]">Після підготовки</span>
              <strong className="mt-1 block text-[1.55rem] leading-none text-[var(--accent-strong)]">65 000</strong>
            </div>
          </div>

          <svg viewBox="0 0 420 132" className="mt-3 h-28 w-full overflow-visible" aria-hidden="true" preserveAspectRatio="none">
            <path d="M24 106H396" stroke="rgba(148,163,184,0.22)" strokeWidth="2" strokeLinecap="round" />
            <path d="M28 92C96 82 132 76 184 66C250 54 298 42 390 22" fill="none" stroke="rgba(67,97,255,0.18)" strokeWidth="15" strokeLinecap="round" />
            <path d="M28 92C96 82 132 76 184 66C250 54 298 42 390 22" fill="none" stroke="var(--accent-strong)" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="28" cy="92" r="8" fill="white" stroke="var(--accent-strong)" strokeWidth="4" />
            <circle cx="184" cy="66" r="7" fill="white" stroke="rgba(67,97,255,0.74)" strokeWidth="3.5" />
            <circle cx="390" cy="22" r="9" fill="white" stroke="#28b86f" strokeWidth="4" />
          </svg>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {insightCards.map((item) => (
            <div key={item.label} className="rounded-[1rem] border border-[rgba(67,97,255,0.1)] bg-[rgba(248,250,255,0.7)] px-3 py-2.5">
              <span className="block text-[0.68rem] font-bold uppercase tracking-[0.11em] text-[var(--text-soft)]">{item.label}</span>
              <strong className="mt-1 block truncate text-sm text-[var(--text-strong)]">{item.value}</strong>
            </div>
          ))}
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
