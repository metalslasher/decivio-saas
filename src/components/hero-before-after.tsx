import Link from "next/link";

const ctaLabel = "Почати аналіз кар’єри";
const ctaMeta = "Безкоштовно • 2–3 хвилини";

const moduleImpactSteps = [
  {
    label: "Старт",
    impact: "0%",
    x: 58,
    y: 196
  },
  {
    label: "Оцінка",
    impact: "+6%",
    x: 154,
    y: 169
  },
  {
    label: "Профіль",
    impact: "+13%",
    x: 250,
    y: 138
  },
  {
    label: "Співбесіди",
    impact: "+21%",
    x: 346,
    y: 102
  },
  {
    label: "Умови",
    impact: "+28%",
    x: 442,
    y: 71
  }
] as const;

const moduleImpactPath = moduleImpactSteps.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
const moduleImpactAreaPath = `${moduleImpactPath} L ${moduleImpactSteps[moduleImpactSteps.length - 1].x} 196 L ${moduleImpactSteps[0].x} 196 Z`;

function HeroProductCard() {
  return (
    <div id="hero-preview" className="hero-forecast-card">
      <div className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-[rgba(67,97,255,0.1)] blur-3xl" />
      <div className="absolute -bottom-14 left-8 h-32 w-32 rounded-full bg-[rgba(152,165,255,0.12)] blur-3xl" />

      <div className="relative z-10 p-4 sm:p-5 md:p-6">
        <svg viewBox="0 0 500 248" className="h-[15rem] w-full overflow-visible sm:h-[15.75rem]" role="img" aria-labelledby="hero-impact-chart-title">
          <title id="hero-impact-chart-title">Графік впливу модулів сервісу на приріст доходу</title>
            <defs>
              <linearGradient id="hero-module-impact-area" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-strong)" stopOpacity="0.14" />
                <stop offset="100%" stopColor="var(--accent-strong)" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            <text x="18" y="24" className="fill-[var(--text-strong)] text-[0.86rem] font-extrabold">
              Вплив модулів на дохід
            </text>

            {[
              { y: 62, label: "30%" },
              { y: 107, label: "20%" },
              { y: 151, label: "10%" },
              { y: 196, label: "0%" }
            ].map((line) => (
              <g key={line.label}>
                <line x1="54" x2="452" y1={line.y} y2={line.y} stroke="rgba(148,163,184,0.18)" strokeWidth="1" />
                <text x="18" y={line.y + 4} className="fill-[var(--text-soft)] text-[0.62rem] font-bold">
                  {line.label}
                </text>
              </g>
            ))}

            <line x1="54" x2="54" y1="62" y2="196" stroke="rgba(148,163,184,0.24)" strokeWidth="1.5" />
            <line x1="54" x2="452" y1="196" y2="196" stroke="rgba(148,163,184,0.24)" strokeWidth="1.5" />

            <path d={moduleImpactAreaPath} fill="url(#hero-module-impact-area)" />
            <path d={moduleImpactPath} fill="none" stroke="rgba(67,97,255,0.18)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            <path d={moduleImpactPath} fill="none" stroke="var(--accent-strong)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

            {moduleImpactSteps.map((point) => (
              <g key={point.label}>
                <line x1={point.x} x2={point.x} y1={point.y + 12} y2="196" stroke="rgba(148,163,184,0.2)" strokeDasharray="3 7" />
                <circle cx={point.x} cy={point.y} r="8" fill="white" stroke="var(--accent-strong)" strokeWidth="3.5" />
                <text x={point.x} y={point.y - 16} textAnchor="middle" className="fill-[#28a866] text-[0.68rem] font-extrabold">
                  {point.impact}
                </text>
                <text x={point.x} y="224" textAnchor="middle" className="fill-[var(--text-strong)] text-[0.64rem] font-extrabold">
                  {point.label}
                </text>
              </g>
            ))}
        </svg>
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
