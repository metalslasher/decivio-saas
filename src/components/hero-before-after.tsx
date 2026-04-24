"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const chartData = [
  { year: "1", stay: 34, next: 28 },
  { year: "2", stay: 38, next: 45 },
  { year: "3", stay: 42, next: 61 },
  { year: "4", stay: 46, next: 78 },
  { year: "5", stay: 51, next: 93 }
];

const chartWidth = 560;
const chartHeight = 250;
const chartPadding = 22;
const maxValue = 100;
const chartCurveInset = 1.5;

type HeroHeadlineSegment = {
  text: string;
  accent?: boolean;
};

type HeroHeadline = {
  fullText: string;
  segments: readonly HeroHeadlineSegment[];
};

const heroHeadlines = [
  {
    fullText: "Оцініть свій дохід у новій кар’єрі ще до старту",
    segments: [
      { text: "Оцініть свій " },
      { text: "дохід", accent: true },
      { text: " у новій кар’єрі ще до старту" }
    ]
  },
  {
    fullText: "Порівняйте напрямки та оберіть найвигідніший",
    segments: [
      { text: "Порівняйте напрямки та оберіть " },
      { text: "найвигідніший", accent: true }
    ]
  },
  {
    fullText: "Отримайте покроковий план зміни професії",
    segments: [
      { text: "Отримайте " },
      { text: "покроковий план", accent: true },
      { text: " зміни професії" }
    ]
  },
  {
    fullText: "Знайдіть роботу, яка дійсно вам підходить",
    segments: [
      { text: "Знайдіть роботу, яка " },
      { text: "дійсно вам підходить", accent: true }
    ]
  }
] as const satisfies readonly HeroHeadline[];

const subheadline =
  "Усе для переходу в нову кар’єру з прогнозованим результатом і зрозумілим планом дій.";

const ctaLabels = [
  "Почати аналіз кар’єри",
  "Почати зміну кар’єри"
] as const;
const ctaMeta = "\u0411\u0435\u0437\u043a\u043e\u0448\u0442\u043e\u0432\u043d\u043e \u2022 2\u20133 \u0445\u0432\u0438\u043b\u0438\u043d\u0438";
const legendStay = "\u041f\u043e\u0442\u043e\u0447\u043d\u0430 \u0440\u043e\u043b\u044c: PPC Specialist";
const legendNext = "\u041d\u043e\u0432\u0430 \u0440\u043e\u043b\u044c: DevOps";
const axisYearSuffix = "\u0440\u0456\u043a";
const axisMoneySuffix = "\u0442\u0438\u0441.";

type ChartPoint = { x: number; y: number };

function toChartPoint(value: number, index: number, total: number): ChartPoint {
  const usableWidth = chartWidth - chartCurveInset * 2;
  const x = total > 1 ? (index / (total - 1)) * usableWidth + chartCurveInset : chartWidth / 2;
  const y = chartHeight - chartPadding - (value / maxValue) * (chartHeight - chartPadding * 2);
  return { x, y };
}

function buildSmoothPath(points: ChartPoint[]) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] ?? points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] ?? p2;

    const controlPoint1X = p1.x + (p2.x - p0.x) / 6;
    const controlPoint1Y = p1.y + (p2.y - p0.y) / 6;
    const controlPoint2X = p2.x - (p3.x - p1.x) / 6;
    const controlPoint2Y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

function buildSmoothAreaPath(points: ChartPoint[]) {
  if (points.length === 0) {
    return "";
  }

  const baselineY = chartHeight - chartPadding;
  const startX = points[0].x;
  const endX = points[points.length - 1].x;
  return `${buildSmoothPath(points)} L ${endX} ${baselineY} L ${startX} ${baselineY} Z`;
}

const stayPoints = chartData.map((item, index) => toChartPoint(item.stay, index, chartData.length));
const nextPoints = chartData.map((item, index) => toChartPoint(item.next, index, chartData.length));
const stayPath = buildSmoothPath(stayPoints);
const nextPath = buildSmoothPath(nextPoints);
const nextAreaPath = buildSmoothAreaPath(nextPoints);

