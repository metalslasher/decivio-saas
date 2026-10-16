"use client";

import { useEffect, useState } from "react";

const BRIEF = "Бариста в кав'ярню на Подолі, 2/2, можна без досвіду";

const CANDIDATES = [
  { name: "Олена К.", score: 91, verdict: "Дзвонити першим", tone: "good", note: "2 роки бариста, живе поруч, готова з понеділка" },
  { name: "Максим Д.", score: 74, verdict: "Дзвонити першим", tone: "good", note: "Досвід у кейтерингу, графік підходить" },
  { name: "Ірина П.", score: 52, verdict: "Можливо", tone: "warn", note: "Без досвіду, але 15 хв до роботи" },
  { name: "Андрій С.", score: 19, verdict: "Не підходить", tone: "bad", note: "Графік 2/2 не підходить" },
] as const;

const TONE_COLOR = { good: "var(--good)", warn: "var(--warn)", bad: "var(--bad)" } as const;
const TONE_CHIP = { good: "chip-good", warn: "chip-warn", bad: "chip-bad" } as const;

// Timeline (ms): type brief → show vacancy → candidates pop in one by one → loop.
const TYPE_SPEED = 38;
const VACANCY_AT = BRIEF.length * TYPE_SPEED + 500;
const FIRST_CANDIDATE_AT = VACANCY_AT + 1300;
const CANDIDATE_GAP = 900;
const LOOP_AT = FIRST_CANDIDATE_AT + CANDIDATE_GAP * CANDIDATES.length + 4200;

export function HeroDemo() {
  const [elapsed, setElapsed] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduceMotion(true);
      return;
    }
    const startedAt = Date.now();
    const timer = window.setInterval(() => setElapsed((Date.now() - startedAt) % LOOP_AT), 60);
    return () => window.clearInterval(timer);
  }, []);

  const time = reduceMotion ? LOOP_AT - 1 : elapsed;
  const typed = BRIEF.slice(0, Math.min(BRIEF.length, Math.floor(time / TYPE_SPEED)));
  const showVacancy = time >= VACANCY_AT;
  const visibleCandidates = time < FIRST_CANDIDATE_AT ? 0 : Math.min(CANDIDATES.length, 1 + Math.floor((time - FIRST_CANDIDATE_AT) / CANDIDATE_GAP));

  return (
    <div className="relative mx-auto w-full max-w-[520px]" aria-hidden="true">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-[radial-gradient(closest-side,rgba(67,97,255,0.18),transparent)] blur-2xl" />

      <div className="card p-4">
        <p className="text-[0.7rem] font-extrabold uppercase tracking-wide text-[var(--text-soft)]">Кого шукаєте?</p>
        <p className="mt-1.5 min-h-[1.5rem] text-[0.95rem] font-semibold text-[var(--text-strong)]">
          {typed}
          {typed.length < BRIEF.length ? <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-[var(--accent)]" /> : null}
        </p>
      </div>

      <div className={`card mt-3 p-4 transition-all duration-500 ${showVacancy ? "opacity-100" : "translate-y-2 opacity-0"}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-extrabold text-[var(--text-strong)]">Бариста — Поділ</p>
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">24 000 – 30 000 грн · 2/2 · навчання</p>
          </div>
          <span className="chip chip-good">Анкета готова</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["Графік 2/2?", "Скільки добиратися?", "Досвід?", "Коли почати?"].map((question) => (
            <span key={question} className="chip chip-muted">
              {question}
            </span>
          ))}
        </div>
      </div>

      <div className="card mt-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-[0.7rem] font-extrabold uppercase tracking-wide text-[var(--text-soft)]">Кому дзвонити першим</p>
          <span className="chip">{visibleCandidates} відгуки</span>
        </div>
        <ul className="mt-3 space-y-2">
          {CANDIDATES.map((candidate, index) => {
            const visible = index < visibleCandidates;
            return (
              <li
                key={candidate.name}
                className={`flex items-center gap-3 rounded-2xl bg-[var(--bg-surface)] p-2.5 transition-all duration-500 ${visible ? "opacity-100" : "translate-y-1 opacity-0"}`}
              >
                <span
                  className="score-ring !h-10 !w-10 shrink-0 text-[0.8rem]"
                  style={{ "--score": visible ? candidate.score : 0, "--ring": TONE_COLOR[candidate.tone], transition: "all 600ms" } as React.CSSProperties}
                >
                  <span>{candidate.score}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-[var(--text-strong)]">{candidate.name}</span>
                    <span className={`chip ${TONE_CHIP[candidate.tone]} !px-2 !py-0.5 !text-[0.66rem]`}>{candidate.verdict}</span>
                  </span>
                  <span className="block truncate text-xs text-[var(--text-muted)]">{candidate.note}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
