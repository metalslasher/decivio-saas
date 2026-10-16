"use client";

import { useState } from "react";
import type { PublicVacancy } from "@/lib/hiring/types";

type ApplyFlowProps = {
  vacancy: PublicVacancy;
  /** Preview mode is used inside the employer builder: nothing is submitted. */
  preview?: boolean;
};

type Step = { kind: "intro" } | { kind: "question"; index: number } | { kind: "contacts" } | { kind: "done" };

export function ApplyFlow({ vacancy, preview = false }: ApplyFlowProps) {
  const [step, setStep] = useState<Step>({ kind: "intro" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [about, setAbout] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = vacancy.questions.length;
  const progress =
    step.kind === "intro" ? 0 : step.kind === "question" ? (step.index + 1) / (total + 1) : 1;

  const goNext = (fromIndex: number) => {
    setStep(fromIndex + 1 < total ? { kind: "question", index: fromIndex + 1 } : { kind: "contacts" });
  };

  const goBack = () => {
    if (step.kind === "question") {
      setStep(step.index === 0 ? { kind: "intro" } : { kind: "question", index: step.index - 1 });
    } else if (step.kind === "contacts") {
      setStep(total > 0 ? { kind: "question", index: total - 1 } : { kind: "intro" });
    }
  };

  const submit = async () => {
    setError(null);
    if (name.trim().length < 2) {
      setError("Вкажіть ваше ім'я.");
      return;
    }
    if (phone.replace(/\D+/g, "").length < 10) {
      setError("Вкажіть номер телефону, щоб роботодавець міг вам подзвонити.");
      return;
    }

    if (preview) {
      setStep({ kind: "done" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/apply/${vacancy.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, about, answers }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Не вдалося надіслати відгук.");
      }
      setStep({ kind: "done" });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не вдалося надіслати відгук.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!vacancy.is_open && !preview) {
    return (
      <div className="card p-6 text-center">
        <p className="panel-title">Набір закрито</p>
        <p className="body-copy mt-2">Роботодавець уже знайшов людину на цю вакансію. Дякуємо за інтерес!</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      {step.kind !== "intro" && step.kind !== "done" ? (
        <div className="mb-5 flex items-center gap-3">
          <button type="button" onClick={goBack} className="text-sm font-bold text-[var(--text-muted)]" aria-label="Назад">
            ←
          </button>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(22,29,43,0.08)]">
            <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      ) : null}

      {step.kind === "intro" ? (
        <div key="intro" className="fade-up space-y-4">
          <div>
            {vacancy.city ? <span className="chip chip-muted">📍 {vacancy.city}</span> : null}
            <h1 className="mt-3 text-[1.7rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-[var(--text-strong)]">{vacancy.title}</h1>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--text-muted)]">{vacancy.summary}</p>
          </div>
          <div className="grid gap-2">
            <div className="rounded-2xl bg-white p-3.5">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-soft)]">Оплата</p>
              <p className="mt-1 font-extrabold text-[var(--text-strong)]">{vacancy.pay_hint}</p>
            </div>
            <div className="rounded-2xl bg-white p-3.5">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-soft)]">Графік</p>
              <p className="mt-1 font-bold text-[var(--text-strong)]">{vacancy.schedule}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-3.5">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-soft)]">Що пропонуємо</p>
            <ul className="mt-2 space-y-1.5 text-[0.92rem] text-[var(--text-strong)]">
              {vacancy.offer.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[var(--good)]">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          {vacancy.duties.length > 0 ? (
            <details className="rounded-2xl bg-white p-3.5">
              <summary className="cursor-pointer text-sm font-bold text-[var(--text-strong)]">Обов&apos;язки та вимоги</summary>
              <ul className="mt-2 space-y-1.5 text-[0.9rem] text-[var(--text-muted)]">
                {[...vacancy.duties, ...vacancy.requirements].map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </details>
          ) : null}
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => setStep(total > 0 ? { kind: "question", index: 0 } : { kind: "contacts" })}
          >
            Відгукнутися за 2 хвилини
          </button>
          <p className="text-center text-xs text-[var(--text-soft)]">Без реєстрації та резюме</p>
        </div>
      ) : null}

      {step.kind === "question" ? (
        <QuestionStep
          key={`q-${step.index}`}
          question={vacancy.questions[step.index]}
          number={step.index + 1}
          total={total}
          value={answers[vacancy.questions[step.index].id] ?? ""}
          onChange={(value) => setAnswers((current) => ({ ...current, [vacancy.questions[step.index].id]: value }))}
          onNext={() => goNext(step.index)}
        />
      ) : null}

      {step.kind === "contacts" ? (
        <div key="contacts" className="fade-up space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-soft)]">Останній крок</p>
          <h2 className="text-[1.35rem] font-extrabold leading-tight text-[var(--text-strong)]">Як з вами зв&apos;язатися?</h2>
          <input
            className="field-surface"
            placeholder="Ваше ім'я"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
          <input
            className="field-surface"
            placeholder="Телефон, напр. 067 123 45 67"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
          />
          <textarea
            className="field-surface min-h-[88px] resize-none"
            placeholder="Хочете щось додати? (необов'язково)"
            value={about}
            onChange={(event) => setAbout(event.target.value)}
          />
          {error ? <p className="text-sm font-semibold text-[var(--bad)]">{error}</p> : null}
          <button type="button" className="btn-primary w-full disabled:opacity-60" disabled={isSubmitting} onClick={submit}>
            {isSubmitting ? "Надсилаємо..." : "Надіслати відгук"}
          </button>
          <p className="text-center text-[0.72rem] leading-snug text-[var(--text-soft)]">
            Надсилаючи відгук, ви погоджуєтеся передати ім&apos;я, телефон і відповіді роботодавцю для розгляду кандидатури.
          </p>
        </div>
      ) : null}

      {step.kind === "done" ? (
        <div key="done" className="fade-up flex flex-1 flex-col items-center justify-center py-10 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--good-soft)] text-3xl text-[var(--good)]">✓</div>
          <h2 className="mt-4 text-[1.4rem] font-extrabold text-[var(--text-strong)]">Відгук надіслано!</h2>
          <p className="mt-2 max-w-[18rem] text-[0.95rem] text-[var(--text-muted)]">
            Роботодавець отримав ваші відповіді. Якщо ви підходите — вам зателефонують найближчим часом.
          </p>
          {preview ? (
            <button type="button" className="text-link mt-5 text-sm" onClick={() => setStep({ kind: "intro" })}>
              Пройти ще раз
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function QuestionStep({
  question,
  number,
  total,
  value,
  onChange,
  onNext,
}: {
  question: PublicVacancy["questions"][number];
  number: number;
  total: number;
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="fade-up space-y-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-soft)]">
        Питання {number} з {total}
      </p>
      <h2 className="text-[1.35rem] font-extrabold leading-tight text-[var(--text-strong)]">{question.text}</h2>
      {question.kind === "text" ? (
        <>
          <textarea
            className="field-surface min-h-[120px] resize-none"
            placeholder="Кілька слів буде достатньо"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          <button type="button" className="btn-primary w-full" onClick={onNext}>
            {value.trim() ? "Далі" : "Пропустити"}
          </button>
        </>
      ) : (
        <div className="grid gap-2.5">
          {question.options.map((option) => (
            <button
              key={option}
              type="button"
              className="option-button"
              data-selected={value === option}
              onClick={() => {
                onChange(option);
                window.setTimeout(onNext, 180);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
