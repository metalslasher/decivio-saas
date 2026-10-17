"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { PlanBanner } from "@/components/hiring/plan-banner";
import { useEmployerSession } from "@/components/hiring/use-employer-session";
import { apiRequest, formatRelativeDate } from "@/lib/hiring/client";
import type { EmployerUsage, VacancySummary } from "@/lib/hiring/types";

export function HireCabinet() {
  const session = useEmployerSession();
  const { openAuthDialog } = useAuthDialog();
  const [vacancies, setVacancies] = useState<VacancySummary[] | null>(null);
  const [usage, setUsage] = useState<EmployerUsage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session.status !== "user") {
      return;
    }
    apiRequest<{ vacancies: VacancySummary[]; usage: EmployerUsage }>("/api/hiring/vacancies", { auth: true })
      .then((result) => {
        setVacancies(result.vacancies);
        setUsage(result.usage);
      })
      .catch((loadError: Error) => setError(loadError.message));
  }, [session.status]);

  if (session.status === "guest") {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center fade-up">
        <h1 className="section-title">Мої вакансії</h1>
        <p className="body-copy mt-3">Увійдіть, щоб побачити вакансії та кандидатів.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" className="btn-primary" onClick={() => openAuthDialog("login", { nextPath: "/hire" })}>
            Увійти
          </button>
          <Link href="/hire/new" className="btn-secondary">
            Створити вакансію
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="section-title">Мої вакансії</h1>
          <p className="body-copy mt-2">Кандидати впорядковані ШІ — починайте дзвонити з верхніх.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/hire/billing" className="btn-secondary">
            Тариф і оплата
          </Link>
          <Link href="/hire/new" className="btn-primary">
            + Нова вакансія
          </Link>
        </div>
      </div>

      <PlanBanner usage={usage} />

      {error ? <p className="mt-6 text-sm font-semibold text-[var(--bad)]">{error}</p> : null}

      {vacancies === null && !error ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[0, 1].map((key) => (
            <div key={key} className="card space-y-3 p-6">
              <div className="shimmer h-6 w-1/2" />
              <div className="shimmer h-4 w-1/3" />
              <div className="shimmer h-10 w-full" />
            </div>
          ))}
        </div>
      ) : null}

      {vacancies && vacancies.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-4xl">📋</p>
          <h2 className="panel-title mt-4">Поки немає вакансій</h2>
          <p className="body-copy mx-auto mt-2 max-w-md">Опишіть, кого шукаєте, — за 30 секунд буде готова вакансія з анкетою для кандидатів.</p>
          <Link href="/hire/new" className="btn-primary mt-6">
            Створити першу вакансію
          </Link>
        </div>
      ) : null}

      {vacancies && vacancies.length > 0 ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {vacancies.map((vacancy) => (
            <Link key={vacancy.id} href={`/hire/${vacancy.id}`} className="card group block p-6 transition hover:-translate-y-0.5 hover:border-[rgba(67,97,255,0.25)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="panel-title truncate group-hover:text-[var(--accent-strong)]">{vacancy.title}</h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {vacancy.city ? `${vacancy.city} · ` : ""}створено {formatRelativeDate(vacancy.created_at)}
                  </p>
                </div>
                <span className={`chip ${vacancy.status === "active" ? "chip-good" : "chip-muted"}`}>
                  {vacancy.status === "active" ? "Активна" : "Закрита"}
                </span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <Stat label="Відгуків" value={vacancy.applications_total} />
                <Stat label="Сильних" value={vacancy.applications_strong} tone="good" />
                <Stat label="Нових" value={vacancy.applications_new} tone="accent" />
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "good" | "accent" }) {
  const color = tone === "good" ? "text-[var(--good)]" : tone === "accent" ? "text-[var(--accent-strong)]" : "text-[var(--text-strong)]";
  return (
    <div className="rounded-2xl bg-[var(--bg-surface)] px-2 py-3">
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="text-xs font-semibold text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
