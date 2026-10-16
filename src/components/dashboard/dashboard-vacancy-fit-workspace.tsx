"use client";

import { useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DashboardChip, DashboardMetricCard } from "./dashboard-primitives";
import type { DashboardSimulation, DashboardUserProfile } from "./types";
import {
  formatSignedMoney,
  mapEnglishLevelLabel,
  mapJobSearchStageLabel,
  mapTargetMarketLabel,
  riskLevelLabel,
} from "./dashboard-utils";

type VacancyFitVerdict = "apply" | "maybe" | "skip";

type VacancyFitAnalysis = {
  verdict: VacancyFitVerdict;
  fit_score: number;
  headline: string;
  summary: string;
  salary_angle: string;
  strongest_matches: string[];
  gaps_or_risks: string[];
  resume_adjustments: string[];
  interview_salary_talking_points: string[];
  next_action: string;
  caveats: string[];
};

type VacancyFitResponse = {
  analysis: VacancyFitAnalysis;
  meta: {
    model: string;
    latency_ms: number;
    generated_at: string;
    test_mode: boolean;
  };
};

function verdictLabel(value: VacancyFitVerdict) {
  switch (value) {
    case "apply":
      return "Варто подаватися";
    case "maybe":
      return "Потрібна підготовка";
    case "skip":
      return "Краще пропустити";
  }
}

function verdictTone(value: VacancyFitVerdict) {
  switch (value) {
    case "apply":
      return "success" as const;
    case "skip":
      return "gold" as const;
    case "maybe":
    default:
      return "accent" as const;
  }
}

