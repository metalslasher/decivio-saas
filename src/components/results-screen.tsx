"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildAuthorizedHeaders, getAccessTokenFromSupabase } from "@/lib/auth-session-client";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import type { DetailRow, ResultsMetricTone, SimulationResultsPayload } from "@/lib/simulation-results-payload";

type ResultsScreenProps = {
  simulationId: string | null;
};

type RequestState =
  | { status: "loading" }
  | { status: "error"; title: string; description: string }
  | { status: "ready"; payload: SimulationResultsPayload; isAuthenticated: boolean };

const decivioNextSteps = [
  {
    title: "Vacancy Fit",
    description: "Вставляєте конкретну вакансію і бачите, чи варто подаватися, де ризики і що підготувати."
  },
  {
    title: "Resume-правки",
    description: "Отримуєте акценти, які варто змінити в резюме саме під цю роль."
  },
  {
    title: "Salary angle",
    description: "Формуєте зарплатну позицію під вимоги ролі, а не просто називаєте бажану суму."
  },
  {
    title: "Talking points",
    description: "Готуєте тези для рекрутера і hiring manager на базі вашого профілю й вакансії."
  },
  {
    title: "Повторні перевірки",
    description: "Повертаєтесь із новими вакансіями й бачите, які ролі справді варто пріоритезувати."
  }
] as const;

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <section className="mx-auto max-w-3xl py-12 md:py-16">
      <div className="surface-panel rounded-[2rem] p-7 text-center md:p-10">
        <h1 className="page-title mx-auto max-w-[12ch]">{title}</h1>
        <p className="lead-copy mx-auto mt-4 max-w-2xl">{description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/simulate" className="btn-primary">
            Пройти оцінку
          </Link>
          <Link href="/" className="btn-secondary">
            На головну
          </Link>
        </div>
      </div>
    </section>
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
}: SimulationResultsPayload["currentSnapshot"]) {
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

function metricToneClass(tone: ResultsMetricTone) {
  switch (tone) {
    case "success":
      return "text-[var(--accent-strong)]";
    case "warning":
      return "text-[var(--danger-strong)]";
    case "danger":
      return "text-[var(--danger-strong)]";
    default:
      return "text-[var(--text-strong)]";
  }
}

function MetricCard({
  label,
  value,
  note,
  tone
}: SimulationResultsPayload["metrics"][number]) {
  return (
    <article className="surface-panel rounded-[1.7rem] p-5 md:p-6">
      <p className="label-muted">{label}</p>
      <p className={`mt-3 font-display text-[1.95rem] font-bold leading-[0.98] tracking-normal md:text-[2.2rem] ${metricToneClass(tone)}`}>{value}</p>
      <p className="mt-2 text-[0.92rem] leading-[1.68] text-[var(--text-muted)]">{note}</p>
    </article>
  );
}

function DecivioNextStepsPanel({
  cta,
  isAuthenticated
}: {
  cta: SimulationResultsPayload["cta"];
  isAuthenticated: boolean;
}) {
  return (
    <article className="surface-panel rounded-[2rem] p-5 md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <p className="label-muted">Що відкриється далі</p>
          <h2 className="mt-3 section-title">{cta.title}</h2>
          <p className="body-copy mt-3">
            {isAuthenticated
              ? "Ваш результат уже збережено. Після оплати відкривається Vacancy Fit: аналіз конкретних вакансій, resume-правки й зарплатні аргументи."
              : "Висновок уже показав стартову картину. На тарифах можна відкрити практичну перевірку вакансій і підготовку подачі без хаосу."}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-3">
          <Link href="/pricing" className="btn-primary">
            Перейти до тарифів
          </Link>
          {isAuthenticated ? (
            <Link href="/dashboard?view=vacancies" className="btn-secondary">
              Перевірити вакансію
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {decivioNextSteps.map((item, index) => (
          <div key={item.title} className="rounded-[1.2rem] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.58)] p-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[0.78rem] font-bold text-[var(--accent-strong)]">
              {index + 1}
            </span>
            <h3 className="mt-3 text-[0.98rem] font-semibold leading-[1.35] text-[var(--text-strong)]">{item.title}</h3>
            <p className="mt-2 text-[0.88rem] leading-[1.58] text-[var(--text-muted)]">{item.description}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function ResultsSkeleton() {
  return (
    <section className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="h-32 animate-pulse rounded-[2rem] bg-[rgba(255,255,255,0.62)]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="surface-panel h-28 animate-pulse rounded-[1.7rem]" />
        <div className="surface-panel h-28 animate-pulse rounded-[1.7rem]" />
        <div className="surface-panel h-28 animate-pulse rounded-[1.7rem]" />
        <div className="surface-panel h-28 animate-pulse rounded-[1.7rem]" />
        <div className="surface-panel h-28 animate-pulse rounded-[1.7rem]" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-panel h-80 animate-pulse rounded-[2rem]" />
        <div className="surface-panel h-80 animate-pulse rounded-[2rem]" />
      </div>
      <div className="surface-panel h-72 animate-pulse rounded-[2rem]" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-panel h-72 animate-pulse rounded-[2rem]" />
        <div className="surface-panel h-72 animate-pulse rounded-[2rem]" />
      </div>
      <div className="surface-panel h-52 animate-pulse rounded-[2rem]" />
    </section>
  );
}

export function ResultsScreen({ simulationId }: ResultsScreenProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [state, setState] = useState<RequestState>(() =>
    simulationId
      ? { status: "loading" }
      : {
          status: "error",
          title: "Немає даних для результату",
          description: "Відкрийте результат з правильного посилання або пройдіть оцінку заново, щоб отримати новий персональний висновок."
        }
  );

  useEffect(() => {
    if (!simulationId) {
      return;
    }

    let isMounted = true;

    const loadResult = async () => {
      try {
        const accessToken = await getAccessTokenFromSupabase(supabase);
        const response = await fetch(`/api/simulations/${encodeURIComponent(simulationId)}`, {
          headers: buildAuthorizedHeaders(accessToken),
          cache: "no-store"
        });

        const data = (await response.json().catch(() => null)) as
          | SimulationResultsPayload
          | { title?: string; description?: string }
          | null;

        if (!isMounted) {
          return;
        }

        if (!response.ok || !data || !("headline" in data)) {
          setState({
            status: "error",
            title: data && "title" in data && data.title ? data.title : "Не вдалося відкрити результат",
            description:
              data && "description" in data && data.description
                ? data.description
                : "Спробуйте оновити сторінку або пройти оцінку ще раз."
          });
          return;
        }

        setState({
          status: "ready",
          payload: data,
          isAuthenticated: Boolean(accessToken)
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setState({
          status: "error",
          title: "Не вдалося завантажити результат",
          description: "Перевірте підключення та спробуйте ще раз."
        });
      }
    };

    void loadResult();

    return () => {
      isMounted = false;
    };
  }, [simulationId, supabase]);

  if (state.status === "loading") {
    return <ResultsSkeleton />;
  }

  if (state.status === "error") {
    return <EmptyState title={state.title} description={state.description} />;
  }

  const { payload, isAuthenticated } = state;

  return (
    <section className="space-y-8 py-4 md:space-y-10 md:py-8">
      <div className="px-1 md:px-2">
        <h1 className="page-title max-w-5xl">{payload.headline}</h1>
        <p className="lead-copy mt-4 max-w-3xl">{payload.summary}</p>

        <div className="mt-5 flex flex-wrap gap-3 text-[0.9rem] leading-[1.6] text-[var(--text-soft)]">
          {payload.metaChips.map((item) => (
            <MetaChip key={item}>{item}</MetaChip>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {payload.metrics.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SnapshotPanel {...payload.currentSnapshot} />
        <SnapshotPanel {...payload.targetSnapshot} />
      </div>

      <article className="surface-panel rounded-[2rem] p-5 md:p-6">
        <p className="label-muted">Що означає цей висновок</p>
        <h2 className="mt-3 section-title">{payload.comparison.title}</h2>
        <p className="body-copy mt-3">{payload.comparison.interpretation}</p>
        <DetailList items={payload.comparison.rows} />
      </article>

      <div className="grid gap-4 lg:grid-cols-2">
        <TextList eyebrow="Чому саме такий висновок" title="Ключові аргументи" items={payload.whyThisResult} />
        <TextList eyebrow="Що персоналізувало відповідь" title="Як сервіс врахував саме вас" items={payload.personalizationNotes} />
      </div>

      <DecivioNextStepsPanel cta={payload.cta} isAuthenticated={isAuthenticated} />
    </section>
  );
}
