"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { ApplyFlow } from "@/components/hiring/apply-flow";
import { ApiError, apiRequest, clearDraft, copyText, getAccessToken, loadDraft, saveDraft } from "@/lib/hiring/client";
import type { PublicVacancy, ScreeningQuestion, ScreeningQuestionKind, VacancyContent } from "@/lib/hiring/types";

const EXAMPLES = [
  "Бариста в кав'ярню біля метро, графік 2/2, можна без досвіду — навчимо",
  "Водій категорії C на доставку по області, щоденні виплати",
  "Продавець-консультант у магазин одягу в ТРЦ, графік 5/2",
  "Комплектувальник на склад, нічні зміни, офіційне оформлення",
  "Кухар на гарячий цех у ресторан, досвід від року",
];

const GENERATION_STEPS = [
  "Аналізую посаду і ринок",
  "Підбираю реалістичну оплату",
  "Пишу текст вакансії",
  "Складаю питання-фільтри для кандидатів",
];

type Phase = "brief" | "generating" | "editor";

export function VacancyBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openAuthDialog } = useAuthDialog();

  const [phase, setPhase] = useState<Phase>("brief");
  const [brief, setBrief] = useState("");
  const [city, setCity] = useState("");
  const [pay, setPay] = useState("");
  const [schedule, setSchedule] = useState("");
  const [content, setContent] = useState<VacancyContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const autoPublishStarted = useRef(false);

  const publish = useCallback(
    async (draftContent: VacancyContent, draftBrief: string, draftCity: string) => {
      setError(null);
      const token = await getAccessToken();
      if (!token) {
        openAuthDialog("signup", {
          nextPath: "/hire/new?publish=1",
          notice: "Створіть безкоштовний акаунт, щоб опублікувати вакансію і бачити кандидатів.",
        });
        return;
      }

      setIsPublishing(true);
      try {
        const created = await apiRequest<{ id: string; slug: string }>("/api/hiring/vacancies", {
          auth: true,
          body: { content: draftContent, brief: draftBrief, city: draftCity },
        });
        clearDraft();
        router.push(`/hire/${created.id}?created=1`);
      } catch (publishError) {
        setError(publishError instanceof ApiError ? publishError.message : "Не вдалося опублікувати вакансію.");
        setIsLimitReached(publishError instanceof ApiError && publishError.status === 402);
        setIsPublishing(false);
      }
    },
    [openAuthDialog, router],
  );

  // Restore the draft (e.g. after registration) and finish publishing automatically.
  useEffect(() => {
    const draft = loadDraft();
    if (!draft) {
      return;
    }

    setBrief(draft.brief);
    setCity(draft.city);
    setPay(draft.pay);
    setSchedule(draft.schedule);
    if (draft.content) {
      setContent(draft.content);
      setPhase("editor");
      if (searchParams.get("publish") === "1" && !autoPublishStarted.current) {
        autoPublishStarted.current = true;
        void publish(draft.content, draft.brief, draft.city);
      }
    }
  }, [publish, searchParams]);

  useEffect(() => {
    if (phase === "brief" && !brief && !city && !pay && !schedule) {
      return;
    }
    saveDraft({ brief, city, pay, schedule, content });
  }, [brief, city, pay, schedule, content, phase]);

  useEffect(() => {
    if (phase !== "generating") {
      return;
    }
    setGenerationStep(0);
    const timer = window.setInterval(() => {
      setGenerationStep((current) => Math.min(current + 1, GENERATION_STEPS.length - 1));
    }, 2200);
    return () => window.clearInterval(timer);
  }, [phase]);

  const generate = async () => {
    setError(null);
    if (brief.trim().length < 8) {
      setError("Опишіть, кого шукаєте, хоча б одним реченням.");
      return;
    }

    setPhase("generating");
    try {
      const result = await apiRequest<{ content: VacancyContent }>("/api/hiring/draft", {
        body: { brief, city, pay, schedule },
      });
      setContent(result.content);
      setPhase("editor");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Не вдалося згенерувати вакансію.");
      setPhase("brief");
    }
  };

  if (phase === "generating") {
    return <GeneratingState step={generationStep} brief={brief} />;
  }

  if (phase === "editor" && content) {
    return (
      <VacancyEditor
        content={content}
        city={city}
        onChange={setContent}
        onRestart={() => {
          setContent(null);
          setPhase("brief");
        }}
        onPublish={() => publish(content, brief, city)}
        isPublishing={isPublishing}
        error={error}
        isLimitReached={isLimitReached}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl fade-up">
      <div className="text-center">
        <span className="eyebrow-pill">Крок 1 з 2 · без реєстрації</span>
        <h1 className="page-title mx-auto mt-5 max-w-[18ch]">Кого ви шукаєте?</h1>
        <p className="lead-copy mx-auto mt-4 max-w-xl">
          Опишіть посаду своїми словами — як сказали б знайомому. За 30 секунд отримаєте готову вакансію, оплату-орієнтир і
          анкету для кандидатів.
        </p>
      </div>

      <div className="card mt-8 p-4 md:p-6">
        <textarea
          className="field-surface min-h-[140px] resize-none text-[1.05rem]"
          placeholder={`Наприклад: ${EXAMPLES[0]}`}
          value={brief}
          onChange={(event) => setBrief(event.target.value)}
          maxLength={2000}
          autoFocus
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setBrief(example)}
              className="chip chip-muted transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
            >
              {example.split(",")[0]}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="text-xs font-bold text-[var(--text-muted)]">Місто / район</span>
            <input className="field-surface mt-1" placeholder="Київ, Позняки" value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[var(--text-muted)]">Оплата (якщо знаєте)</span>
            <input className="field-surface mt-1" placeholder="від 25 000 грн" value={pay} onChange={(e) => setPay(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[var(--text-muted)]">Графік</span>
            <input className="field-surface mt-1" placeholder="2/2 з 8:00 до 20:00" value={schedule} onChange={(e) => setSchedule(e.target.value)} />
          </label>
        </div>
        {error ? <p className="mt-4 text-sm font-semibold text-[var(--bad)]">{error}</p> : null}
        <button type="button" onClick={generate} className="btn-primary mt-5 w-full text-[1rem]">
          ✨ Створити вакансію
        </button>
      </div>
    </div>
  );
}

function GeneratingState({ step, brief }: { step: number; brief: string }) {
  return (
    <div className="mx-auto max-w-xl py-10 text-center fade-up">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--accent-soft)] text-2xl">
        <span className="pulse-dot">✨</span>
      </div>
      <h1 className="section-title mt-6">Готуємо вакансію</h1>
      <p className="body-copy mx-auto mt-2 max-w-md truncate">«{brief}»</p>
      <ul className="card mx-auto mt-8 max-w-sm space-y-3 p-5 text-left">
        {GENERATION_STEPS.map((label, index) => (
          <li key={label} className="flex items-center gap-3 text-[0.95rem]">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                index < step
                  ? "bg-[var(--good-soft)] text-[var(--good)]"
                  : index === step
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "bg-[rgba(22,29,43,0.05)] text-[var(--text-soft)]"
              }`}
            >
              {index < step ? "✓" : index === step ? <span className="pulse-dot">●</span> : index + 1}
            </span>
            <span className={index <= step ? "font-semibold text-[var(--text-strong)]" : "text-[var(--text-soft)]"}>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function linesToList(value: string) {
  return value
    .split("\n")
    .map((line) => line.replace(/^[•\-\s]+/, "").trim())
    .filter(Boolean);
}

export function VacancyEditor({
  mode = "create",
  content,
  city,
  onChange,
  onRestart,
  onPublish,
  isPublishing,
  error,
  isLimitReached,
}: {
  mode?: "create" | "edit";
  content: VacancyContent;
  city: string;
  onChange: (content: VacancyContent) => void;
  onRestart: () => void;
  onPublish: () => void;
  isPublishing: boolean;
  error: string | null;
  isLimitReached: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const isEdit = mode === "edit";
  const primaryLabel = isPublishing ? (isEdit ? "Зберігаємо..." : "Публікуємо...") : isEdit ? "Зберегти зміни" : "🚀 Опублікувати й отримати посилання";
  const update = (patch: Partial<VacancyContent>) => onChange({ ...content, ...patch });

  const previewVacancy: PublicVacancy = useMemo(
    () => ({
      slug: "preview",
      title: content.title,
      city: city.trim() || null,
      summary: content.summary,
      pay_hint: content.pay_hint,
      schedule: content.schedule,
      offer: content.offer,
      duties: content.duties,
      requirements: content.requirements,
      questions: content.questions,
      is_open: true,
    }),
    [content, city],
  );

  const updateQuestion = (index: number, patch: Partial<ScreeningQuestion>) => {
    const questions = content.questions.map((question, current) => {
      if (current !== index) return question;
      const next = { ...question, ...patch };
      if (patch.kind === "yes_no") next.options = ["Так", "Ні"];
      if (patch.kind === "text") next.options = [];
      if (patch.kind === "choice" && next.options.length < 2) next.options = ["Варіант 1", "Варіант 2"];
      if (next.knockout_answer && !next.options.includes(next.knockout_answer)) next.knockout_answer = null;
      return next;
    });
    update({ questions });
  };

  const removeQuestion = (index: number) => {
    update({ questions: content.questions.filter((_, current) => current !== index).map((q, i) => ({ ...q, id: `q${i + 1}` })) });
  };

  const addQuestion = () => {
    update({
      questions: [
        ...content.questions,
        { id: `q${content.questions.length + 1}`, text: "Нове питання", kind: "yes_no", options: ["Так", "Ні"], knockout_answer: null },
      ],
    });
  };

  return (
    <div className="fade-up pb-28 lg:pb-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="eyebrow-pill">{isEdit ? "Редагування" : "Крок 2 з 2 · перевірте й опублікуйте"}</span>
          <h1 className="section-title mt-4">{isEdit ? "Редагувати вакансію" : "Вакансія готова ✨"}</h1>
          <p className="body-copy mt-2 max-w-xl">
            {isEdit
              ? "Зміни одразу з'являться в анкеті за тим самим посиланням. Відгуки, що вже надійшли, збережуться."
              : "Усе можна редагувати. Праворуч — так анкету побачить кандидат на телефоні, спробуйте пройти її."}
          </p>
        </div>
        <button type="button" onClick={onRestart} className="text-link text-sm">
          {isEdit ? "← До кандидатів" : "← Описати інакше"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <section className="card space-y-4 p-5 md:p-6">
            <h2 className="panel-title">Основне</h2>
            <Field label="Назва посади">
              <input className="field-surface" value={content.title} onChange={(e) => update({ title: e.target.value })} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Оплата">
                <input className="field-surface" value={content.pay_hint} onChange={(e) => update({ pay_hint: e.target.value })} />
              </Field>
              <Field label="Графік">
                <input className="field-surface" value={content.schedule} onChange={(e) => update({ schedule: e.target.value })} />
              </Field>
            </div>
            {content.pay_note ? <p className="rounded-2xl bg-[var(--warn-soft)] px-4 py-3 text-sm text-[#7a5a0b]">💡 {content.pay_note}</p> : null}
            <Field label="Коротко, чому варто працювати у вас">
              <textarea className="field-surface min-h-[72px] resize-y" value={content.summary} onChange={(e) => update({ summary: e.target.value })} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Що пропонуєте (кожен пункт з нового рядка)">
                <textarea
                  className="field-surface min-h-[130px] resize-y"
                  value={content.offer.join("\n")}
                  onChange={(e) => update({ offer: linesToList(e.target.value) })}
                />
              </Field>
              <Field label="Обов'язкові вимоги">
                <textarea
                  className="field-surface min-h-[130px] resize-y"
                  value={content.requirements.join("\n")}
                  onChange={(e) => update({ requirements: linesToList(e.target.value) })}
                />
              </Field>
            </div>
          </section>

          <section className="card space-y-4 p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="panel-title">Анкета для кандидатів</h2>
                <p className="body-copy mt-1">
                  Позначте <span className="chip chip-bad">стоп-відповідь</span> — такі кандидати автоматично опиняться внизу списку.
                </p>
              </div>
            </div>
            <ol className="space-y-3">
              {content.questions.map((question, index) => (
                <li key={question.id} className="rounded-2xl border border-[var(--line-soft)] bg-[var(--bg-surface)] p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-2.5 text-sm font-extrabold text-[var(--text-soft)]">{index + 1}</span>
                    <div className="min-w-0 flex-1 space-y-2.5">
                      <input className="field-surface" value={question.text} onChange={(e) => updateQuestion(index, { text: e.target.value })} />
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="field-surface !w-auto !py-2 text-sm"
                          value={question.kind}
                          onChange={(e) => updateQuestion(index, { kind: e.target.value as ScreeningQuestionKind })}
                        >
                          <option value="yes_no">Так / Ні</option>
                          <option value="choice">Варіанти</option>
                          <option value="text">Вільна відповідь</option>
                        </select>
                        {question.kind !== "text" ? (
                          <select
                            className="field-surface !w-auto !py-2 text-sm"
                            value={question.knockout_answer ?? ""}
                            onChange={(e) => updateQuestion(index, { knockout_answer: e.target.value || null })}
                          >
                            <option value="">Без стоп-відповіді</option>
                            {question.options.map((option) => (
                              <option key={option} value={option}>
                                Стоп, якщо «{option}»
                              </option>
                            ))}
                          </select>
                        ) : null}
                        <button type="button" onClick={() => removeQuestion(index)} className="ml-auto text-sm font-bold text-[var(--text-soft)] hover:text-[var(--bad)]">
                          Видалити
                        </button>
                      </div>
                      {question.kind === "choice" ? (
                        <input
                          className="field-surface text-sm"
                          value={question.options.join(", ")}
                          onChange={(e) =>
                            updateQuestion(index, {
                              options: e.target.value.split(",").map((option) => option.trim()).filter(Boolean),
                            })
                          }
                          placeholder="Варіанти через кому"
                        />
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            {content.questions.length < 8 ? (
              <button type="button" onClick={addQuestion} className="btn-secondary w-full !py-3">
                + Додати питання
              </button>
            ) : null}
          </section>

          <section className="card space-y-3 p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="panel-title">Текст для Work.ua, OLX, Telegram</h2>
              <button
                type="button"
                className="chip transition hover:opacity-80"
                onClick={async () => {
                  setCopied(await copyText(content.posting_text));
                  window.setTimeout(() => setCopied(false), 1800);
                }}
              >
                {copied ? "Скопійовано ✓" : "Копіювати"}
              </button>
            </div>
            <p className="body-copy">Після публікації ми підставимо замість [посилання] справжній лінк на анкету.</p>
            <textarea
              className="field-surface min-h-[260px] resize-y font-[450] leading-relaxed"
              value={content.posting_text}
              onChange={(e) => update({ posting_text: e.target.value })}
            />
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="phone-frame mx-auto">
              <div className="h-[620px] overflow-y-auto px-4 pb-6 pt-5">
                <ApplyFlow vacancy={previewVacancy} preview />
              </div>
            </div>
            {error ? <p className="text-center text-sm font-semibold text-[var(--bad)]">{error}</p> : null}
            {isLimitReached ? <UpgradeLinks /> : null}
            <button type="button" className="btn-primary w-full text-[1rem] disabled:opacity-60" disabled={isPublishing} onClick={onPublish}>
              {primaryLabel}
            </button>
            {isEdit ? null : <p className="text-center text-xs text-[var(--text-soft)]">Безкоштовно: 1 вакансія і до 10 оцінених кандидатів</p>}
          </div>
        </aside>
      </div>

      <details className="card mt-5 p-4 lg:hidden">
        <summary className="cursor-pointer font-bold text-[var(--text-strong)]">📱 Подивитися анкету очима кандидата</summary>
        <div className="mt-4 rounded-2xl bg-[var(--bg-surface)] p-4">
          <ApplyFlow vacancy={previewVacancy} preview />
        </div>
      </details>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line-soft)] bg-white/95 p-3 backdrop-blur lg:hidden">
        {error ? <p className="mb-2 text-center text-sm font-semibold text-[var(--bad)]">{error}</p> : null}
        {isLimitReached ? <UpgradeLinks /> : null}
        <button type="button" className="btn-primary w-full disabled:opacity-60" disabled={isPublishing} onClick={onPublish}>
          {isEdit ? primaryLabel : isPublishing ? "Публікуємо..." : "🚀 Опублікувати"}
        </button>
      </div>
    </div>
  );
}

function UpgradeLinks() {
  return (
    <p className="mb-2 text-center text-sm">
      <Link href="/hire" className="text-link">Мої вакансії</Link>
      <span className="mx-2 text-[var(--text-soft)]">·</span>
      <Link href="/pricing" className="text-link">Перейти на Pro</Link>
    </p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-[var(--text-muted)]">{label}</span>
      {children}
    </label>
  );
}
