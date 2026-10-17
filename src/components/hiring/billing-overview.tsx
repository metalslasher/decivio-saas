"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { useEmployerSession } from "@/components/hiring/use-employer-session";
import { apiRequest } from "@/lib/hiring/client";
import type { BillingOverview } from "@/lib/hiring/types";

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" }) : null;
}

function describePlan(overview: BillingOverview) {
  if (overview.source === "manual") return "Pro (ручний доступ)";
  if (overview.plan === "free") return "Безкоштовний";
  if (overview.source === "one_time") return "Pro на 90 днів";
  return overview.status === "canceled" ? "Pro (підписку скасовано)" : "Pro щомісячно";
}

export function BillingOverviewPanel() {
  const session = useEmployerSession();
  const { openAuthDialog } = useAuthDialog();
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    apiRequest<BillingOverview>("/api/billing/subscription", { auth: true })
      .then(setOverview)
      .catch((loadError: Error) => setError(loadError.message));
  }, []);

  useEffect(() => {
    if (session.status === "user") load();
  }, [session.status, load]);

  const cancel = async () => {
    setIsCanceling(true);
    setError(null);
    try {
      const result = await apiRequest<{ currentPeriodEnd: string | null }>("/api/billing/subscription", {
        auth: true,
        body: { action: "cancel" },
      });
      setNotice(
        result.currentPeriodEnd
          ? `Підписку скасовано. Pro діє до ${formatDate(result.currentPeriodEnd)}, нових списань не буде.`
          : "Підписку скасовано, нових списань не буде.",
      );
      setConfirming(false);
      load();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Не вдалося скасувати підписку.");
    } finally {
      setIsCanceling(false);
    }
  };

  if (session.status === "guest") {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <p className="body-copy">Увійдіть, щоб керувати тарифом.</p>
        <button type="button" className="btn-primary mt-4" onClick={() => openAuthDialog("login", { nextPath: "/hire/billing" })}>
          Увійти
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl fade-up">
      <Link href="/hire" className="text-link text-sm">
        ← Мої вакансії
      </Link>
      <h1 className="section-title mt-3">Тариф і оплата</h1>

      {error ? <p className="mt-4 rounded-2xl bg-[var(--bad-soft)] px-4 py-3 text-sm font-semibold text-[var(--bad)]">{error}</p> : null}
      {notice ? <p className="mt-4 rounded-2xl bg-[var(--good-soft)] px-4 py-3 text-sm font-semibold text-[var(--good)]">{notice}</p> : null}

      {!overview && !error ? (
        <div className="card mt-6 space-y-3 p-6">
          <div className="shimmer h-6 w-1/3" />
          <div className="shimmer h-4 w-1/2" />
          <div className="shimmer h-12 w-full" />
        </div>
      ) : null}

      {overview ? (
        <>
          <section className={`mt-6 p-6 md:p-7 ${overview.plan === "pro" ? "card-ink" : "card"}`}>
            <p className={`text-xs font-extrabold uppercase tracking-wide ${overview.plan === "pro" ? "text-white/50" : "text-[var(--text-soft)]"}`}>
              Поточний тариф
            </p>
            <p className="mt-2 text-2xl font-extrabold">{describePlan(overview)}</p>
            {overview.plan === "pro" && overview.currentPeriodEnd ? (
              <p className={`mt-1 text-sm ${overview.plan === "pro" ? "text-white/70" : "text-[var(--text-muted)]"}`}>
                {overview.status === "canceled" || overview.source === "one_time" ? "Діє до" : "Наступне списання"}{" "}
                {formatDate(overview.currentPeriodEnd)}
              </p>
            ) : null}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <UsageTile
                dark={overview.plan === "pro"}
                label="Активні вакансії"
                value={`${overview.usage.activeVacancies} з ${overview.usage.limits.activeVacancies}`}
              />
              <UsageTile
                dark={overview.plan === "pro"}
                label="Оцінено кандидатів"
                value={
                  overview.usage.limits.screenedApplications === null
                    ? `${overview.usage.screenedApplications} · без ліміту`
                    : `${overview.usage.screenedApplications} з ${overview.usage.limits.screenedApplications}`
                }
              />
            </div>
          </section>

          {overview.plan === "free" ? (
            <section className="card mt-4 flex flex-col gap-4 p-6 md:flex-row md:items-center">
              <div className="flex-1">
                <p className="font-extrabold text-[var(--text-strong)]">Наймаєте регулярно?</p>
                <p className="body-copy mt-1">Pro — до 5 вакансій одночасно і ШІ-оцінка всіх кандидатів без обмежень.</p>
              </div>
              <Link href="/pricing" className="btn-primary">
                Обрати Pro
              </Link>
            </section>
          ) : null}

          {overview.canCancel ? (
            <section className="card mt-4 p-6">
              <p className="font-extrabold text-[var(--text-strong)]">Скасувати підписку</p>
              <p className="body-copy mt-1">
                Нових списань не буде. Pro залишиться активним до кінця оплаченого періоду, вакансії та кандидати збережуться.
              </p>
              {confirming ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="btn-dark !py-2.5 text-sm disabled:opacity-60" disabled={isCanceling} onClick={cancel}>
                    {isCanceling ? "Скасовуємо..." : "Так, скасувати"}
                  </button>
                  <button type="button" className="btn-secondary !py-2.5 text-sm" onClick={() => setConfirming(false)}>
                    Залишити Pro
                  </button>
                </div>
              ) : (
                <button type="button" className="mt-4 text-sm font-bold text-[var(--bad)]" onClick={() => setConfirming(true)}>
                  Скасувати підписку
                </button>
              )}
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function UsageTile({ label, value, dark }: { label: string; value: string; dark: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${dark ? "bg-white/10" : "bg-[var(--bg-surface)]"}`}>
      <p className={`text-xs font-bold ${dark ? "text-white/60" : "text-[var(--text-muted)]"}`}>{label}</p>
      <p className="mt-1 text-lg font-extrabold">{value}</p>
    </div>
  );
}
