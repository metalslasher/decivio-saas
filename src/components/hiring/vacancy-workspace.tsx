"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PlanBanner } from "@/components/hiring/plan-banner";
import { useEmployerSession } from "@/components/hiring/use-employer-session";
import { trackEvent } from "@/lib/analytics";
import { apiRequest, buildApplyUrl, copyText, formatRelativeDate, withApplyLink } from "@/lib/hiring/client";
import {
  APPLICATION_STATUS_LABELS,
  VERDICT_LABELS,
  type ApplicationRecord,
  type ApplicationStatus,
  type EmployerUsage,
  type ScreeningVerdict,
  type VacancyDetail,
} from "@/lib/hiring/types";

type Filter = "all" | ScreeningVerdict;

const VERDICT_TONE: Record<ScreeningVerdict, { chip: string; ring: string }> = {
  call: { chip: "chip-good", ring: "var(--good)" },
  maybe: { chip: "chip-warn", ring: "var(--warn)" },
  reject: { chip: "chip-bad", ring: "var(--bad)" },
};

export function VacancyWorkspace({ vacancyId, justCreated }: { vacancyId: string; justCreated: boolean }) {
  const session = useEmployerSession();
  const [vacancy, setVacancy] = useState<VacancyDetail | null>(null);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [usage, setUsage] = useState<EmployerUsage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isRescreening, setIsRescreening] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [applyUrl, setApplyUrl] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await apiRequest<{ vacancy: VacancyDetail; applications: ApplicationRecord[]; usage: EmployerUsage }>(
        `/api/hiring/vacancies/${vacancyId}`,
        { auth: true },
      );
      setVacancy(result.vacancy);
      setApplications(result.applications);
      setUsage(result.usage);
      setApplyUrl(buildApplyUrl(result.vacancy.slug));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Не вдалося завантажити вакансію.");
    }
  }, [vacancyId]);

  useEffect(() => {
    if (session.status === "user") {
      void load();
    }
  }, [session.status, load]);

  // Light polling so new candidates appear without reload.
  useEffect(() => {
    if (session.status !== "user") return;
    const timer = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(timer);
  }, [session.status, load]);

  const counts = useMemo(
    () => ({
      all: applications.length,
      call: applications.filter((app) => app.verdict === "call").length,
      maybe: applications.filter((app) => app.verdict === "maybe").length,
      reject: applications.filter((app) => app.verdict === "reject").length,
    }),
    [applications],
  );

  const visible = filter === "all" ? applications : applications.filter((app) => app.verdict === filter);

  const copy = async (key: string, value: string) => {
    trackEvent(key === "link" ? "apply_link_copied" : "posting_text_copied", { place: "workspace" });
    if (await copyText(value)) {
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1800);
    }
  };

  const changeStatus = async (applicationId: string, status: ApplicationStatus) => {
    setApplications((current) => current.map((app) => (app.id === applicationId ? { ...app, status } : app)));
    try {
      await apiRequest(`/api/hiring/applications/${applicationId}`, { auth: true, method: "PATCH", body: { status } });
    } catch {
      void load();
    }
  };

  const unscreenedCount = applications.filter((app) => !app.screening).length;

  const rescreen = async () => {
    setIsRescreening(true);
    trackEvent("candidates_rescreened", { count: unscreenedCount });
    setNotice(null);
    try {
      // The API screens a small batch per call to stay within serverless time limits.
      for (let guard = 0; guard < 40; guard += 1) {
        const result = await apiRequest<{ screened: number; remaining: number }>(`/api/hiring/vacancies/${vacancyId}/rescreen`, {
          auth: true,
          body: {},
        });
        await load();
        if (result.remaining === 0 || result.screened === 0) break;
      }
    } catch (rescreenError) {
      setNotice(rescreenError instanceof Error ? rescreenError.message : "Не вдалося оцінити кандидатів.");
    } finally {
      setIsRescreening(false);
    }
  };

  const toggleVacancy = async () => {
    if (!vacancy) return;
    const status = vacancy.status === "active" ? "closed" : "active";
    setNotice(null);
    setVacancy({ ...vacancy, status });
    try {
      await apiRequest(`/api/hiring/vacancies/${vacancy.id}`, { auth: true, method: "PATCH", body: { status } });
    } catch (toggleError) {
      setNotice(toggleError instanceof Error ? toggleError.message : "Не вдалося змінити статус.");
    }
    void load();
  };

  if (session.status === "guest") {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <p className="body-copy">Увійдіть, щоб побачити кандидатів.</p>
        <Link href="/hire" className="btn-primary mt-4">
          До входу
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <p className="font-semibold text-[var(--bad)]">{error}</p>
        <Link href="/hire" className="text-link mt-4 inline-block">
          ← Мої вакансії
        </Link>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="space-y-4">
        <div className="shimmer h-10 w-64" />
        <div className="shimmer h-40 w-full" />
        <div className="shimmer h-24 w-full" />
      </div>
    );
  }

  const postingText = withApplyLink(vacancy.content.posting_text, applyUrl);

  return (
    <div className="fade-up">
      <Link href="/hire" className="text-link text-sm">
        ← Мої вакансії
      </Link>
      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="section-title">{vacancy.content.title}</h1>
          <p className="body-copy mt-1">
            {vacancy.city ? `${vacancy.city} · ` : ""}
            {vacancy.content.pay_hint} · {vacancy.content.schedule}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/hire/${vacancy.id}/edit`} className="btn-secondary !py-2.5 text-sm">
            Редагувати
          </Link>
          <Link href={`/hire/${vacancy.id}/poster`} className="btn-secondary !py-2.5 text-sm">
            QR-постер
          </Link>
          <button type="button" onClick={toggleVacancy} className="btn-secondary !py-2.5 text-sm">
            {vacancy.status === "active" ? "Закрити набір" : "Відновити набір"}
          </button>
        </div>
      </div>

      {notice ? <p className="mt-4 rounded-2xl bg-[var(--warn-soft)] px-4 py-3 text-sm font-semibold text-[#7a5a0b]">{notice}</p> : null}

      <PlanBanner usage={usage} />

      {justCreated ? (
        <div className="card-ink mt-6 p-5 md:p-6">
          <p className="text-lg font-extrabold">🎉 Вакансія опублікована. Що далі?</p>
          <ol className="mt-3 grid gap-2 text-sm text-white/80 md:grid-cols-3">
            <li>1. Скопіюйте текст нижче і розмістіть на Work.ua, OLX, у Telegram-каналах свого міста.</li>
            <li>2. Кандидати відповідають на анкету з телефону — без резюме і реєстрації.</li>
            <li>3. Тут з&apos;являться кандидати з оцінкою. Дзвоніть першими тим, що зверху.</li>
          </ol>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="card min-w-0 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="panel-title">Кандидати</h2>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "call", "maybe", "reject"] as Filter[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`chip transition ${filter === key ? "" : "chip-muted"}`}
                >
                  {key === "all" ? "Усі" : VERDICT_LABELS[key]} · {counts[key]}
                </button>
              ))}
            </div>
          </div>

          {unscreenedCount > 0 ? (
            <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-[var(--warn-soft)] p-4 sm:flex-row sm:items-center">
              <p className="flex-1 text-sm font-semibold text-[#7a5a0b]">
                {unscreenedCount} {pluralCandidates(unscreenedCount)} без ШІ-оцінки
              </p>
              <button type="button" className="btn-dark !py-2 text-sm disabled:opacity-60" disabled={isRescreening} onClick={rescreen}>
                {isRescreening ? "Оцінюємо..." : "Оцінити зараз"}
              </button>
            </div>
          ) : null}

          {applications.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--line-strong)] p-8 text-center">
              <p className="text-3xl">📨</p>
              <p className="mt-3 font-bold text-[var(--text-strong)]">Поки немає відгуків</p>
              <p className="body-copy mx-auto mt-1 max-w-sm">
                Розмістіть текст вакансії з посиланням. Можете самі пройти анкету, щоб побачити, як це працює.
              </p>
              <a href={applyUrl} target="_blank" rel="noreferrer" className="btn-secondary mt-4 !py-2.5 text-sm">
                Відкрити анкету ↗
              </a>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {visible.map((application, index) => (
                <CandidateCard key={application.id} application={application} rank={index + 1} onStatus={changeStatus} />
              ))}
            </ul>
          )}
        </section>

        <aside className="min-w-0 space-y-4">
          <section className="card p-5">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--text-soft)]">Посилання на анкету</h2>
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[var(--bg-surface)] p-2 pl-3">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--text-strong)]">{applyUrl}</span>
              <button type="button" className="chip" onClick={() => copy("link", applyUrl)}>
                {copiedKey === "link" ? "✓" : "Копіювати"}
              </button>
            </div>
            <a href={applyUrl} target="_blank" rel="noreferrer" className="text-link mt-3 inline-block text-sm">
              Подивитися як кандидат ↗
            </a>
          </section>
          <section className="card p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--text-soft)]">Текст оголошення</h2>
              <button type="button" className="chip" onClick={() => copy("post", postingText)}>
                {copiedKey === "post" ? "Скопійовано ✓" : "Копіювати"}
              </button>
            </div>
            <pre className="mt-3 max-h-[360px] overflow-y-auto whitespace-pre-wrap rounded-2xl bg-[var(--bg-surface)] p-4 font-[inherit] text-[0.86rem] leading-relaxed text-[var(--text-strong)]">
              {postingText}
            </pre>
          </section>
        </aside>
      </div>
    </div>
  );
}

function pluralCandidates(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "кандидат";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "кандидати";
  return "кандидатів";
}

function CandidateCard({
  application,
  rank,
  onStatus,
}: {
  application: ApplicationRecord;
  rank: number;
  onStatus: (id: string, status: ApplicationStatus) => void;
}) {
  const [open, setOpen] = useState(rank === 1);
  const screening = application.screening;
  const tone = application.verdict ? VERDICT_TONE[application.verdict] : null;

  return (
    <li className={`rounded-2xl border bg-white p-4 transition ${application.status === "rejected" ? "opacity-60" : ""} ${open ? "border-[rgba(67,97,255,0.25)]" : "border-[var(--line-soft)]"}`}>
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-4 text-left">
        <span
          className="score-ring shrink-0"
          style={{ "--score": application.score ?? 0, "--ring": tone?.ring ?? "var(--text-soft)" } as React.CSSProperties}
        >
          <span>{application.score ?? "—"}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-[var(--text-strong)]">{application.candidate_name}</span>
            {application.verdict ? <span className={`chip ${tone?.chip}`}>{VERDICT_LABELS[application.verdict]}</span> : <span className="chip chip-muted">Без оцінки</span>}
            {application.status !== "new" ? <span className="chip chip-muted">{APPLICATION_STATUS_LABELS[application.status]}</span> : null}
          </span>
          <span className="mt-1 block truncate text-sm text-[var(--text-muted)]">{screening?.headline ?? "Оцінка недоступна — перегляньте відповіді."}</span>
        </span>
        <span className="hidden text-xs text-[var(--text-soft)] sm:block">{formatRelativeDate(application.created_at)}</span>
      </button>

      {open ? (
        <div className="fade-up mt-4 space-y-4 border-t border-[var(--line-soft)] pt-4">
          {screening && screening.knockouts.length > 0 ? (
            <div className="rounded-2xl bg-[var(--bad-soft)] p-3 text-sm text-[var(--bad)]">
              <p className="font-bold">Не проходить фільтр:</p>
              <ul className="mt-1 space-y-0.5">
                {screening.knockouts.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {screening ? (
            <div className="grid gap-3 md:grid-cols-2">
              <InsightList title="Сильні сторони" items={screening.strengths} tone="good" />
              <InsightList title="Ризики" items={screening.risks} tone="warn" />
            </div>
          ) : null}
          {screening && screening.interview_questions.length > 0 ? (
            <div className="rounded-2xl bg-[var(--accent-soft)] p-3">
              <p className="text-sm font-bold text-[var(--accent-strong)]">Що спитати під час дзвінка</p>
              <ul className="mt-1.5 space-y-1 text-sm text-[var(--text-strong)]">
                {screening.interview_questions.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <details>
            <summary className="cursor-pointer text-sm font-bold text-[var(--text-muted)]">Відповіді кандидата</summary>
            <dl className="mt-2 space-y-2 text-sm">
              {application.answers.map((answer) => (
                <div key={answer.question_id} className="rounded-xl bg-[var(--bg-surface)] p-3">
                  <dt className="text-[var(--text-muted)]">{answer.question}</dt>
                  <dd className="mt-0.5 font-semibold text-[var(--text-strong)]">{answer.answer}</dd>
                </div>
              ))}
              {application.about ? (
                <div className="rounded-xl bg-[var(--bg-surface)] p-3">
                  <dt className="text-[var(--text-muted)]">Додатково</dt>
                  <dd className="mt-0.5 font-semibold text-[var(--text-strong)]">{application.about}</dd>
                </div>
              ) : null}
            </dl>
          </details>
          <div className="flex flex-wrap items-center gap-2">
            <a href={`tel:${application.candidate_phone}`} className="btn-primary !px-5 !py-2.5 text-sm">
              📞 {application.candidate_phone}
            </a>
            {(["invited", "hired", "rejected"] as ApplicationStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onStatus(application.id, application.status === status ? "new" : status)}
                className={`chip transition ${application.status === status ? "" : "chip-muted"}`}
              >
                {APPLICATION_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </li>
  );
}

function InsightList({ title, items, tone }: { title: string; items: string[]; tone: "good" | "warn" }) {
  if (items.length === 0) return null;
  return (
    <div className={`rounded-2xl p-3 ${tone === "good" ? "bg-[var(--good-soft)]" : "bg-[var(--warn-soft)]"}`}>
      <p className={`text-sm font-bold ${tone === "good" ? "text-[var(--good)]" : "text-[#8a6106]"}`}>{title}</p>
      <ul className="mt-1.5 space-y-1 text-sm text-[var(--text-strong)]">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
