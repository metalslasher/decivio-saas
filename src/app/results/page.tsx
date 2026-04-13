import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  validateCareerSwitchAnalysis,
  type CareerSwitchAnalysis,
  type EnglishLevel,
  type ExperienceLevel,
  type TargetMarket,
  type TransitionPriority
} from "@/lib/career-switch-analysis";
import { getSupabaseAdminClient } from "@/lib/db/supabase";
import { GUEST_USER_COOKIE_NAME } from "@/lib/guest-session";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = createMetadata({
  title: "Результат",
  description: "Персоналізований результат симуляції зміни кар'єри.",
  path: "/results",
  noIndex: true
});

type SearchParams = {
  simulationId?: string | string[];
};

type ResultsPageProps = {
  searchParams?: SearchParams;
};

type SimulationInputs = {
  current_income: number;
  current_role: string;
  current_experience_years: number;
  target_role: string;
  experience_level: ExperienceLevel;
  english_level: EnglishLevel;
  target_market: TargetMarket;
  transition_priority: TransitionPriority;
};

type AnalysisMeta = {
  generated_at: string;
};

type DetailRow = {
  label: string;
  value: string;
};

type RiskLevel = CareerSwitchAnalysis["guidance"]["risk_assessment"]["level"];
type MarketSearchLink = {
  title: string;
  description: string;
  href: string;
  sourceLabel: string;
};

const currencyFormatter = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function normalizeExperienceLevel(value: unknown): ExperienceLevel | null {
  return value === "none" || value === "basic" || value === "practical" ? value : null;
}

function normalizeEnglishLevel(value: unknown): EnglishLevel | null {
  return value === "basic" || value === "intermediate" || value === "upper_intermediate" || value === "advanced" ? value : null;
}

function normalizeTargetMarket(value: unknown): TargetMarket | null {
  return value === "ukraine" || value === "remote" || value === "abroad" ? value : null;
}

function normalizeTransitionPriority(value: unknown): TransitionPriority | null {
  return value === "speed" || value === "income" ? value : null;
}

function normalizeInputs(value: unknown): SimulationInputs | null {
  if (!isRecord(value)) {
    return null;
  }

  const currentIncome = toNumber(value.current_income);
  const currentRole = toString(value.current_role);
  const currentExperienceYears = toNumber(value.current_experience_years);
  const targetRole = toString(value.target_role);
  const experienceLevel = normalizeExperienceLevel(value.experience_level);
  const englishLevel = normalizeEnglishLevel(value.english_level);
  const targetMarket = normalizeTargetMarket(value.target_market);
  const transitionPriority = normalizeTransitionPriority(value.transition_priority);

  if (
    currentIncome === null ||
    currentRole === null ||
    currentExperienceYears === null ||
    targetRole === null ||
    experienceLevel === null ||
    englishLevel === null ||
    targetMarket === null ||
    transitionPriority === null
  ) {
    return null;
  }

  return {
    current_income: currentIncome,
    current_role: currentRole,
    current_experience_years: currentExperienceYears,
    target_role: targetRole,
    experience_level: experienceLevel,
    english_level: englishLevel,
    target_market: targetMarket,
    transition_priority: transitionPriority
  };
}

function extractAnalysis(value: unknown): CareerSwitchAnalysis | null {
  if (!isRecord(value) || !("analysis" in value)) {
    return null;
  }

  try {
    return validateCareerSwitchAnalysis((value as { analysis?: unknown }).analysis);
  } catch {
    return null;
  }
}

function extractMeta(value: unknown): AnalysisMeta | null {
  if (!isRecord(value) || !("meta" in value) || !isRecord(value.meta)) {
    return null;
  }

  const generatedAt = toString(value.meta.generated_at);

  if (generatedAt === null) {
    return null;
  }

  return {
    generated_at: generatedAt
  };
}

function formatCurrency(value: number) {
  return `${currencyFormatter.format(Math.round(value)).replace(/\u00A0/g, " ")} грн`;
}

