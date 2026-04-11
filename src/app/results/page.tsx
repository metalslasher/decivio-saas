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
  model: string;
  latency_ms: number;
  web_search_used: boolean;
  request_id: string | null;
  generated_at: string;
};

type DetailRow = {
  label: string;
  value: string;
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

  const raw = value.meta;
  const model = toString(raw.model);
  const latencyMs = toNumber(raw.latency_ms);
  const generatedAt = toString(raw.generated_at);
  const requestId = raw.request_id === null ? null : toString(raw.request_id);
  const webSearchUsed = typeof raw.web_search_used === "boolean" ? raw.web_search_used : null;

  if (model === null || latencyMs === null || generatedAt === null || webSearchUsed === null) {
    return null;
  }

  return {
    model,
    latency_ms: latencyMs,
    web_search_used: webSearchUsed,
    request_id: requestId,
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
      return "Remote / міжнародний ринок";
    case "abroad":
      return "Локальна робота за кордоном";
    default:
      return market;
  }
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

function verdictClasses(verdictLabel: CareerSwitchAnalysis["narrative"]["verdict_label"]) {
  if (verdictLabel === "switch") {
    return "border-emerald-200/70 bg-emerald-50/70 text-emerald-700";
  }
  if (verdictLabel === "depends") {
    return "border-[rgba(63,94,255,0.18)] bg-[rgba(238,242,255,0.82)] text-[var(--accent-strong)]";
  }
  return "border-[rgba(24,26,32,0.1)] bg-[rgba(255,255,255,0.72)] text-[var(--text-muted)]";
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

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <article className="surface-panel rounded-[1.7rem] p-5 md:p-6">
      <p className="label-muted">{label}</p>
      <p className="mt-3 font-display text-[1.95rem] font-bold leading-[0.96] tracking-[-0.05em] text-[var(--text-strong)] md:text-[2.2rem]">
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
  sources,
  caveats
}: {
  eyebrow: string;
  title: string;
  summary: string;
  details: DetailRow[];
  confidence: string;
  sources: string[];
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
        <p>Сигнали ринку: {sources.join(", ")}</p>
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
  const createdAt = meta?.generated_at ? formatDate(meta.generated_at) : simulation.created_at ? new Date(simulation.created_at).toLocaleDateString("uk-UA") : null;
  const combinedSources = Array.from(new Set([...currentRole.sources, ...targetRole.sources])).slice(0, 6);

  const currentDetails: DetailRow[] = [
    { label: "Ваш дохід зараз", value: formatCurrency(inputs.current_income) },
    {
      label: `Орієнтир для рівня ${levelLabel(currentRole.current_level_estimate)}`,
      value: formatRange(currentRole.current_market_salary_range.low, currentRole.current_market_salary_range.high)
    },
    {
      label: "Median для Senior",
      value: formatCurrency(currentRole.senior_salary_range.median)
    },
    {
      label: `Best case (${levelLabel(currentRole.best_case_level)})`,
      value: formatCurrency(currentRole.best_case_salary_range.median)
    }
  ];

  const targetDetails: DetailRow[] = [
    {
      label: `Вхідний рівень для switcher (${levelLabel(targetRole.entry_level_for_switcher)})`,
      value: formatCurrency(targetRole.entry_salary_range.median)
    },
    {
      label: "Стартова вилка входу",
      value: formatRange(targetRole.entry_salary_range.low, targetRole.entry_salary_range.high)
    },
    {
      label: "Median для Senior",
      value: formatCurrency(targetRole.senior_salary_range.median)
    },
    {
      label: `Best case (${levelLabel(targetRole.best_case_level)})`,
      value: formatCurrency(targetRole.best_case_salary_range.median)
    }
  ];

  return (
    <section className="mx-auto max-w-6xl space-y-8 py-4 md:space-y-10 md:py-8">
      <div className="surface-panel rounded-[2.2rem] p-6 md:p-8">
        <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${verdictClasses(narrative.verdict_label)}`}>
          {narrative.verdict_badge}
        </div>
        <h1 className="page-title mt-4 max-w-5xl">{narrative.headline}</h1>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          note="Різниця між median best-case для поточної та цільової ролі."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SnapshotPanel
          eyebrow={`Поточна роль • ${currentRole.market_scope_label}`}
          title={currentRole.canonical_title}
          summary={currentRole.summary}
          details={currentDetails}
          confidence={formatConfidence(currentRole.confidence)}
          sources={currentRole.sources}
          caveats={currentRole.caveats}
        />

        <SnapshotPanel
          eyebrow={`Цільова роль • ${targetRole.market_scope_label}`}
          title={targetRole.canonical_title}
          summary={targetRole.summary}
          details={targetDetails}
          confidence={formatConfidence(targetRole.confidence)}
          sources={targetRole.sources}
          caveats={targetRole.caveats}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <article className="surface-panel rounded-[2rem] p-5 md:p-6">
          <p className="label-muted">Що означає цей висновок</p>
          <h2 className="mt-3 section-title">{comparison.better_long_term_label}</h2>
          <p className="body-copy mt-3">{comparison.interpretation}</p>

          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.52)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--line-soft)] px-4 py-3 text-sm text-[var(--text-muted)] md:px-5">
              <span>Best case для поточної ролі</span>
              <span className="text-right font-medium text-[var(--text-strong)]">
                {levelLabel(currentRole.best_case_level)} • {formatCurrency(currentRole.best_case_salary_range.median)}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-[var(--line-soft)] px-4 py-3 text-sm text-[var(--text-muted)] md:px-5">
              <span>Best case для цільової ролі</span>
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

        <article className="surface-panel rounded-[2rem] p-5 md:p-6">
          <p className="label-muted">Як формувався висновок</p>
          <h2 className="mt-3 section-title">Ринковий контекст і технічні деталі</h2>
          <div className="mt-4 space-y-3 text-[0.95rem] leading-[1.72] text-[var(--text-muted)]">
            <p>Модель: {meta?.model ?? "невідомо"}</p>
            <p>Web search: {meta?.web_search_used ? "так, увімкнено" : "ні, був fallback без пошуку"}</p>
            <p>Сигнали ринку: {combinedSources.join(", ")}</p>
            <p>{narrative.disclaimer}</p>
          </div>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TextList eyebrow="Чому саме такий висновок" title="Ключові аргументи" items={narrative.why_this_result} />
        <TextList eyebrow="Що персоналізувало відповідь" title="Як сервіс врахував саме вас" items={narrative.personalization_notes} />
      </div>

      <article className="surface-panel rounded-[2rem] p-5 md:p-7">
        <p className="label-muted">Що далі</p>
        <h2 className="mt-3 section-title">{narrative.cta_title}</h2>
        <p className="body-copy mt-3 max-w-3xl">{narrative.cta_body}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/pricing" className="btn-primary">Перейти до наступного кроку</Link>
          <Link href="/simulate" className="btn-secondary">Порахувати інший сценарій</Link>
        </div>
      </article>
    </section>
  );
}
