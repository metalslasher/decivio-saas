"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const chartWidth = 560;
const chartHeight = 250;
const chartPadding = 22;
const maxValue = 100;
const chartCurveInset = 22;

type HeroHeadlineSegment = {
  text: string;
  accent?: boolean;
};

type HeroScenario = {
  fullText: string;
  segments: readonly HeroHeadlineSegment[];
  role: string;
  nextValues: readonly number[];
};

const chartData = [
  { year: "1", stay: 34 },
  { year: "2", stay: 38 },
  { year: "3", stay: 42 },
  { year: "4", stay: 46 },
  { year: "5", stay: 51 }
] as const;

const heroScenarios = [
  {
    fullText: "Отримайте покроковий план зміни професії",
    segments: [
      { text: "Отримайте " },
      { text: "покроковий план", accent: true },
      { text: " зміни професії" }
    ],
    role: "DevOps Engineer",
    nextValues: [28, 45, 61, 78, 93]
  },
  {
    fullText: "Оцініть свій дохід у новій кар’єрі ще до старту",
    segments: [
      { text: "Оцініть свій " },
      { text: "дохід", accent: true },
      { text: " у новій кар’єрі ще до старту" }
    ],
    role: "Data Analyst",
    nextValues: [31, 47, 60, 73, 86]
  },
  {
    fullText: "Порівняйте напрямки та оберіть найвигідніший",
    segments: [
      { text: "Порівняйте напрямки та оберіть " },
      { text: "найвигідніший", accent: true }
    ],
    role: "Product Manager",
    nextValues: [30, 43, 56, 68, 81]
  },
  {
    fullText: "Знайдіть роботу, яка дійсно вам підходить",
    segments: [
      { text: "Знайдіть роботу, яка " },
      { text: "дійсно вам підходить", accent: true }
    ],
    role: "UX/UI Designer",
    nextValues: [29, 42, 54, 66, 79]
  }
] as const satisfies readonly HeroScenario[];

const subheadline =
  "Усе для переходу в нову кар’єру з прогнозованим результатом і зрозумілим планом дій.";

const ctaLabels = [
  "Почати аналіз кар’єри",
  "Почати зміну кар’єри"
] as const;
const ctaMeta = "\u0411\u0435\u0437\u043a\u043e\u0448\u0442\u043e\u0432\u043d\u043e \u2022 2\u20133 \u0445\u0432\u0438\u043b\u0438\u043d\u0438";
const axisYearSuffix = "\u0440\u0456\u043a";

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

const stayLastValue = chartData[chartData.length - 1]?.stay ?? 0;

function getForecastPoints(scenario: HeroScenario) {
  return scenario.nextValues.map((value, index) => toChartPoint(value, index, chartData.length));
}

function getGrowthPercent(scenario: HeroScenario) {
  const nextLastValue = scenario.nextValues[scenario.nextValues.length - 1] ?? 0;
  return stayLastValue > 0 ? Math.round(((nextLastValue - stayLastValue) / stayLastValue) * 100) : 0;
}

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

