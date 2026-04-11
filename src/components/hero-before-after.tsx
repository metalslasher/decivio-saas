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

const heroHeadlines = [
  "\u041f\u043e\u0431\u0430\u0447\u0442\u0435, \u044f\u043a \u0437\u043c\u0456\u043d\u0438\u0442\u044c\u0441\u044f \u0432\u0430\u0448 \u0434\u043e\u0445\u0456\u0434 \u043f\u0456\u0441\u043b\u044f \u0437\u043c\u0456\u043d\u0438 \u043a\u0430\u0440\u2019\u0454\u0440\u0438",
  "\u041f\u043e\u0440\u0456\u0432\u043d\u044f\u0439\u0442\u0435 \u0441\u0446\u0435\u043d\u0430\u0440\u0456\u0457 \u0442\u0430 \u043e\u0431\u0435\u0440\u0456\u0442\u044c \u043d\u0430\u0439\u0432\u0438\u0433\u0456\u0434\u043d\u0456\u0448\u0438\u0439",
  "\u041e\u0442\u0440\u0438\u043c\u0430\u0439\u0442\u0435 \u0447\u0456\u0442\u043a\u0438\u0439 \u043f\u043b\u0430\u043d \u043f\u0435\u0440\u0435\u0445\u043e\u0434\u0443",
  "\u041f\u043e\u0431\u0443\u0434\u0443\u0439\u0442\u0435 \u0448\u043b\u044f\u0445 \u0434\u043e \u043f\u0435\u0440\u0448\u043e\u0433\u043e \u043e\u0444\u0435\u0440\u0443"
] as const;

const subheadline =
  "\u0417\u0440\u043e\u0437\u0443\u043c\u0456\u0439\u0442\u0435, \u0447\u0438 \u0432\u0430\u0440\u0442\u043e \u043c\u0456\u043d\u044f\u0442\u0438 \u043d\u0430\u043f\u0440\u044f\u043c \u0441\u0430\u043c\u0435 \u0437\u0430\u0440\u0430\u0437, \u044f\u043a\u0438\u0439 \u0441\u0446\u0435\u043d\u0430\u0440\u0456\u0439 \u0432\u0438\u0433\u0456\u0434\u043d\u0456\u0448\u0438\u0439 \u0456 \u044f\u043a \u0440\u0443\u0445\u0430\u0442\u0438\u0441\u044f \u0434\u0430\u043b\u0456 \u0431\u0435\u0437 \u0437\u0430\u0439\u0432\u0438\u0445 \u0437\u0434\u043e\u0433\u0430\u0434\u043e\u043a.";

const ctaLabels = [
  "\u041f\u043e\u0447\u0430\u0442\u0438 \u0430\u043d\u0430\u043b\u0456\u0437 \u043a\u0430\u0440\u2019\u0454\u0440\u0438",
  "\u0420\u043e\u0437\u0440\u0430\u0445\u0443\u0432\u0430\u0442\u0438 \u0441\u0446\u0435\u043d\u0430\u0440\u0456\u0439",
  "\u0417\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u0438 \u0441\u0438\u043c\u0443\u043b\u044f\u0446\u0456\u044e"
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

export function HeroBeforeAfter() {
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [ctaIndex, setCtaIndex] = useState(0);
  const activeHeadline = heroHeadlines[headlineIndex];

  useEffect(() => {
    if (!isDeleting && typedText === activeHeadline) {
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
        isDeleting ? activeHeadline.slice(0, Math.max(0, prev.length - 1)) : activeHeadline.slice(0, prev.length + 1)
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
    <section className="relative pt-4 md:pt-8">
      <div className="pointer-events-none absolute -left-24 top-10 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(74,108,255,0.10)_0%,rgba(74,108,255,0.05)_36%,transparent_72%)]" />
      <div className="pointer-events-none absolute -right-20 top-4 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(152,165,255,0.08)_0%,rgba(152,165,255,0.04)_36%,transparent_72%)]" />

      <div className="space-y-8 md:space-y-10">
        <div className="mx-auto max-w-[58rem] space-y-5 text-center">
          <h1 className="mx-auto min-h-[7.35rem] max-w-[17ch] text-balance font-display text-[2.32rem] font-bold leading-[0.91] tracking-[-0.055em] text-[var(--text-strong)] md:min-h-[10.8rem] md:max-w-[20ch] md:text-[3.9rem]">
            {typedText}
            <span className="hero-caret ml-1 text-[var(--accent-strong)]" aria-hidden="true">
              |
            </span>
          </h1>

          <p className="mx-auto max-w-[46rem] text-[0.97rem] leading-[1.72] text-[var(--text-muted)] md:text-[1.05rem]">
            {subheadline}
          </p>

          <div className="flex justify-center">
            <div className="w-full max-w-[22rem] sm:w-auto sm:max-w-none">
              <div className="flex flex-col items-center gap-2">
                <Link
                  href="/simulate"
                  className="btn-primary w-full justify-center gap-2.5 px-6 py-3.5 text-[1.03rem] font-extrabold sm:min-w-[15rem] sm:w-auto sm:px-7"
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
                <span className="text-[0.84rem] font-medium text-[var(--text-soft)] md:text-[0.9rem]">{ctaMeta}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative min-h-[24rem]">
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