function formatLatency(value: number) {
  if (value < 1000) {
    return `${value} мс`;
  }

  return `${(value / 1000).toFixed(1)} с`;
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="surface-panel rounded-[1.8rem] p-5 md:p-6">
      <h2 className="text-[1.22rem] font-semibold leading-[1.12] tracking-[-0.035em] text-[var(--text-strong)]">
        {title}
      </h2>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-3 rounded-[1.2rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3"
          >
            <span className="mt-2 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
            <p className="text-[0.93rem] leading-[1.65] text-[var(--text-muted)]">
              {item}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

export function DashboardVacancyFitWorkspace({
  supabase,
  profile,
  lastSimulation,
}: {
  supabase: SupabaseClient;
  profile: DashboardUserProfile;
  lastSimulation: DashboardSimulation | null;
}) {
  const [vacancyText, setVacancyText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [result, setResult] = useState<VacancyFitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contextItems = useMemo(() => {
    const market = mapTargetMarketLabel(
      lastSimulation?.targetMarket ?? profile.context.target_market,
    );
    const english = mapEnglishLevelLabel(profile.context.english_level);
    const searchStage = mapJobSearchStageLabel(profile.context.job_search_stage);
    const risk = riskLevelLabel(lastSimulation?.riskLevel ?? null);
    const incomeGap = formatSignedMoney(lastSimulation?.ceilingGapMedian ?? null);

    return [
      ["Роль", lastSimulation?.currentRole ?? profile.context.current_role],
      ["Ціль", lastSimulation?.targetRole ?? profile.context.target_role],
      ["Ринок", market],
      ["Англійська", english],
      ["Пошук", searchStage],
      ["Ризик", risk],
      ["Розрив стелі", incomeGap],
    ].filter((item): item is [string, string] => Boolean(item[1]));
  }, [lastSimulation, profile.context]);

  const canSubmit = vacancyText.trim().length >= 80 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError("Додайте повніший текст вакансії для аналізу.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Потрібно увійти в оплачений акаунт.");
      }

      const response = await fetch("/api/vacancy-fit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          vacancyText,
          resumeText,
        }),
      });

      const payload = (await response.json()) as
        | VacancyFitResponse
        | { error?: string };

      if (!response.ok || !("analysis" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Не вдалося проаналізувати вакансію.",
        );
      }

      setResult(payload);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Не вдалося проаналізувати вакансію.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr),22rem]">
        <article className="dashboard-spotlight-card rounded-[2.3rem] p-6 md:p-8">
          <DashboardChip tone="accent">Vacancy Fit</DashboardChip>
          <h1 className="mt-5 max-w-[13ch] text-[2.25rem] font-semibold leading-[0.94] tracking-[-0.055em] text-[var(--text-strong)] md:text-[3.15rem]">
            Перевірте вакансію перед подачею.
          </h1>
          <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
            Decivio порівняє текст вакансії з вашим профілем, останньою оцінкою
            і зарплатною ціллю, а потім дасть рішення: подаватися, підготуватися
            точніше або пропустити.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <DashboardMetricCard
              label="Вхід"
              value="Вакансія"
              description="Текст ролі, вимоги, відповідальність і зарплатні сигнали."
            />
            <DashboardMetricCard
              label="Контекст"
              value={lastSimulation ? "Оцінка збережена" : "Профіль"}
              description="Аналіз використовує останній результат і дані профілю."
            />
            <DashboardMetricCard
              label="Вихід"
              value="Рішення"
              description="Fit score, ризики, resume-правки і salary talking points."
            />
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-5 md:p-6">
          <h2 className="text-[1.4rem] font-semibold leading-[1.08] tracking-[-0.04em] text-[var(--text-strong)]">
            Контекст аналізу
          </h2>
          <div className="mt-5 space-y-3">
            {contextItems.length > 0 ? (
              contextItems.map(([label, value]) => (
                <div key={label} className="surface-soft rounded-[1.2rem] p-4">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">
                    {label}
                  </p>
                  <p className="mt-2 text-[0.96rem] font-semibold leading-[1.45] text-[var(--text-strong)]">
                    {value}
                  </p>
                </div>
              ))
            ) : (
              <div className="surface-soft rounded-[1.2rem] p-4">
                <p className="text-[0.94rem] leading-[1.68] text-[var(--text-muted)]">
                  Після першої оцінки тут з&apos;явиться більше персонального
                  контексту.
                </p>
              </div>
            )}
          </div>
        </article>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr),minmax(20rem,0.7fr)]">
        <article className="surface-panel rounded-[2rem] p-5 md:p-6">
          <label
            htmlFor="vacancy-text"
            className="text-[1.25rem] font-semibold leading-[1.1] tracking-[-0.035em] text-[var(--text-strong)]"
          >
            Текст вакансії
          </label>
          <textarea
            id="vacancy-text"
            value={vacancyText}
            onChange={(event) => setVacancyText(event.target.value)}
            className="mt-4 min-h-72 w-full resize-y rounded-[1.25rem] border border-[rgba(24,26,32,0.1)] bg-[rgba(255,255,255,0.82)] px-4 py-3 text-[0.95rem] leading-[1.65] text-[var(--text-strong)] outline-none transition placeholder:text-[var(--text-soft)] focus:border-[rgba(63,94,255,0.34)] focus:bg-white"
            placeholder="Вставте повний опис вакансії, вимоги, задачі й зарплатні умови, якщо вони є."
          />
        </article>

        <article className="surface-panel rounded-[2rem] p-5 md:p-6">
          <label
            htmlFor="resume-text"
            className="text-[1.25rem] font-semibold leading-[1.1] tracking-[-0.035em] text-[var(--text-strong)]"
          >
            Резюме або профіль
          </label>
          <textarea
            id="resume-text"
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            className="mt-4 min-h-72 w-full resize-y rounded-[1.25rem] border border-[rgba(24,26,32,0.1)] bg-[rgba(255,255,255,0.82)] px-4 py-3 text-[0.95rem] leading-[1.65] text-[var(--text-strong)] outline-none transition placeholder:text-[var(--text-soft)] focus:border-[rgba(63,94,255,0.34)] focus:bg-white"
            placeholder="Опційно: вставте резюме, LinkedIn-summary або короткий профіль."
          />
        </article>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Аналізуємо..." : "Проаналізувати вакансію"}
        </button>
        {error ? (
          <p className="text-[0.94rem] leading-[1.6] text-[var(--danger-strong)]">
            {error}
          </p>
        ) : null}
      </div>

      {result ? (
        <section className="space-y-6">
          <article className="dashboard-spotlight-card rounded-[2.3rem] p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <DashboardChip tone={verdictTone(result.analysis.verdict)}>
                {verdictLabel(result.analysis.verdict)}
              </DashboardChip>
              <DashboardChip tone="default">
                {result.meta.test_mode ? "Test mode" : result.meta.model}
              </DashboardChip>
              <DashboardChip tone="default">
                {formatLatency(result.meta.latency_ms)}
              </DashboardChip>
            </div>

            <h2 className="mt-5 max-w-[15ch] text-[2rem] font-semibold leading-[0.98] tracking-[-0.05em] text-[var(--text-strong)] md:text-[2.8rem]">
              {result.analysis.headline}
            </h2>
            <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
              {result.analysis.summary}
            </p>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <DashboardMetricCard
                label="Fit score"
                value={`${result.analysis.fit_score}/100`}
                description="Практична відповідність вакансії вашому профілю."
              />
              <DashboardMetricCard
                label="Рішення"
                value={verdictLabel(result.analysis.verdict)}
                description="Чи варто подаватися саме на цю роль."
              />
              <DashboardMetricCard
                label="Наступний крок"
                value={result.analysis.next_action}
                description="Що зробити перед або замість подачі."
              />
            </div>
          </article>

          <article className="surface-panel rounded-[1.8rem] p-5 md:p-6">
            <h2 className="text-[1.22rem] font-semibold leading-[1.12] tracking-[-0.035em] text-[var(--text-strong)]">
              Зарплатна позиція
            </h2>
            <p className="mt-4 text-[0.96rem] leading-[1.76] text-[var(--text-muted)]">
              {result.analysis.salary_angle}
            </p>
          </article>

          <div className="grid gap-6 xl:grid-cols-2">
            <ResultList
              title="Сильні збіги"
              items={result.analysis.strongest_matches}
            />
            <ResultList
              title="Ризики і прогалини"
              items={result.analysis.gaps_or_risks}
            />
            <ResultList
              title="Що змінити в резюме"
              items={result.analysis.resume_adjustments}
            />
            <ResultList
              title="Що сказати на співбесіді"
              items={result.analysis.interview_salary_talking_points}
            />
          </div>

          <ResultList title="Обмеження оцінки" items={result.analysis.caveats} />
        </section>
      ) : null}
    </div>
  );
}