const horizonYears = chartData.length;
const stayLastValue = chartData[chartData.length - 1]?.stay ?? 0;
const nextLastValue = chartData[chartData.length - 1]?.next ?? 0;
const growthPercent = stayLastValue > 0 ? Math.round(((nextLastValue - stayLastValue) / stayLastValue) * 100) : 0;
const growthBadge = `${growthPercent >= 0 ? "+" : ""}${growthPercent}% \u0434\u043e \u0434\u043e\u0445\u043e\u0434\u0443 \u0437\u0430 ${horizonYears} \u0440\u043e\u043a\u0456\u0432`;

const yAxisTicks = [100, 80, 60, 40, 20];

function renderTypedHeadline(segments: readonly HeroHeadlineSegment[], visibleLength: number) {
  let remaining = visibleLength;

  return segments.flatMap((segment, index) => {
    if (remaining <= 0) {
      return [];
    }

    const visibleText = segment.text.slice(0, remaining);
    remaining -= visibleText.length;

    if (!visibleText) {
      return [];
    }

    return (
      <span key={`${index}-${segment.text}`} className={segment.accent ? "text-warm" : undefined}>
        {visibleText}
      </span>
    );
  });
}

function HeroCompassDecor() {
  const ticks = Array.from({ length: 48 }, (_, index) => index);

  return (
    <div className="hero-compass-decor">
      <svg viewBox="0 0 520 520" className="h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="hero-compass-face" cx="50%" cy="44%" r="58%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="72%" stopColor="#f4f7ff" />
            <stop offset="100%" stopColor="#e3e9ff" />
          </radialGradient>
          <linearGradient id="hero-compass-rim" x1="18%" y1="8%" x2="82%" y2="94%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="54%" stopColor="#eef2ff" />
            <stop offset="100%" stopColor="#c9d4ff" />
          </linearGradient>
          <linearGradient id="hero-compass-needle" x1="26%" y1="78%" x2="77%" y2="24%">
            <stop offset="0%" stopColor="#8398ff" />
            <stop offset="100%" stopColor="#3f5eff" />
          </linearGradient>
        </defs>

        <circle cx="260" cy="260" r="226" fill="url(#hero-compass-rim)" opacity="0.82" />
        <circle cx="260" cy="260" r="205" fill="url(#hero-compass-face)" />
        <circle cx="260" cy="260" r="176" fill="none" stroke="#c6d0ff" strokeWidth="2" opacity="0.78" />
        <circle cx="260" cy="260" r="132" fill="none" stroke="#dbe2ff" strokeWidth="1.4" opacity="0.72" />

        {ticks.map((tick) => {
          const isMajor = tick % 6 === 0;
          const length = isMajor ? 22 : 11;
          return (
            <line
              key={tick}
              x1="260"
              y1="67"
              x2="260"
              y2={67 + length}
              stroke="#9bacff"
              strokeWidth={isMajor ? 2.3 : 1.25}
              opacity={isMajor ? 0.72 : 0.45}
              transform={`rotate(${tick * 7.5} 260 260)`}
            />
          );
        })}

        <text x="260" y="122" textAnchor="middle" className="hero-compass-letter">N</text>
        <text x="260" y="425" textAnchor="middle" className="hero-compass-letter">S</text>
        <text x="98" y="276" textAnchor="middle" className="hero-compass-letter">W</text>
        <text x="425" y="276" textAnchor="middle" className="hero-compass-letter">E</text>

        <path d="M258 268 398 138 294 304 130 392Z" fill="url(#hero-compass-needle)" opacity="0.92" />
        <path d="M258 268 130 392 226 232 398 138Z" fill="#7d90ff" opacity="0.28" />
        <circle cx="260" cy="260" r="32" fill="#f7f9ff" stroke="#cdd7ff" strokeWidth="9" />
        <circle cx="260" cy="260" r="17" fill="#8ea0ff" opacity="0.86" />
      </svg>

      <div className="hero-compass-orbit" aria-hidden="true" />
      <div className="hero-compass-chip" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none">
          <path d="M8.5 8V6.7A2.2 2.2 0 0 1 10.7 4.5h2.6a2.2 2.2 0 0 1 2.2 2.2V8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M4.5 9.2h15v8.2a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V9.2Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
          <path d="M4.8 13.1h14.4M12 12v2.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function HeroPathDecor() {
  return (
    <div className="hero-path-decor">
      <svg viewBox="0 0 520 600" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="hero-path-surface" x1="22%" y1="12%" x2="88%" y2="92%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="52%" stopColor="#eef2ff" />
            <stop offset="100%" stopColor="#d7defd" />
          </linearGradient>
          <linearGradient id="hero-path-side" x1="20%" y1="0%" x2="88%" y2="100%">
            <stop offset="0%" stopColor="#dfe6ff" />
            <stop offset="100%" stopColor="#bfcaff" />
          </linearGradient>
          <linearGradient id="hero-flag" x1="12%" y1="15%" x2="92%" y2="86%">
            <stop offset="0%" stopColor="#3f5eff" />
            <stop offset="100%" stopColor="#7f91ff" />
          </linearGradient>
        </defs>

        <path className="hero-path-shadow" d="M170 520c82 36 238 20 284-39 32-41 4-82-58-92 40-25 51-65 24-94-18-20-50-29-88-28 52-29 56-77 5-100-69-31-192-7-237 42-33 36-15 73 36 89-58 25-83 71-55 107 17 22 48 34 89 37-55 21-68 55 0 78Z" fill="#d8e0ff" opacity="0.34" />
        <path d="M112 482c54 43 198 58 294 15 88-40 89-110 1-134 79-35 103-106 39-145-45-28-119-31-184-9" fill="none" stroke="url(#hero-path-side)" strokeWidth="62" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
        <path d="M112 452c54 43 198 58 294 15 88-40 89-110 1-134 79-35 103-106 39-145-45-28-119-31-184-9" fill="none" stroke="url(#hero-path-surface)" strokeWidth="62" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="120" cy="452" rx="73" ry="30" fill="#ffffff" opacity="0.94" />
        <ellipse cx="306" cy="361" rx="70" ry="30" fill="#ffffff" opacity="0.94" />
        <ellipse cx="392" cy="212" rx="66" ry="28" fill="#ffffff" opacity="0.94" />

        <line x1="405" y1="56" x2="405" y2="214" stroke="#7487ee" strokeWidth="11" strokeLinecap="round" />
        <line x1="399" y1="58" x2="399" y2="216" stroke="#b7c3ff" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
        <path d="M410 72c33 0 52 20 83 29-31 10-50 34-83 34Z" fill="url(#hero-flag)" />
        <circle cx="405" cy="53" r="16" fill="#dfe5ff" stroke="#9faeff" strokeWidth="4" />
        <ellipse cx="405" cy="222" rx="42" ry="18" fill="#d7dfff" opacity="0.78" />

        {Array.from({ length: 28 }).map((_, index) => (
          <circle
            key={index}
            cx={82 + (index % 7) * 58}
            cy={120 + Math.floor(index / 7) * 96}
            r={index % 3 === 0 ? 2.8 : 2}
            fill="#8ea0ff"
            opacity={0.12 + (index % 4) * 0.08}
          />
        ))}
      </svg>

      <div className="hero-path-card hero-path-card--goal" aria-hidden="true">
        <span className="hero-path-card-icon">
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none">
            <path d="M12 20a8 8 0 1 0-8-8 8 8 0 0 0 8 8Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 16a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 12l5.5-5.5M17 7h2V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span>
          <span className="block font-semibold text-[var(--text-strong)]">Нова кар’єра</span>
          <span className="mt-1 block text-[0.76rem] text-[var(--text-muted)]">Ціль досягнута</span>
        </span>
      </div>

      <div className="hero-path-card hero-path-card--plan" aria-hidden="true">
        <span className="hero-path-card-icon">
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none">
            <path d="M5 19c5.4-1.4 10-6 11.5-11.5L20 4l-3.5.8C11 6.2 6.4 10.8 5 16.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M9 15l-4 4M15 9l-2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        <span>
          <span className="block font-semibold text-[var(--text-strong)]">План дій</span>
          <span className="mt-1 block text-[0.76rem] text-[var(--text-muted)]">Крок за кроком</span>
        </span>
      </div>

      <div className="hero-path-card hero-path-card--analysis" aria-hidden="true">
        <span className="hero-path-card-icon">
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none">
            <path d="M9 18h6M10 21h4M12 3a6.5 6.5 0 0 0-4 11.6c.8.6 1 1.1 1 2.4h6c0-1.3.2-1.8 1-2.4A6.5 6.5 0 0 0 12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span>
          <span className="block font-semibold text-[var(--text-strong)]">Аналіз</span>
          <span className="mt-1 block text-[0.76rem] text-[var(--text-muted)]">Ваші сильні сторони</span>
        </span>
      </div>
    </div>
  );
}

export function HeroBeforeAfter() {
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [ctaIndex, setCtaIndex] = useState(0);
  const activeHeadline = heroHeadlines[headlineIndex];
  const typedHeadline = renderTypedHeadline(activeHeadline.segments, typedText.length);

  useEffect(() => {
    if (!isDeleting && typedText === activeHeadline.fullText) {
      const pauseTimer = setTimeout(() => setIsDeleting(true), 1500);
      return () => clearTimeout(pauseTimer);
    }

    if (isDeleting && typedText.length === 0) {
      setIsDeleting(false);
      setHeadlineIndex((prev) => (prev + 1) % heroHeadlines.length);
      return;
    }

    const speed = isDeleting ? 26 : 44;
    const typingTimer = setTimeout(() => {
      setTypedText((prev) =>
        isDeleting
          ? activeHeadline.fullText.slice(0, Math.max(0, prev.length - 1))
          : activeHeadline.fullText.slice(0, prev.length + 1)
      );
    }, speed);

    return () => clearTimeout(typingTimer);
  }, [activeHeadline, isDeleting, typedText]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCtaIndex((prev) => (prev + 1) % ctaLabels.length);
    }, 2800);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <section className="relative pt-2 md:pt-4">
      <div className="pointer-events-none absolute -left-24 top-10 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(74,108,255,0.10)_0%,rgba(74,108,255,0.05)_36%,transparent_72%)]" />
      <div className="pointer-events-none absolute -right-20 top-4 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(152,165,255,0.08)_0%,rgba(152,165,255,0.04)_36%,transparent_72%)]" />

      <div className="space-y-8 md:space-y-10">
        <div className="relative left-1/2 flex min-h-[calc(100svh-6rem)] w-screen -translate-x-1/2 items-center justify-center overflow-hidden px-4 md:min-h-[calc(100svh-7rem)] sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <HeroCompassDecor />
            <HeroPathDecor />
          </div>

          <div className="relative z-10 flex w-full max-w-[60rem] flex-col items-center space-y-6 text-center sm:space-y-7 md:-translate-y-8 lg:-translate-y-10">
            <h1 className="mx-auto min-h-[6.7rem] max-w-[12ch] text-balance font-display text-[2.08rem] font-bold leading-[0.92] tracking-[-0.06em] text-[var(--text-strong)] sm:min-h-[7.8rem] sm:text-[2.7rem] md:min-h-[8.5rem] md:max-w-[15ch] md:text-[3.55rem] lg:min-h-[8rem] lg:max-w-[16ch] lg:text-[3.45rem] xl:max-w-[17ch] xl:text-[3.6rem]">
              {typedHeadline}
              <span className="hero-caret ml-1 text-[var(--accent-strong)]" aria-hidden="true">
                |
              </span>
            </h1>

            <p className="mx-auto max-w-[20rem] text-balance text-[1rem] font-medium leading-[1.66] text-[rgba(92,103,128,0.94)] sm:max-w-[30rem] sm:text-[1.08rem] md:max-w-[36rem] md:text-[1.2rem] md:leading-[1.62] lg:max-w-[44rem] lg:text-[1.24rem]">
              {subheadline}
            </p>

            <div className="mt-4 flex justify-center md:mt-7">
              <div className="w-full max-w-[18.5rem] sm:max-w-[22rem]">
                <div className="flex flex-col items-center gap-3.5">
                  <Link
                    href="/simulate"
                    className="btn-primary w-full justify-center gap-2.5 px-6 py-3.5 text-[1rem] font-extrabold sm:min-w-[16rem] sm:w-auto sm:px-7 md:text-[1.06rem]"
                  >
                    <span className="transition-opacity duration-200">{ctaLabels[ctaIndex]}</span>
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/20">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none" aria-hidden="true">
                        <path
                          d="M4 16l5-5 3 3 8-8M15 6h5v5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </Link>
                  <span className="text-[0.84rem] font-semibold tracking-[0.01em] text-[rgba(140,151,177,0.94)] md:text-[0.94rem]">{ctaMeta}</span>
                  <Link href="#hero-preview" aria-label="Прокрутити до наступного блоку" className="hero-scroll-cue mt-1.5">
                    <span className="hero-scroll-cue-shell" aria-hidden="true">
                      <span className="hero-scroll-cue-dot" />
                    </span>
                    <span className="hero-scroll-cue-chevron" aria-hidden="true">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none">
                        <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="hero-preview" className="relative min-h-[24rem] scroll-mt-24">
          <div className="surface-panel relative overflow-hidden rounded-[2.25rem] p-5 md:p-6">
            <div className="absolute inset-x-12 top-0 h-14 rounded-full bg-gradient-to-r from-[rgba(67,97,255,0.05)] via-[rgba(252,253,255,0.3)] to-[rgba(152,165,255,0.05)] blur-3xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-muted)]">
              <div className="flex flex-wrap items-center gap-5">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-stay)]" />
                  {legendStay}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--chart-transition)]" />
                  {legendNext}
                </span>
              </div>
              <span className="inline-flex items-center rounded-full border border-[rgba(63,94,255,0.18)] bg-[rgba(238,242,255,0.9)] px-3 py-1 text-[0.73rem] font-semibold tracking-[0.01em] text-[var(--accent-strong)] md:text-[0.78rem]">
                {growthBadge}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-[1fr_auto] gap-3 md:gap-4">
              <div className="min-w-0">
                <div className="relative h-[clamp(13.5rem,28vw,22rem)]">
                  <div className="absolute inset-0 grid grid-rows-5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="border-t border-dashed border-[rgba(23,24,28,0.08)]" />
                    ))}
                  </div>

                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="absolute inset-0 h-full w-full"
                    aria-hidden="true"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="hero-forecast-area" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--chart-transition)" stopOpacity="0.16" />
                        <stop offset="100%" stopColor="var(--chart-transition)" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>

                    <path d={nextAreaPath} fill="url(#hero-forecast-area)" />
                    <path d={stayPath} className="hero-line hero-line--baseline" />
                    <path d={nextPath} className="hero-line hero-line--transition" />
                  </svg>
                </div>

                <div className="mt-5 grid grid-cols-5 gap-2 border-t border-[var(--line-soft)] pt-4 text-center text-[11px] font-semibold text-[var(--text-soft)] md:text-xs">
                  {chartData.map((item) => (
                    <span key={item.year}>
                      {item.year} {axisYearSuffix}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex h-[clamp(13.5rem,28vw,22rem)] flex-col justify-between pb-1 pt-1 text-right text-[10px] font-semibold text-[var(--text-soft)] md:text-[11px]">
                {yAxisTicks.map((tick) => (
                  <span key={tick} className="whitespace-nowrap">
                    {tick} {axisMoneySuffix}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

