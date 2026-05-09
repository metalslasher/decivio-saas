"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import { buildAuthorizedHeaders, getAccessTokenFromSupabase } from "@/lib/auth-session-client";
import {
  englishLevelOptions,
  experienceLevelOptions,
  isSameRoleText,
  targetMarketOptions,
  transitionPriorityOptions,
  type EnglishLevel,
  type ExperienceLevel,
  type TargetMarket,
  type TransitionPriority
} from "@/lib/career-switch-form";

type WizardForm = {
  current_income: string;
  current_role: string;
  current_experience_years: string;
  target_role: string;
  experience_level: ExperienceLevel | "";
  english_level: EnglishLevel | "";
  target_market: TargetMarket | "";
  transition_priority: TransitionPriority | "";
};

type WizardField = keyof WizardForm;
type FieldErrors = Partial<Record<WizardField, string>>;

const REQUIRED_ERROR = "Поле обов'язкове.";

const steps: Array<{ title: string; helper: string; fields: WizardField[] }> = [
  {
    title: "Ваш поточний дохід",
    helper: "Це потрібно, щоб відштовхуватись від вашої реальної стартової точки.",
    fields: ["current_income"]
  },
  {
    title: "Де ви зараз",
    helper: "Опишіть поточну роль і скільки років ви вже в ній працюєте.",
    fields: ["current_role", "current_experience_years"]
  },
  {
    title: "Куди хочете перейти",
    helper: "Вкажіть цільову роль і наскільки ви вже дотичні до неї.",
    fields: ["target_role", "experience_level"]
  },
  {
    title: "Що ще врахувати",
    helper: "Ці відповіді допомагають зробити висновок значно менш шаблонним і ближчим саме до вашої ситуації.",
    fields: ["english_level", "target_market", "transition_priority"]
  }
];

const initialValues: WizardForm = {
  current_income: "",
  current_role: "",
  current_experience_years: "",
  target_role: "",
  experience_level: "",
  english_level: "",
  target_market: "",
  transition_priority: ""
};

