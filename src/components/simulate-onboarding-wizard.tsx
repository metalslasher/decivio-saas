"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import { buildAuthorizedHeaders, getAccessTokenFromSupabase } from "@/lib/auth-session-client";
import {
  currentMarketOptions,
  englishLevelOptions,
  jobSearchStatusOptions,
  resumeStatusOptions,
  seniorityLevelOptions,
  targetMarketOptions,
  type EnglishLevel,
  type JobSearchStatus,
  type ResumeStatus,
  type SeniorityLevel,
  type TargetMarket,
  type UpgradeGoal,
  upgradeGoalOptions
} from "@/lib/career-switch-form";

type WizardForm = {
  current_income: string;
  current_market: TargetMarket | "";
  current_role: string;
  current_experience_years: string;
  seniority_level: SeniorityLevel | "";
  target_role: string;
  upgrade_goal: UpgradeGoal | "";
  english_level: EnglishLevel | "";
  target_market: TargetMarket | "";
  job_search_status: JobSearchStatus | "";
  resume_status: ResumeStatus | "";
};

type WizardField = keyof WizardForm;
type FieldErrors = Partial<Record<WizardField, string>>;

const REQUIRED_ERROR = "Поле обов'язкове.";

const steps: Array<{ title: string; helper: string; fields: WizardField[] }> = [
  {
    title: "Дохід і ринок зараз",
    helper: "Потрібно зрозуміти вашу стартову точку: скільки ви отримуєте і на якому ринку працюєте.",
    fields: ["current_income", "current_market"]
  },
  {
    title: "Роль і досвід",
    helper: "Додайте вашу роль, стаж і рівень, щоб оцінка не була відірвана від реального профілю.",
    fields: ["current_role", "current_experience_years", "seniority_level"]
  },
  {
    title: "Що хочете покращити",
    helper: "Оберіть головну ціль. Якщо хочете залишитись у тій самій ролі, поле з бажаною роллю можна не заповнювати.",
    fields: ["upgrade_goal", "target_market"]
  },
  {
    title: "Готовність до пошуку",
    helper: "Ці відповіді допоможуть оцінити, що саме може стримувати кращі відповіді від роботодавців.",
    fields: ["english_level", "job_search_status", "resume_status"]
  }
];

const initialValues: WizardForm = {
  current_income: "",
  current_market: "",
  current_role: "",
  current_experience_years: "",
  seniority_level: "",
  target_role: "",
  upgrade_goal: "",
  english_level: "",
  target_market: "",
  job_search_status: "",
  resume_status: ""
};

const inputClassName = "field-surface mt-1 h-[3.3rem]";
const unitInputShellClassName =
  "mt-1 flex h-[3.3rem] w-full items-center overflow-hidden rounded-[1.2rem] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.72)] px-4 py-3 transition focus-within:border-[rgba(41,73,244,0.24)] focus-within:bg-white focus-within:shadow-[0_0_0_5px_rgba(63,94,255,0.08)]";
const unitInputClassName =
  "min-w-0 flex-1 bg-transparent text-[1rem] font-semibold text-[var(--text-strong)] outline-none placeholder:text-[var(--text-soft)]";
const unitLabelClassName = "ml-3 shrink-0 text-sm font-semibold text-[var(--text-soft)]";

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <span id={id} className="mt-1 block text-xs text-[var(--danger-strong)]">
      {message}
    </span>
  );
}

