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
const chartCurveInset = 22;

type HeroHeadlineSegment = {
  text: string;
  accent?: boolean;
};

const heroHeadlineSegments = [
  { text: "Отримайте " },
  { text: "покроковий план", accent: true },
  { text: " зміни професії" }
] as const satisfies readonly HeroHeadlineSegment[];

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

const nextPoints = chartData.map((item, index) => toChartPoint(item.next, index, chartData.length));
const nextPath = buildSmoothPath(nextPoints);
const nextAreaPath = buildSmoothAreaPath(nextPoints);

const horizonYears = chartData.length;
const stayLastValue = chartData[chartData.length - 1]?.stay ?? 0;
const nextLastValue = chartData[chartData.length - 1]?.next ?? 0;
const growthPercent = stayLastValue > 0 ? Math.round(((nextLastValue - stayLastValue) / stayLastValue) * 100) : 0;

const finalForecastPoint = nextPoints[nextPoints.length - 1];

function renderHeadlineSegments(segments: readonly HeroHeadlineSegment[]) {
  return segments.map((segment, index) => {
    return (
      <span key={`${index}-${segment.text}`} className={segment.accent ? "text-warm" : undefined}>
        {segment.text}
      </span>
    );
  });
}

function HeroForecastCard() {
  return (
    <div id="hero-preview" className="hero-forecast-card">
      <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[rgba(67,97,255,0.12)] blur-3xl" />
      <div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-[rgba(152,165,255,0.14)] blur-3xl" />

      <div className="relative z-10 flex h-full min-h-[16.5rem] flex-col justify-between p-3.5 sm:min-h-[23rem] sm:p-5 md:p-6 lg:min-h-[24rem]">
        <div className="flex items-start justify-between gap-3">
          <div className="hero-career-pill">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(238,242,255,0.94)] text-[var(--accent-strong)]">
              <svg viewBox="0 0 24 24" className="h-[1.125rem] w-[1.125rem] fill-none" aria-hidden="true">
                <path d="M4 16l5-5 3 3 7-8M15 6h4v4" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block text-[0.68rem] font-semibold text-[rgba(102,112,133,0.78)]">Ваша наступна кар’єра</span>
              <span className="block truncate text-[0.86rem] font-extrabold text-[var(--text-strong)]">DevOps Engineer</span>
            </span>
          </div>

          <div className="hero-growth-pill">
            <span className="block text-[1.8rem] font-extrabold leading-none text-[#28b86f]">+{growthPercent}%</span>
            <span className="mt-1 block max-w-[5.5rem] text-[0.68rem] font-semibold leading-[1.16] text-[rgba(92,103,128,0.9)]">
              до доходу за {horizonYears} років
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
  const [ctaIndex, setCtaIndex] = useState(0);
  const headline = renderHeadlineSegments(heroHeadlineSegments);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCtaIndex((prev) => (prev + 1) % ctaLabels.length);
    }, 2800);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <section className="relative overflow-hidden pt-3 md:pt-5">
      <div className="pointer-events-none absolute -left-24 top-8 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(74,108,255,0.11)_0%,rgba(74,108,255,0.05)_36%,transparent_72%)]" />
      <div className="pointer-events-none absolute -right-28 top-2 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(152,165,255,0.1)_0%,rgba(152,165,255,0.04)_38%,transparent_72%)]" />

      <div className="mx-auto grid max-w-[78rem] items-center gap-8 py-8 md:py-10 lg:min-h-[calc(100svh-7rem)] lg:grid-cols-2 lg:gap-8 xl:gap-12">
        <div className="relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left">
          <h1 className="max-w-[12.5ch] font-display text-[2.28rem] font-extrabold leading-[0.96] tracking-normal text-[var(--text-strong)] sm:max-w-[13.5ch] sm:text-[2.85rem] md:text-[3.15rem] lg:max-w-[36rem] lg:text-[2.85rem] xl:max-w-[39rem] xl:text-[3.05rem]">
            {headline}
          </h1>

          <p className="mt-6 max-w-[21rem] text-balance text-[1rem] font-medium leading-[1.66] text-[rgba(92,103,128,0.94)] sm:max-w-[30rem] sm:text-[1.08rem] md:max-w-[34rem] md:text-[1.16rem] md:leading-[1.62]">
            {subheadline}
          </p>

          <div className="mt-7 flex w-full max-w-[18rem] flex-col items-center gap-3.5 sm:max-w-[22rem] lg:items-start">
            <Link href="/simulate" className="hero-main-cta w-full sm:w-auto">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--accent-strong)] shadow-[0_10px_24px_-18px_rgba(22,29,43,0.26)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none" aria-hidden="true">
                  <path d="M4 16l5-5 3 3 8-8M15 6h5v5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="transition-opacity duration-200">{ctaLabels[ctaIndex]}</span>
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

        <div className="relative z-10 mx-auto w-full max-w-[21.5rem] sm:max-w-[38rem] lg:max-w-none">
          <HeroForecastCard />
        </div>
      </div>
    </section>
  );
}