const inputClassName = "field-surface mt-1";
const radioCardClassName = "cursor-pointer rounded-[1.2rem] border px-4 py-3 text-sm font-medium transition";

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function RadioCards<T extends string>({
  name,
  value,
  options,
  onChange,
  disabled = false
}: {
  name: string;
  value: T | "";
  options: Array<{ value: T; label: string }>;
  onChange: (nextValue: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      {options.map((item) => (
        <label
          key={item.value}
          className={`${radioCardClassName} ${
            value === item.value
              ? "border-[rgba(63,94,255,0.22)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
              : "border-[var(--line-soft)] bg-[rgba(255,255,255,0.74)] text-[var(--text-muted)] hover:border-[rgba(63,94,255,0.16)] hover:bg-white"
          } ${disabled ? "pointer-events-none opacity-60" : ""}`}
        >
          <input
            type="radio"
            name={name}
            value={item.value}
            checked={value === item.value}
            onChange={() => onChange(item.value)}
            className="sr-only"
            disabled={disabled}
          />
          {item.label}
        </label>
      ))}
    </div>
  );
}

export function SimulateOnboardingWizard() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<WizardForm>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateValue = (field: WizardField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateStep = (stepIndex: number) => {
    const fields = steps[stepIndex].fields;
    const nextErrors: FieldErrors = {};

    for (const field of fields) {
      if (values[field].trim() === "") {
        nextErrors[field] = REQUIRED_ERROR;
      }
    }

    if (stepIndex === 0) {
      const rawIncome = values.current_income;
      if (rawIncome.trim() !== "") {
        const parsedIncome = parseNumber(rawIncome);
        if (parsedIncome === null) {
          nextErrors.current_income = "Дохід: введіть коректне число.";
        } else if (parsedIncome < 0) {
          nextErrors.current_income = "Дохід: значення не може бути меншим за 0.";
        }
      }
    }

    if (stepIndex === 1) {
      const rawYears = values.current_experience_years;
      if (rawYears.trim() !== "") {
        const parsedYears = parseNumber(rawYears);
        if (parsedYears === null) {
          nextErrors.current_experience_years = "Стаж: введіть коректне число.";
        } else if (parsedYears < 0) {
          nextErrors.current_experience_years = "Стаж: значення не може бути меншим за 0.";
        } else if (parsedYears > 60) {
          nextErrors.current_experience_years = "Стаж: введіть реалістичне значення (до 60 років).";
        }
      }
    }

    if (stepIndex === 2 && values.current_role !== "" && isSameRoleText(values.current_role, values.target_role)) {
      nextErrors.target_role = "Цільова роль має відрізнятись від поточної.";
    }

    setErrors((prev) => {
      const filtered = { ...prev };
      for (const field of fields) {
        delete filtered[field];
      }
      return { ...filtered, ...nextErrors };
    });

    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    setRequestError(null);

    if (!validateStep(currentStep)) {
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setRequestError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setRequestError(null);

    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const accessToken = await getAccessTokenFromSupabase(supabase);
      const response = await fetch("/api/simulations", {
        method: "POST",
        headers: buildAuthorizedHeaders(accessToken, {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          current_income: Number(values.current_income),
          current_role: values.current_role,
          current_experience_years: Number(values.current_experience_years),
          target_role: values.target_role,
          experience_level: values.experience_level,
          english_level: values.english_level,
          target_market: values.target_market,
          transition_priority: values.transition_priority
        })
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; simulationId?: string; redirectTo?: string }
        | null;

      if (!response.ok || !data?.simulationId) {
        setRequestError(data?.error ?? "Не вдалося сформувати висновок. Спробуйте ще раз.");
        return;
      }

      router.push(`${data.redirectTo ?? "/results"}?simulationId=${encodeURIComponent(data.simulationId)}`);
    } catch {
      setRequestError("Сталася помилка мережі. Перевірте підключення і повторіть спробу.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentMeta = steps[currentStep];

  return (
    <section className="space-y-6 py-4 md:space-y-8 md:py-8">
      <header className="mx-auto max-w-2xl space-y-3 text-center">
        <h1 className="page-title mx-auto max-w-[9ch]">Симуляція</h1>
        <p className="lead-copy">
          Заповніть кілька деталей, щоб оцінити свій сценарій переходу, ризики та наступний крок.
        </p>
      </header>

      <div className="surface-panel relative rounded-[2rem] p-5 md:p-7" aria-busy={isSubmitting}>
        {isSubmitting ? <div className="absolute inset-0 z-10 rounded-[2rem] bg-white/45 backdrop-blur-[1px]" aria-hidden="true" /> : null}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-soft)]">
            <span>Крок {currentStep + 1} з {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--line-soft)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <fieldset disabled={isSubmitting} className="relative z-20 m-0 min-w-0 border-0 p-0">
          <div key={currentStep} className="wizard-step-enter mt-6 space-y-5">
            <div className="space-y-2">
              <h2 className="section-title">{currentMeta.title}</h2>
              <p className="body-copy">{currentMeta.helper}</p>
            </div>

              {currentStep === 0 ? (
                <div className="grid gap-4">
                  <label className="text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                    Поточний чистий дохід (грн/міс)
                    <input
                      type="number"
                      min={0}
                      inputMode="decimal"
                      value={values.current_income}
                      onChange={(event) => updateValue("current_income", event.target.value)}
                      className={inputClassName}
                      aria-invalid={Boolean(errors.current_income)}
                      disabled={isSubmitting}
                    />
                    {errors.current_income ? <span className="mt-1 block text-xs text-[var(--danger-strong)]">{errors.current_income}</span> : null}
                  </label>
                </div>
              ) : null}

              {currentStep === 1 ? (
                <div className="space-y-4">
                  <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]" htmlFor="current-role">
                    Поточна роль
                    <input
                      id="current-role"
                      type="text"
                      value={values.current_role}
                      onChange={(event) => updateValue("current_role", event.target.value)}
                      className={inputClassName}
                      aria-invalid={Boolean(errors.current_role)}
                      autoComplete="off"
                      disabled={isSubmitting}
                    />
                  </label>
                  {errors.current_role ? <span className="block text-xs text-[var(--danger-strong)]">{errors.current_role}</span> : null}

                  <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                    Стаж у поточній сфері (років)
                    <input
                      type="number"
                      min={0}
                      max={60}
                      step="0.5"
                      inputMode="decimal"
                      value={values.current_experience_years}
                      onChange={(event) => updateValue("current_experience_years", event.target.value)}
                      className={inputClassName}
                      aria-invalid={Boolean(errors.current_experience_years)}
                      disabled={isSubmitting}
                    />
                    {errors.current_experience_years ? (
                      <span className="mt-1 block text-xs text-[var(--danger-strong)]">{errors.current_experience_years}</span>
                    ) : null}
                  </label>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]" htmlFor="target-role">
                      Цільова роль
                      <input
                        id="target-role"
                        type="text"
                        value={values.target_role}
                        onChange={(event) => updateValue("target_role", event.target.value)}
                        className={inputClassName}
                        aria-invalid={Boolean(errors.target_role)}
                        autoComplete="off"
                        disabled={isSubmitting}
                      />
                    </label>
                    {errors.target_role ? <span className="block text-xs text-[var(--danger-strong)]">{errors.target_role}</span> : null}
                  </div>

                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium leading-[1.6] text-[var(--text-muted)]">Релевантний досвід у цій ролі</legend>
                    <RadioCards
                      name="experience-level"
                      value={values.experience_level}
                      options={experienceLevelOptions}
                      onChange={(nextValue) => updateValue("experience_level", nextValue)}
                      disabled={isSubmitting}
                    />
                    {errors.experience_level ? <span className="block text-xs text-[var(--danger-strong)]">{errors.experience_level}</span> : null}
                  </fieldset>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="space-y-5">
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium leading-[1.6] text-[var(--text-muted)]">Рівень англійської</legend>
                    <RadioCards
                      name="english-level"
                      value={values.english_level}
                      options={englishLevelOptions}
                      onChange={(nextValue) => updateValue("english_level", nextValue)}
                      disabled={isSubmitting}
                    />
                    {errors.english_level ? <span className="block text-xs text-[var(--danger-strong)]">{errors.english_level}</span> : null}
                  </fieldset>

                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium leading-[1.6] text-[var(--text-muted)]">Куди орієнтуєтесь по ринку</legend>
                    <RadioCards
                      name="target-market"
                      value={values.target_market}
                      options={targetMarketOptions}
                      onChange={(nextValue) => updateValue("target_market", nextValue)}
                      disabled={isSubmitting}
                    />
                    {errors.target_market ? <span className="block text-xs text-[var(--danger-strong)]">{errors.target_market}</span> : null}
                  </fieldset>

                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium leading-[1.6] text-[var(--text-muted)]">Що важливіше зараз</legend>
                    <RadioCards
                      name="transition-priority"
                      value={values.transition_priority}
                      options={transitionPriorityOptions}
                      onChange={(nextValue) => updateValue("transition_priority", nextValue)}
                      disabled={isSubmitting}
                    />
                    {errors.transition_priority ? (
                      <span className="block text-xs text-[var(--danger-strong)]">{errors.transition_priority}</span>
                    ) : null}
                  </fieldset>
                </div>
              ) : null}

              {requestError ? (
                <p className="rounded-[1.3rem] border border-[rgba(201,155,134,0.5)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-strong)]">
                  {requestError}
                </p>
              ) : null}
            </div>
          </fieldset>

          <div className="relative z-20 mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Назад
            </button>

            <button
              type="button"
              onClick={isLastStep ? handleSubmit : handleNext}
              disabled={isSubmitting}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLastStep ? (isSubmitting ? "Формуємо висновок..." : "Отримати мій висновок") : "Далі"}
            </button>
          </div>
      </div>
    </section>
  );
}