function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
  disabled,
  error
}: {
  id: string;
  label: string;
  value: T | "";
  placeholder: string;
  options: Array<{ value: T; label: string }>;
  onChange: (nextValue: T | "") => void;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]" htmlFor={id}>
      {label}
      <div className="relative mt-1">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value as T | "")}
          className="field-surface h-[3.3rem] appearance-none pr-11"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[0.72rem] text-[var(--text-soft)]">
          ▼
        </span>
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </label>
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
          current_market: values.current_market,
          current_role: values.current_role,
          current_experience_years: Number(values.current_experience_years),
          seniority_level: values.seniority_level,
          target_role: values.target_role,
          upgrade_goal: values.upgrade_goal,
          english_level: values.english_level,
          target_market: values.target_market,
          job_search_status: values.job_search_status,
          resume_status: values.resume_status
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
  const dimmedFormClassName = isSubmitting
    ? "pointer-events-none select-none blur-[3px] opacity-45 transition duration-200"
    : "transition duration-200";
  const dimmedBackButtonClassName = isSubmitting
    ? "pointer-events-none select-none blur-[3px] opacity-45 transition duration-200"
    : "transition duration-200";

  return (
    <section className="space-y-6 py-4 md:space-y-8 md:py-8">
      <header className="mx-auto max-w-3xl space-y-3 text-center">
        <h1 className="page-title mx-auto max-w-[13ch]">
          Оцініть <span className="text-accent">свій дохід</span>
        </h1>
        <p className="lead-copy">
          Дайте кілька фактів про роль, ринок і пошук, а ми покажемо, де зараз є простір для кращої пропозиції.
        </p>
      </header>

      <div className="surface-panel relative overflow-hidden rounded-[2rem] p-5 md:p-7" aria-busy={isSubmitting}>
        {isSubmitting ? <div className="absolute inset-0 z-10 rounded-[2rem] bg-white/40 backdrop-blur-[2px]" aria-hidden="true" /> : null}
        <div className={dimmedFormClassName}>
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

          <fieldset disabled={isSubmitting} className="m-0 min-w-0 border-0 p-0">
            <div key={currentStep} className="wizard-step-enter mt-6 space-y-5">
              <div className="space-y-2">
                <h2 className="section-title">{currentMeta.title}</h2>
                <p className="body-copy">{currentMeta.helper}</p>
              </div>

              {currentStep === 0 ? (
                <div className="grid gap-4 md:grid-cols-[minmax(0,1.05fr)_minmax(14rem,0.95fr)]">
                  <div className="grid gap-2">
                    <label className="sr-only" htmlFor="current-income">
                      Поточний чистий дохід
                    </label>
                    <div className={unitInputShellClassName}>
                      <input
                        id="current-income"
                        type="number"
                        min={0}
                        inputMode="decimal"
                        value={values.current_income}
                        onChange={(event) => updateValue("current_income", event.target.value)}
                        className={unitInputClassName}
                        aria-invalid={Boolean(errors.current_income)}
                        aria-describedby={errors.current_income ? "current-income-error" : undefined}
                        disabled={isSubmitting}
                      />
                      <span className={unitLabelClassName}>грн/міс</span>
                    </div>
                    <FieldError id="current-income-error" message={errors.current_income} />
                  </div>

                  <SelectField
                    id="current-market"
                    label="Поточний ринок"
                    value={values.current_market}
                    options={currentMarketOptions}
                    placeholder="Оберіть ринок"
                    onChange={(nextValue) => updateValue("current_market", nextValue)}
                    disabled={isSubmitting}
                    error={errors.current_market}
                  />
                </div>
              ) : null}

            {currentStep === 1 ? (
              <div className="grid gap-4 lg:grid-cols-3">
                <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]" htmlFor="current-role">
                  Поточна роль
                  <input
                    id="current-role"
                    type="text"
                    value={values.current_role}
                    onChange={(event) => updateValue("current_role", event.target.value)}
                    className={inputClassName}
                    aria-invalid={Boolean(errors.current_role)}
                    aria-describedby={errors.current_role ? "current-role-error" : undefined}
                    autoComplete="off"
                    disabled={isSubmitting}
                  />
                  <FieldError id="current-role-error" message={errors.current_role} />
                </label>

                <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]" htmlFor="current-experience-years">
                  Стаж у поточній сфері
                  <div className={unitInputShellClassName}>
                    <input
                      id="current-experience-years"
                      type="number"
                      min={0}
                      max={60}
                      step="0.5"
                      inputMode="decimal"
                      value={values.current_experience_years}
                      onChange={(event) => updateValue("current_experience_years", event.target.value)}
                      className={unitInputClassName}
                      aria-invalid={Boolean(errors.current_experience_years)}
                      aria-describedby={errors.current_experience_years ? "current-experience-years-error" : undefined}
                      disabled={isSubmitting}
                    />
                    <span className={unitLabelClassName}>років</span>
                  </div>
                  <FieldError id="current-experience-years-error" message={errors.current_experience_years} />
                </label>

                <SelectField
                  id="seniority-level"
                  label="Ваш рівень у ролі"
                  value={values.seniority_level}
                  options={seniorityLevelOptions}
                  placeholder="Оберіть рівень"
                  onChange={(nextValue) => updateValue("seniority_level", nextValue)}
                  disabled={isSubmitting}
                  error={errors.seniority_level}
                />
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div className="grid gap-4 lg:grid-cols-3">
                <SelectField
                  id="upgrade-goal"
                  label="Головна ціль"
                  value={values.upgrade_goal}
                  options={upgradeGoalOptions}
                  placeholder="Оберіть ціль"
                  onChange={(nextValue) => updateValue("upgrade_goal", nextValue)}
                  disabled={isSubmitting}
                  error={errors.upgrade_goal}
                />

                <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]" htmlFor="target-role">
                  Бажана роль або тип вакансій
                  <input
                    id="target-role"
                    type="text"
                    value={values.target_role}
                    onChange={(event) => updateValue("target_role", event.target.value)}
                    className={inputClassName}
                    aria-invalid={Boolean(errors.target_role)}
                    aria-describedby={errors.target_role ? "target-role-error" : undefined}
                    autoComplete="off"
                    disabled={isSubmitting}
                  />
                  <span className="mt-1 block text-xs leading-[1.5] text-[var(--text-soft)]">
                    Якщо роль не змінюєте, можна залишити порожнім.
                  </span>
                  <FieldError id="target-role-error" message={errors.target_role} />
                </label>

                <SelectField
                  id="target-market"
                  label="Ринок для покращення"
                  value={values.target_market}
                  options={targetMarketOptions}
                  placeholder="Оберіть ринок"
                  onChange={(nextValue) => updateValue("target_market", nextValue)}
                  disabled={isSubmitting}
                  error={errors.target_market}
                />
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div className="grid gap-4 lg:grid-cols-3">
                <SelectField
                  id="english-level"
                  label="Рівень англійської"
                  value={values.english_level}
                  options={englishLevelOptions}
                  placeholder="Оберіть рівень"
                  onChange={(nextValue) => updateValue("english_level", nextValue)}
                  disabled={isSubmitting}
                  error={errors.english_level}
                />

                <SelectField
                  id="job-search-status"
                  label="Стан пошуку"
                  value={values.job_search_status}
                  options={jobSearchStatusOptions}
                  placeholder="Оберіть стан"
                  onChange={(nextValue) => updateValue("job_search_status", nextValue)}
                  disabled={isSubmitting}
                  error={errors.job_search_status}
                />

                <SelectField
                  id="resume-status"
                  label="Стан резюме"
                  value={values.resume_status}
                  options={resumeStatusOptions}
                  placeholder="Оберіть стан"
                  onChange={(nextValue) => updateValue("resume_status", nextValue)}
                  disabled={isSubmitting}
                  error={errors.resume_status}
                />
              </div>
            ) : null}

              {requestError ? (
                <p className="rounded-[1.3rem] border border-[rgba(201,155,134,0.5)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-strong)]">
                  {requestError}
                </p>
              ) : null}
            </div>
          </fieldset>
        </div>

        <div className="relative mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className={dimmedBackButtonClassName}>
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Назад
            </button>
          </div>

          <button
            type="button"
            onClick={isLastStep ? handleSubmit : handleNext}
            disabled={isSubmitting}
            className="btn-primary relative z-20 disabled:cursor-wait disabled:opacity-100"
          >
            {isLastStep ? (isSubmitting ? "Формуємо висновок..." : "Отримати мій висновок") : "Далі"}
          </button>
        </div>
      </div>
    </section>
  );
}