function formatSignedCurrency(value: number) {
  const rounded = Math.round(value);
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}${currencyFormatter.format(Math.abs(rounded)).replace(/\u00A0/g, " ")} грн`;
}

function formatRange(low: number, high: number) {
  return `${formatCurrency(low)} - ${formatCurrency(high)}`;
}

function formatMonths(value: number) {
  return `${Math.round(value)} міс.`;
}

function formatProbability(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("uk-UA");
}

function riskLevelLabel(level: RiskLevel) {
  switch (level) {
    case "low":
      return "Низький";
    case "medium":
      return "Середній";
    case "high":
      return "Високий";
    default:
      return level;
  }
}

function riskLevelClasses(level: RiskLevel) {
  switch (level) {
    case "low":
      return "text-emerald-700";
    case "medium":
      return "text-amber-600";
    case "high":
      return "text-rose-600";
    default:
      return "text-[var(--text-strong)]";
  }
}

function levelLabel(level: "junior" | "middle" | "senior" | "lead") {
  switch (level) {
    case "junior":
      return "Junior";
    case "middle":
      return "Middle";
    case "senior":
      return "Senior";
    case "lead":
      return "Lead";
    default:
      return level;
  }
}

function englishLevelLabel(level: EnglishLevel) {
  switch (level) {
    case "basic":
      return "A1-A2";
    case "intermediate":
      return "B1";
    case "upper_intermediate":
      return "B2";
    case "advanced":
      return "C1+";
    default:
      return level;
  }
}

function targetMarketLabel(market: TargetMarket) {
  switch (market) {
    case "ukraine":
      return "Україна";
    case "remote":
      return "Віддалена робота / міжнародний ринок";
    case "abroad":
      return "Локальна робота за кордоном";
    default:
      return market;
  }
}

function targetMarketSearchHint(market: TargetMarket) {
  switch (market) {
    case "ukraine":
      return "Україна вакансії";
    case "remote":
      return "remote вакансії";
    case "abroad":
      return "relocation вакансії";
    default:
      return "вакансії";
  }
}

function buildGoogleSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function buildMarketSearchLinks(role: string, market: TargetMarket): MarketSearchLink[] {
  const marketHint = targetMarketSearchHint(market);
  const quotedRole = `"${role}"`;

  if (market === "ukraine") {
    return [
      {
        title: "DOU вакансії",
        description: `Жива видача вакансій ${role} на DOU для українського ринку.`,
        href: buildGoogleSearchUrl(`site:jobs.dou.ua/vacancies ${quotedRole} ${marketHint}`),
        sourceLabel: "DOU"
      },
      {
        title: "Djinni",
        description: `Пошук актуальних вакансій ${role} у форматі українського tech-ринку.`,
        href: buildGoogleSearchUrl(`site:djinni.co/jobs ${quotedRole} ${marketHint}`),
        sourceLabel: "Djinni"
      },
      {
        title: "Work.ua / Robota.ua",
        description: `Швидка перевірка масового попиту на ${role} в Україні.`,
        href: buildGoogleSearchUrl(`site:work.ua OR site:robota.ua ${quotedRole} ${marketHint}`),
        sourceLabel: "Work.ua / Robota.ua"
      }
    ];
  }

  if (market === "abroad") {
    return [
      {
        title: "LinkedIn Jobs",
        description: `Пошук ролей ${role} із фокусом на міжнародні компанії та релокацію.`,
        href: buildGoogleSearchUrl(`site:linkedin.com/jobs/view ${quotedRole} relocation`),
        sourceLabel: "LinkedIn"
      },
      {
        title: "DOU Relocate",
        description: `Видача вакансій ${role}, де часто трапляються міжнародні або relocation-позиції.`,
        href: buildGoogleSearchUrl(`site:relocate.dou.ua/jobs ${quotedRole}`),
        sourceLabel: "DOU Relocate"
      },
      {
        title: "Career Pages",
        description: `Прямі сторінки вакансій компаній із міжнародним наймом під ${role}.`,
        href: buildGoogleSearchUrl(`site:greenhouse.io OR site:lever.co ${quotedRole} relocation`),
        sourceLabel: "Career Pages"
      }
    ];
  }

  return [
    {
      title: "Djinni",
      description: `Жива видача remote-вакансій ${role} на tech-ринку.`,
      href: buildGoogleSearchUrl(`site:djinni.co/jobs ${quotedRole} remote`),
      sourceLabel: "Djinni"
    },
    {
      title: "DOU вакансії",
      description: `Пошук віддалених або міжнародних вакансій ${role} на DOU.`,
      href: buildGoogleSearchUrl(`site:jobs.dou.ua/vacancies ${quotedRole} remote`),
      sourceLabel: "DOU"
    },
    {
      title: "LinkedIn Jobs",
      description: `Швидкий перегляд міжнародної видачі вакансій ${role} з віддаленим форматом.`,
      href: buildGoogleSearchUrl(`site:linkedin.com/jobs/view ${quotedRole} remote`),
      sourceLabel: "LinkedIn"
    }
  ];
}

function experienceLevelLabel(level: ExperienceLevel) {
  switch (level) {
    case "none":
      return "Немає досвіду";
    case "basic":
      return "Є базові знання";
    case "practical":
      return "Є практичний досвід";
    default:
      return level;
  }
}

function transitionPriorityLabel(priority: TransitionPriority) {
  switch (priority) {
    case "speed":
      return "Швидше перейти";
    case "income":
      return "Максимізувати дохід";
    default:
      return priority;
  }
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <section className="mx-auto max-w-3xl py-12 md:py-16">
      <div className="surface-panel rounded-[2rem] p-7 text-center md:p-10">
        <h1 className="page-title mx-auto max-w-[12ch]">{title}</h1>
        <p className="lead-copy mx-auto mt-4 max-w-2xl">{description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/simulate" className="btn-primary">Запустити нову симуляцію</Link>
          <Link href="/" className="btn-secondary">На головну</Link>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  note,
  valueClassName
}: {
  label: string;
  value: string;
  note: string;
  valueClassName?: string;
}) {
  return (
    <article className="surface-panel rounded-[1.7rem] p-5 md:p-6">
      <p className="label-muted">{label}</p>
      <p
        className={`mt-3 font-display text-[1.95rem] font-bold leading-[0.96] tracking-[-0.05em] md:text-[2.2rem] ${
          valueClassName ?? "text-[var(--text-strong)]"
        }`}
      >
        {value}
      </p>
      <p className="mt-2 text-[0.92rem] leading-[1.68] text-[var(--text-muted)]">{note}</p>
    </article>
  );
}

function DetailList({ items }: { items: DetailRow[] }) {
  return (
    <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.52)]">
      {items.map((item, index) => (
        <div
          key={`${item.label}-${index}`}
          className="flex items-start justify-between gap-4 border-b border-[var(--line-soft)] px-4 py-3 text-sm text-[var(--text-muted)] last:border-b-0 md:px-5"
        >
          <span>{item.label}</span>
          <span className="text-right font-medium text-[var(--text-strong)]">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function SnapshotPanel({
  eyebrow,
  title,
  summary,
  details,
  confidence,
  caveats
}: {
  eyebrow: string;
  title: string;
  summary: string;
  details: DetailRow[];
  confidence: string;
  caveats: string[];
}) {
  return (
    <article className="surface-panel rounded-[2rem] p-5 md:p-6">
      <p className="label-muted">{eyebrow}</p>
      <h2 className="mt-3 section-title">{title}</h2>
      <p className="body-copy mt-3">{summary}</p>
      <DetailList items={details} />
      <div className="mt-5 space-y-3 text-[0.93rem] leading-[1.68] text-[var(--text-muted)]">
        <p>Впевненість оцінки: {confidence}</p>
        <p>Важливо врахувати: {caveats.join(" ")}</p>
      </div>
    </article>
  );
}

function TextList({ title, eyebrow, items }: { title: string; eyebrow: string; items: string[] }) {
  return (
    <article className="surface-panel rounded-[2rem] p-5 md:p-6">
      <p className="label-muted">{eyebrow}</p>
      <h2 className="mt-3 section-title">{title}</h2>
      <ul className="mt-4 space-y-3 text-[0.95rem] leading-[1.72] text-[var(--text-muted)] md:text-[1rem]">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function MetaChip({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.7)] px-3 py-1.5">{children}</span>;
}

function MarketSearchCard({ item }: { item: MarketSearchLink }) {
  return (
    <article className="surface-soft rounded-[1.5rem] p-4 md:p-5">
      <div className="flex flex-wrap gap-2 text-[0.78rem] font-semibold text-[var(--text-muted)]">
        <span className="rounded-full border border-[var(--line-soft)] bg-white/80 px-3 py-1.5">{item.sourceLabel}</span>
      </div>

      <h3 className="mt-4 panel-title">{item.title}</h3>
      <p className="mt-3 text-[0.92rem] leading-[1.68] text-[var(--text-muted)]">{item.description}</p>

      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex items-center gap-2 text-[0.95rem] font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]"
      >
        <span>Відкрити живу видачу</span>
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M5 15L15 5M8 5h7v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </article>
  );
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const simulationId = getSingleParam(searchParams?.simulationId);

  if (!simulationId) {
    return (
      <EmptyState
        title="Немає даних для результату"
        description="Відкрийте сторінку результату з simulationId або пройдіть симуляцію заново, щоб отримати новий персоналізований висновок."
      />
    );
  }

  let supabase;
  try {
    supabase = getSupabaseAdminClient();
  } catch (error) {
    return (
      <EmptyState
        title="Сервер бази даних не налаштовано"
        description={error instanceof Error ? error.message : "Перевірте налаштування Supabase і повторіть спробу."}
      />
    );
  }

  const guestUserId = cookies().get(GUEST_USER_COOKIE_NAME)?.value ?? null;
  if (!guestUserId) {
    return (
      <EmptyState
        title="Цей результат доступний лише у вашій сесії"
        description="У поточній версії сервісу результати прив'язані до тимчасового guest-профілю в браузері. Запустіть симуляцію ще раз у цій сесії, щоб відкрити новий результат."
      />
    );
  }

  const { data: simulation, error: simulationError } = await supabase
    .from("simulations")
    .select("id, user_id, inputs, created_at")
    .eq("id", simulationId)
    .maybeSingle();

  if (simulationError || !simulation) {
    return (
      <EmptyState
        title="Симуляцію не знайдено"
        description="Схоже, цього результату вже немає або він недоступний у вашій поточній сесії. Запустіть симуляцію ще раз і відкрийте новий результат."
      />
    );
  }

  if (simulation.user_id !== guestUserId) {
    return (
      <EmptyState
        title="Цей результат прив'язаний до іншої сесії"
        description="У локальному режимі результати прив'язані до тимчасового профілю користувача. Запустіть новий аналіз у поточній сесії."
      />
    );
  }

  const { data: result, error: resultError } = await supabase
    .from("simulation_results")
    .select("ai_summary, created_at")
    .eq("simulation_id", simulationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (resultError || !result) {
    return (
      <EmptyState
        title="Результат ще не готовий"
        description="Симуляція збережена, але фінальний результат ще не сформований. Спробуйте відкрити сторінку ще раз через кілька секунд."
      />
    );
  }

  const inputs = normalizeInputs(simulation.inputs);
  const analysis = extractAnalysis(result.ai_summary);
  const meta = extractMeta(result.ai_summary);

  if (!inputs || !analysis) {
    return (
      <EmptyState
        title="Для цього результату бракує нових даних"
        description="Схоже, цей результат було створено на старій логіці. Запустіть аналіз ще раз, щоб отримати новий персоналізований висновок."
      />
    );
  }

  const currentRole = analysis.market_profile.current_role;
  const targetRole = analysis.market_profile.target_role;
  const comparison = analysis.market_profile.comparison;
  const narrative = analysis.narrative;
  const riskAssessment = analysis.guidance.risk_assessment;
  const createdAt = meta?.generated_at
    ? formatDate(meta.generated_at)
    : result.created_at
      ? new Date(result.created_at).toLocaleDateString("uk-UA")
      : simulation.created_at
        ? new Date(simulation.created_at).toLocaleDateString("uk-UA")
        : null;
  const marketSearchLinks = buildMarketSearchLinks(targetRole.canonical_title, inputs.target_market);

  const currentDetails: DetailRow[] = [
    { label: "Ваш дохід зараз", value: formatCurrency(inputs.current_income) },
    {
      label: `Орієнтир для рівня ${levelLabel(currentRole.current_level_estimate)}`,
      value: formatRange(currentRole.current_market_salary_range.low, currentRole.current_market_salary_range.high)
    },
    {
      label: "Типовий дохід на рівні Senior",
      value: formatCurrency(currentRole.senior_salary_range.median)
    },
    {
      label: `Потенційна стеля (${levelLabel(currentRole.best_case_level)})`,
      value: formatCurrency(currentRole.best_case_salary_range.median)
    }
  ];

  const targetDetails: DetailRow[] = [
    {
      label: `Стартовий рівень для переходу (${levelLabel(targetRole.entry_level_for_switcher)})`,
      value: formatCurrency(targetRole.entry_salary_range.median)
    },
    {
      label: "Стартова вилка входу",
      value: formatRange(targetRole.entry_salary_range.low, targetRole.entry_salary_range.high)
    },
    {
      label: "Типовий дохід на рівні Senior",
      value: formatCurrency(targetRole.senior_salary_range.median)
    },
    {
      label: `Потенційна стеля (${levelLabel(targetRole.best_case_level)})`,
      value: formatCurrency(targetRole.best_case_salary_range.median)
    }
  ];

  return (
    <section className="space-y-8 py-4 md:space-y-10 md:py-8">
      <div className="px-1 md:px-2">
        <h1 className="page-title max-w-5xl">{narrative.headline}</h1>
        <p className="lead-copy mt-4 max-w-3xl">{narrative.summary}</p>

        <div className="mt-5 flex flex-wrap gap-3 text-[0.9rem] leading-[1.6] text-[var(--text-soft)]">
          <MetaChip>Поточна роль: {currentRole.canonical_title}</MetaChip>
          <MetaChip>Цільова роль: {targetRole.canonical_title}</MetaChip>
          <MetaChip>Англійська: {englishLevelLabel(inputs.english_level)}</MetaChip>
          <MetaChip>Ринок: {targetMarketLabel(inputs.target_market)}</MetaChip>
          <MetaChip>Пріоритет: {transitionPriorityLabel(inputs.transition_priority)}</MetaChip>
          <MetaChip>Досвід у цілі: {experienceLevelLabel(inputs.experience_level)}</MetaChip>
          {createdAt ? <MetaChip>Дата аналізу: {createdAt}</MetaChip> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Ваш дохід зараз"
          value={formatCurrency(inputs.current_income)}
          note="Фактична точка, від якої формується висновок."
        />
        <MetricCard
          label="Шанс увійти за 12 міс."
          value={formatProbability(targetRole.probability_of_getting_job_within_12_months)}
          note="Оцінка реалістичності входу в цільову роль за вашим профілем."
        />
        <MetricCard
          label="Базовий час до оферу"
          value={formatMonths(targetRole.time_to_first_offer_months.base)}
          note="Не гарантія, а орієнтир для поточного ринку й вашого профілю."
        />
        <MetricCard
          label="Різниця в стелі ролей"
          value={formatSignedCurrency(comparison.ceiling_gap_median)}
          note="Різниця між потенційною стелею поточної та цільової ролі."
        />
        <MetricCard
          label="Ризик переходу"
          value={riskLevelLabel(riskAssessment.level)}
          note={riskAssessment.summary}
          valueClassName={riskLevelClasses(riskAssessment.level)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SnapshotPanel
          eyebrow={`Поточна роль • ${currentRole.market_scope_label}`}
          title={currentRole.canonical_title}
          summary={currentRole.summary}
          details={currentDetails}
          confidence={formatConfidence(currentRole.confidence)}
          caveats={currentRole.caveats}
        />

        <SnapshotPanel
          eyebrow={`Цільова роль • ${targetRole.market_scope_label}`}
          title={targetRole.canonical_title}
          summary={targetRole.summary}
          details={targetDetails}
          confidence={formatConfidence(targetRole.confidence)}
          caveats={targetRole.caveats}
        />
      </div>

      <article className="surface-panel rounded-[2rem] p-5 md:p-6">
        <p className="label-muted">Що означає цей висновок</p>
        <h2 className="mt-3 section-title">{comparison.better_long_term_label}</h2>
        <p className="body-copy mt-3">{comparison.interpretation}</p>

        <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.52)]">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--line-soft)] px-4 py-3 text-sm text-[var(--text-muted)] md:px-5">
            <span>Потенційна стеля поточної ролі</span>
            <span className="text-right font-medium text-[var(--text-strong)]">
              {levelLabel(currentRole.best_case_level)} • {formatCurrency(currentRole.best_case_salary_range.median)}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4 border-b border-[var(--line-soft)] px-4 py-3 text-sm text-[var(--text-muted)] md:px-5">
            <span>Потенційна стеля цільової ролі</span>
            <span className="text-right font-medium text-[var(--text-strong)]">
              {levelLabel(targetRole.best_case_level)} • {formatCurrency(targetRole.best_case_salary_range.median)}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm text-[var(--text-muted)] md:px-5">
            <span>Різниця між стелями</span>
            <span className="text-right font-medium text-[var(--text-strong)]">{formatSignedCurrency(comparison.ceiling_gap_median)}</span>
          </div>
        </div>
      </article>

      <div className="grid gap-4 lg:grid-cols-2">
        <TextList eyebrow="Чому саме такий висновок" title="Ключові аргументи" items={narrative.why_this_result} />
        <TextList eyebrow="Що персоналізувало відповідь" title="Як сервіс врахував саме вас" items={narrative.personalization_notes} />
      </div>

      <article className="surface-panel rounded-[2rem] p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label-muted">Ринок це підтверджує</p>
            <h2 className="mt-3 section-title">Де зараз дивитися актуальні вакансії</h2>
          </div>
          <span className="rounded-full border border-[rgba(63,94,255,0.18)] bg-[rgba(238,242,255,0.88)] px-3 py-1.5 text-[0.82rem] font-semibold text-[var(--accent-strong)]">
            Живі джерела під ваш сценарій
          </span>
        </div>

        <p className="body-copy mt-3 max-w-3xl">
          Тут немає випадкових назв вакансій або компаній. Кожне посилання відкриває живу видачу під вашу цільову роль і ринок, щоб ви одразу бачили реальний попит.
        </p>

        <div className="mt-5 grid gap-3 xl:grid-cols-3">
          {marketSearchLinks.map((item) => (
            <MarketSearchCard key={`${item.sourceLabel}-${item.title}`} item={item} />
          ))}
        </div>
      </article>

      <article className="surface-panel rounded-[2rem] p-5 md:p-7">
        <p className="label-muted">Що далі</p>
        <h2 className="mt-3 section-title">{narrative.cta_title}</h2>
        <p className="body-copy mt-3 max-w-3xl">{narrative.cta_body}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/pricing" className="btn-primary">Перейти до наступного кроку</Link>
        </div>
      </article>
    </section>
  );
}
