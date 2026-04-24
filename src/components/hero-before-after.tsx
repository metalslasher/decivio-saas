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

function HeroTrajectoryDecor() {
  return (
    <div className="hero-trajectory-decor" aria-hidden="true">
      <svg viewBox="0 0 1440 720" className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hero-trajectory-line" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="var(--accent-strong)" stopOpacity="0" />
            <stop offset="18%" stopColor="var(--accent-strong)" stopOpacity="0.22" />
            <stop offset="50%" stopColor="var(--accent-strong)" stopOpacity="0.06" />
            <stop offset="82%" stopColor="var(--accent-strong)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent-strong)" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="hero-trajectory-node" cx="50%" cy="42%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="68%" stopColor="#f5f7ff" />
            <stop offset="100%" stopColor="#e7ecff" />
          </radialGradient>
        </defs>

        <path className="hero-trajectory-orbit hero-trajectory-orbit--wide" d="M-80 470 C145 250 356 258 510 388 C684 536 820 426 980 288 C1124 164 1290 190 1520 330" />
        <path className="hero-trajectory-orbit" d="M-90 530 C164 368 342 448 500 518 C690 602 844 506 1000 372 C1162 232 1308 248 1528 420" />
        <path className="hero-trajectory-main" d="M-70 500 C170 314 340 330 500 438 C685 562 820 480 984 338 C1144 198 1298 216 1510 360" />

        <g className="hero-trajectory-chip hero-trajectory-chip--left" transform="translate(250 406)">
          <circle r="39" fill="url(#hero-trajectory-node)" />
          <circle r="38" fill="none" stroke="rgba(255,255,255,0.86)" strokeWidth="1.5" />
          <path d="M-11-5v-6a6 6 0 0 1 6-6h10a6 6 0 0 1 6 6v6" className="hero-trajectory-icon" />
          <path d="M-20-3h40v25a5 5 0 0 1-5 5h-30a5 5 0 0 1-5-5V-3Z" className="hero-trajectory-icon" />
          <path d="M-20 8h40M0 5v8" className="hero-trajectory-icon" />
        </g>

        <g className="hero-trajectory-chip hero-trajectory-chip--right-top" transform="translate(1190 250)">
          <circle r="39" fill="url(#hero-trajectory-node)" />
          <circle r="38" fill="none" stroke="rgba(255,255,255,0.86)" strokeWidth="1.5" />
          <path d="M0 24a24 24 0 1 0-24-24A24 24 0 0 0 0 24Z" className="hero-trajectory-icon" />
          <path d="M0 12a12 12 0 1 0-12-12A12 12 0 0 0 0 12Z" className="hero-trajectory-icon" />
          <path d="M0 0 17-17M13-17h4v4" className="hero-trajectory-icon" />
        </g>

        <g className="hero-trajectory-chip hero-trajectory-chip--right-bottom" transform="translate(1138 500)">
          <circle r="39" fill="url(#hero-trajectory-node)" />
          <circle r="38" fill="none" stroke="rgba(255,255,255,0.86)" strokeWidth="1.5" />
          <path d="M-14 19h28M-9 28h18M0-28a25 25 0 0 0-15 44c4 3 5 6 5 12h20c0-6 1-9 5-12A25 25 0 0 0 0-28Z" className="hero-trajectory-icon" />
        </g>

        {Array.from({ length: 22 }).map((_, index) => (
          <circle
            key={index}
            cx={120 + index * 58}
            cy={index % 2 === 0 ? 304 + (index % 5) * 18 : 456 - (index % 4) * 16}
            r={index % 3 === 0 ? 3.2 : 2.2}
            className="hero-trajectory-dot"
          />
        ))}
      </svg>
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
    <section className="relative overflow-hidden pt-2 md:pt-4">
      <div className="pointer-events-none absolute -left-24 top-10 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(74,108,255,0.10)_0%,rgba(74,108,255,0.05)_36%,transparent_72%)]" />
      <div className="pointer-events-none absolute -right-20 top-4 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(152,165,255,0.08)_0%,rgba(152,165,255,0.04)_36%,transparent_72%)]" />
      <HeroTrajectoryDecor />

      <div className="space-y-8 md:space-y-10">
        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-6rem)] max-w-[64rem] items-center justify-center md:min-h-[calc(100svh-7rem)]">
          <div className="flex w-full max-w-[60rem] flex-col items-center space-y-6 text-center sm:space-y-7 md:-translate-y-8 lg:-translate-y-10">
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