function HeroForecastCard({ scenario }: { scenario: HeroScenario }) {
  const nextPoints = getForecastPoints(scenario);
  const nextPath = buildSmoothPath(nextPoints);
  const nextAreaPath = buildSmoothAreaPath(nextPoints);
  const growthPercent = getGrowthPercent(scenario);
  const finalForecastPoint = nextPoints[nextPoints.length - 1];

  return (
    <div id="hero-preview" className="hero-forecast-card">
      <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[rgba(67,97,255,0.12)] blur-3xl" />
      <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[rgba(152,165,255,0.14)] blur-3xl" />

      <div className="relative z-10 flex h-full min-h-[16.5rem] flex-col justify-between p-3.5 sm:min-h-[23rem] sm:p-5 md:p-6 lg:min-h-[24rem]">
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
              <span className="block text-[0.68rem] font-semibold text-[rgba(102,112,133,0.78)]">Ваша наступна кар’єра</span>
              <span className="block truncate text-[0.86rem] font-extrabold text-[var(--text-strong)]">{scenario.role}</span>
            </span>
          </div>

          <div className="hero-growth-pill">
            <span className="block text-[1.8rem] font-extrabold leading-none text-[#28b86f]">+{growthPercent}%</span>
            <span className="mt-1 block max-w-[5.5rem] text-[0.68rem] font-semibold leading-[1.16] text-[rgba(92,103,128,0.9)]">
              до доходу
            </span>
          </div>
        </div>

        <div className="relative mt-3 h-[10rem] sm:mt-4 sm:h-[15rem] md:h-[16rem]">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="hero-forecast-svg" aria-hidden="true" preserveAspectRatio="none">
            <defs>
              <linearGradient id="hero-forecast-card-area" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--chart-transition)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--chart-transition)" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {nextPoints.map((point, index) => (
              <line
                key={`guide-${chartData[index].year}`}
                x1={point.x}
                x2={point.x}
                y1={point.y + 8}
                y2={chartHeight - chartPadding}
                className="hero-forecast-guide"
              />
            ))}

            <path d={nextAreaPath} className="hero-forecast-area" />
            <path d={nextPath} className="hero-forecast-line" pathLength={1} />
            {finalForecastPoint ? (
              <circle cx={finalForecastPoint.x} cy={finalForecastPoint.y} r="17" className="hero-forecast-end-glow" />
            ) : null}
            {nextPoints.map((point, index) => (
              <circle
                key={`point-${chartData[index].year}`}
                cx={point.x}
                cy={point.y}
                r={index === nextPoints.length - 1 ? 8 : 4.6}
                className={index === nextPoints.length - 1 ? "hero-forecast-dot hero-forecast-dot--end" : "hero-forecast-dot"}
              />
            ))}
          </svg>

          <div className="hero-forecast-labels">
            {chartData.map((item) => (
              <span key={item.year}>
                {item.year} {axisYearSuffix}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroBeforeAfter() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [typedText, setTypedText] = useState<string>(heroScenarios[0].fullText);
  const [isDeleting, setIsDeleting] = useState(false);
  const [ctaIndex, setCtaIndex] = useState(0);
  const activeScenario = heroScenarios[scenarioIndex];
  const typedHeadline = renderTypedHeadline(activeScenario.segments, typedText.length);

  useEffect(() => {
    if (!isDeleting && typedText === activeScenario.fullText) {
      const pauseTimer = setTimeout(() => setIsDeleting(true), 1500);
      return () => clearTimeout(pauseTimer);
    }

    if (isDeleting && typedText.length === 0) {
      setIsDeleting(false);
      setScenarioIndex((prev) => (prev + 1) % heroScenarios.length);
      return;
    }

    const speed = isDeleting ? 26 : 44;
    const typingTimer = setTimeout(() => {
      setTypedText((prev) =>
        isDeleting
          ? activeScenario.fullText.slice(0, Math.max(0, prev.length - 1))
          : activeScenario.fullText.slice(0, prev.length + 1)
      );
    }, speed);

    return () => clearTimeout(typingTimer);
  }, [activeScenario, isDeleting, typedText]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCtaIndex((prev) => (prev + 1) % ctaLabels.length);
    }, 2800);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <section className="relative pt-0 md:pt-1 lg:pt-0">
      <div className="mx-auto grid max-w-[80rem] items-center gap-8 py-7 pb-10 md:gap-8 md:py-8 md:pb-10 lg:min-h-[clamp(30rem,calc(100svh-34rem),34rem)] lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 lg:py-3 xl:gap-12">
        <div className="relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left">
          <h1 className="min-h-[8.9rem] max-w-[12.5ch] font-display text-[2.28rem] font-extrabold leading-[0.96] tracking-normal text-[var(--text-strong)] sm:min-h-[8.4rem] sm:max-w-[13.5ch] sm:text-[2.85rem] md:min-h-[9.2rem] md:text-[3.15rem] lg:min-h-[8.4rem] lg:max-w-[36rem] lg:text-[2.85rem] xl:min-h-[8.8rem] xl:max-w-[39rem] xl:text-[3.05rem]">
            {typedHeadline}
            <span className="hero-caret ml-1 text-[var(--accent-strong)]" aria-hidden="true">
              |
            </span>
          </h1>

          <p className="mt-6 max-w-[21rem] text-balance text-[1rem] font-medium leading-[1.66] text-[rgba(92,103,128,0.94)] sm:max-w-[30rem] sm:text-[1.08rem] md:max-w-[34rem] md:text-[1.16rem] md:leading-[1.62]">
            {subheadline}
          </p>

          <div className="mt-7 flex w-full max-w-[18rem] flex-col items-center gap-3.5 sm:max-w-[22rem] lg:items-start">
            <Link href="/simulate" className="hero-main-cta w-full sm:w-auto">
              <span className="hero-main-cta-label transition-opacity duration-200">{ctaLabels[ctaIndex]}</span>
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

        <div className="relative z-10 mx-auto w-full max-w-[18.75rem] sm:max-w-[38rem] lg:max-w-none">
          <HeroForecastCard key={activeScenario.role} scenario={activeScenario} />
        </div>
      </div>
    </section>
  );
}

