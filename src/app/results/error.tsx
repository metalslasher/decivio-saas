"use client";

import Link from "next/link";

type ResultsErrorProps = {
  error: Error;
  reset: () => void;
};

export default function ResultsError({ error, reset }: ResultsErrorProps) {
  return (
    <section className="mx-auto max-w-3xl space-y-5 rounded-[2rem] border border-[rgba(163,94,79,0.18)] bg-[var(--danger-soft)] p-6 md:p-8">
      <h1 className="page-title max-w-[12ch]">Не вдалося відкрити сторінку результатів</h1>
      <p className="text-[0.97rem] leading-[1.72] text-[var(--danger-strong)] md:text-[1.04rem]">
        {error.message || "Сталася помилка під час завантаження результатів."}
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn-secondary border-[rgba(163,94,79,0.18)] text-[var(--danger-strong)]">
          Спробувати ще раз
        </button>
        <Link href="/simulate" className="btn-primary">
          Повернутися до оцінки
        </Link>
      </div>
    </section>
  );
}
