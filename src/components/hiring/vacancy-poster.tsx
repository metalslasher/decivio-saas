"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useEmployerSession } from "@/components/hiring/use-employer-session";
import { trackEvent } from "@/lib/analytics";
import { apiRequest, buildApplyUrl, copyText } from "@/lib/hiring/client";
import type { VacancyDetail } from "@/lib/hiring/types";

export function VacancyPoster({ vacancyId }: { vacancyId: string }) {
  const session = useEmployerSession();
  const [vacancy, setVacancy] = useState<VacancyDetail | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [applyUrl, setApplyUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (session.status !== "user") return;
    apiRequest<{ vacancy: VacancyDetail }>(`/api/hiring/vacancies/${vacancyId}`, { auth: true })
      .then(async (result) => {
        const url = buildApplyUrl(result.vacancy.slug);
        setVacancy(result.vacancy);
        setApplyUrl(url);
        setQrSvg(await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#121726", light: "#ffffff" } }));
      })
      .catch((loadError: Error) => setError(loadError.message));
  }, [session.status, vacancyId]);

  if (error) {
    return <p className="card mx-auto max-w-lg p-8 text-center font-semibold text-[var(--bad)]">{error}</p>;
  }

  if (!vacancy || !qrSvg) {
    return <div className="shimmer mx-auto h-[600px] w-full max-w-[640px]" />;
  }

  const { content } = vacancy;

  return (
    <div className="mx-auto max-w-[680px] fade-up">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/hire/${vacancy.id}`} className="text-link text-sm">
          ← До кандидатів
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary !py-2.5 text-sm"
            onClick={async () => {
              setCopied(await copyText(applyUrl));
              window.setTimeout(() => setCopied(false), 1800);
            }}
          >
            {copied ? "Посилання скопійовано ✓" : "Копіювати посилання"}
          </button>
          <button type="button" className="btn-primary !py-2.5 text-sm" onClick={() => {
            trackEvent("poster_printed");
            window.print();
          }}>
            🖨️ Надрукувати / зберегти PDF
          </button>
        </div>
      </div>

      <p className="no-print body-copy mb-5 text-sm">
        Повісьте на вітрині, біля каси або на дошці оголошень. Кандидат сканує QR-код камерою телефона і відгукується за 2 хвилини.
      </p>

      <article className="overflow-hidden rounded-[2rem] border border-[var(--line-soft)] bg-white shadow-[0_40px_80px_-50px_rgba(18,23,38,0.4)] print:rounded-none print:border-0 print:shadow-none">
        <div className="bg-[linear-gradient(135deg,#4361ff,#2c3fd6)] px-8 py-9 text-white md:px-12 md:py-12">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-white/70">Ми шукаємо</p>
          <h1 className="mt-3 text-[clamp(2.4rem,7vw,3.8rem)] font-extrabold leading-[1] tracking-[-0.04em]">{content.title}</h1>
          {vacancy.city ? <p className="mt-3 text-lg font-semibold text-white/80">📍 {vacancy.city}</p> : null}
        </div>

        <div className="grid gap-8 px-8 py-9 md:grid-cols-[1fr_auto] md:px-12 md:py-11">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--text-soft)]">Оплата</p>
              <p className="mt-1 text-2xl font-extrabold text-[var(--text-strong)]">{content.pay_hint}</p>
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--text-soft)]">Графік</p>
              <p className="mt-1 text-lg font-bold text-[var(--text-strong)]">{content.schedule}</p>
            </div>
            <ul className="space-y-2 text-[1.02rem] font-semibold text-[var(--text-strong)]">
              {content.offer.slice(0, 4).map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[var(--good)]">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center justify-center rounded-[1.6rem] bg-[var(--bg-surface)] p-5 text-center print:bg-white">
            <div className="h-[190px] w-[190px] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <p className="mt-4 max-w-[190px] text-sm font-extrabold leading-snug text-[var(--text-strong)]">
              Скануйте камерою — відгук за 2 хвилини
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Без резюме і реєстрації</p>
          </div>
        </div>
      </article>
    </div>
  );
}
