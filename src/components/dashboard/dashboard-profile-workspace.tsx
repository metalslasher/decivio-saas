import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  englishLevelOptions,
  experienceLevelOptions,
  targetMarketOptions,
  transitionPriorityOptions,
  type EnglishLevel,
  type ExperienceLevel,
  type TargetMarket,
  type TransitionPriority,
} from "@/lib/career-switch-form";
import { PASSWORD_POLICY_HINT, validateStrongPassword } from "@/lib/password-policy";
import {
  jobSearchStageOptions,
  workPreferenceOptions,
  type JobSearchStage,
  type ProfileContext,
  type WorkPreference,
} from "@/lib/profile-context";
import { LockIcon, UploadIcon } from "./icons";
import { DashboardAvatar, DashboardChip, DashboardMetricCard } from "./dashboard-primitives";
import type { DashboardUserProfile, ProfileDraft } from "./types";
import {
  buildMissingProfileItems,
  buildProfileCompletion,
  buildProfileDraft,
  getBrowserTimeZone,
  getErrorMessage,
  getShortProfileLabel,
  isMissingAvatarStorageSetup,
  isMissingProfileExtensionSchema,
  mapJobSearchStageLabel,
  mapWorkPreferenceLabel,
  normalizeOptionalInput,
  normalizeOptionalUrl,
  parseOptionalNumberInput,
} from "./dashboard-utils";

export function DashboardProfileWorkspace({
  supabase,
  userId,
  email,
  profile,
  onProfileSaved,
}: {
  supabase: SupabaseClient;
  userId: string;
  email: string;
  profile: DashboardUserProfile;
  onProfileSaved: (profile: DashboardUserProfile) => void;
}) {
  const browserTimeZone = useMemo(() => getBrowserTimeZone(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>(() =>
    buildProfileDraft(profile, browserTimeZone),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarNotice, setAvatarNotice] = useState<string | null>(null);
  const [isAvatarBusy, setIsAvatarBusy] = useState(false);
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const updateDraft = <K extends keyof ProfileDraft>(
    key: K,
    value: ProfileDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const missingItems = useMemo(
    () =>
      buildMissingProfileItems(
        profile.context,
        profile.fullName,
        profile.avatarUrl,
      ),
    [profile.avatarUrl, profile.context, profile.fullName],
  );

  const profileHeading = getShortProfileLabel(draft.full_name.trim(), email);
  const profileAvatarLabel = draft.full_name.trim() || email;
  const profileCurrentRole = normalizeOptionalInput(draft.current_role);
  const profileTargetRole = normalizeOptionalInput(draft.target_role);
  const workPreference = mapWorkPreferenceLabel(draft.work_preference || null);
  const jobSearchStage = mapJobSearchStageLabel(draft.job_search_stage || null);
  const profileHeroSummary =
    missingItems.length > 0
      ? "Тут видно короткий зріз профілю, а нижче можна дозібрати стабільний контекст для аналізу вакансій."
      : "Профіль уже зібраний: нижче можна швидко оновити основні дані, пароль і додатковий контекст в одному місці.";

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);
    setSaveNotice(null);

    const currentIncome = parseOptionalNumberInput(
      draft.current_income,
      "Поточний дохід",
    );
    if (currentIncome.error) {
      setSaveError(currentIncome.error);
      return;
    }

    const currentExperienceYears = parseOptionalNumberInput(
      draft.current_experience_years,
      "Стаж у поточній сфері",
      { max: 60 },
    );
    if (currentExperienceYears.error) {
      setSaveError(currentExperienceYears.error);
      return;
    }

    const weeklyLearningHours = parseOptionalNumberInput(
      draft.weekly_learning_hours,
      "Години на підготовку за тиждень",
      { max: 80, integer: true },
    );
    if (weeklyLearningHours.error) {
      setSaveError(weeklyLearningHours.error);
      return;
    }

    const linkedinUrl = normalizeOptionalUrl(draft.linkedin_url, "LinkedIn");
    if (linkedinUrl.error) {
      setSaveError(linkedinUrl.error);
      return;
    }

    const portfolioUrl = normalizeOptionalUrl(draft.portfolio_url, "Портфоліо");
    if (portfolioUrl.error) {
      setSaveError(portfolioUrl.error);
      return;
    }

    const nextContext: ProfileContext = {
      city: normalizeOptionalInput(draft.city),
      current_income: currentIncome.value,
      current_role: normalizeOptionalInput(draft.current_role),
      current_experience_years: currentExperienceYears.value,
      target_role: normalizeOptionalInput(draft.target_role),
      experience_level: draft.experience_level || null,
      english_level: draft.english_level || null,
      target_market: draft.target_market || null,
      transition_priority: draft.transition_priority || null,
      weekly_learning_hours: weeklyLearningHours.value,
      work_preference: draft.work_preference || null,
      job_search_stage: draft.job_search_stage || null,
      linkedin_url: linkedinUrl.value,
      portfolio_url: portfolioUrl.value,
      focus_note: normalizeOptionalInput(draft.focus_note),
    };

    const nextFullName = normalizeOptionalInput(draft.full_name);
    const nextTimezone = normalizeOptionalInput(draft.timezone);

    setIsSaving(true);

    try {
      const baseProfileUpdate = {
        full_name: nextFullName,
        timezone: nextTimezone,
      };

      let usedFallbackSave = false;
      let { error } = await supabase
        .from("profiles")
        .update({
          ...baseProfileUpdate,
          profile_context: nextContext,
        })
        .eq("id", userId);

      if (error && isMissingProfileExtensionSchema(error)) {
        usedFallbackSave = true;
        const fallbackResponse = await supabase
          .from("profiles")
          .update(baseProfileUpdate)
          .eq("id", userId);
        error = fallbackResponse.error;
      }

      if (error) {
        setSaveError(error.message);
        return;
      }

      const nextProfile = {
        fullName: nextFullName,
        timezone: nextTimezone,
        avatarUrl: draft.avatar_url,
        context: nextContext,
        completion: buildProfileCompletion(
          nextFullName,
          draft.avatar_url,
          nextContext,
        ),
      };

      onProfileSaved(nextProfile);
      setSaveNotice(
        usedFallbackSave
          ? "Основні дані профілю оновлено. Для повного збереження додаткового контексту потрібно застосувати останню міграцію бази даних."
          : "Профіль оновлено.",
      );
    } catch (error) {
      setSaveError(getErrorMessage(error) || "Не вдалося зберегти профіль.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Аватар підтримує лише PNG, JPG або WEBP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Розмір аватара має бути до 2 MB.");
      return;
    }

    setAvatarError(null);
    setAvatarNotice(null);
    setIsAvatarBusy(true);

    try {
      const avatarPath = `${userId}/avatar`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(avatarPath, file, {
          upsert: true,
          cacheControl: "3600",
          contentType: file.type,
        });

      if (uploadError) {
        setAvatarError(
          isMissingAvatarStorageSetup(uploadError)
            ? "Аватари ще не ввімкнені на поточній базі даних. Потрібно застосувати останню міграцію Supabase."
            : uploadError.message,
        );
        return;
      }

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(avatarPath);
      const nextAvatarUrl = `${data.publicUrl}?v=${Date.now()}`;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: nextAvatarUrl })
        .eq("id", userId);

      if (profileError) {
        setAvatarError(
          isMissingProfileExtensionSchema(profileError)
            ? "Поле для аватара ще не доступне в поточній базі даних. Потрібно застосувати останню міграцію Supabase."
            : profileError.message,
        );
        return;
      }

      updateDraft("avatar_url", nextAvatarUrl);
      onProfileSaved({
        ...profile,
        avatarUrl: nextAvatarUrl,
        completion: buildProfileCompletion(
          profile.fullName,
          nextAvatarUrl,
          profile.context,
        ),
      });
      setAvatarNotice("Аватар оновлено.");
    } catch (error) {
      setAvatarError(
        error instanceof Error ? error.message : "Не вдалося оновити аватар.",
      );
    } finally {
      setIsAvatarBusy(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarError(null);
    setAvatarNotice(null);
    setIsAvatarBusy(true);

    try {
      await supabase.storage.from("avatars").remove([`${userId}/avatar`]);
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

      if (error) {
        setAvatarError(
          isMissingProfileExtensionSchema(error)
            ? "Поле для аватара ще не доступне в поточній базі даних. Потрібно застосувати останню міграцію Supabase."
            : error.message,
        );
        return;
      }

      updateDraft("avatar_url", null);
      onProfileSaved({
        ...profile,
        avatarUrl: null,
        completion: buildProfileCompletion(
          profile.fullName,
          null,
          profile.context,
        ),
      });
      setAvatarNotice("Аватар прибрано.");
    } catch (error) {
      setAvatarError(getErrorMessage(error) || "Не вдалося прибрати аватар.");
    } finally {
      setIsAvatarBusy(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordNotice(null);

    const passwordValidationError = validateStrongPassword(nextPassword);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    if (nextPassword !== confirmPassword) {
      setPasswordError("Паролі не збігаються.");
      return;
    }

    setIsPasswordSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: nextPassword,
      });

      if (error) {
        setPasswordError(error.message);
        return;
      }

      setNextPassword("");
      setConfirmPassword("");
      setPasswordNotice("Пароль оновлено.");
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Не вдалося оновити пароль.",
      );
    } finally {
      setIsPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr),22rem]">
        <article className="dashboard-spotlight-card rounded-[2.3rem] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardChip tone="accent">Профіль</DashboardChip>
            <DashboardChip
              tone={profile.completion >= 80 ? "success" : "default"}
            >
              {profile.completion}% заповнення
            </DashboardChip>
          </div>

          <h1 className="mt-5 max-w-[15ch] text-[2.2rem] font-semibold leading-[0.94] tracking-[-0.055em] text-[var(--text-strong)] md:text-[3.05rem]">
            Контекст для вакансій і подачі
          </h1>
          <p className="mt-5 max-w-3xl text-[1rem] leading-[1.78] text-[var(--text-muted)]">
            {profileHeroSummary}
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardMetricCard
              label="Поточна роль"
              value={profileCurrentRole ?? "ще не вказано"}
              description="Підтягується з онбордингу або редагується вручну."
            />
            <DashboardMetricCard
              label="Цільова роль"
              value={profileTargetRole ?? "ще не вказано"}
              description="Головний орієнтир для аналізу вакансій."
            />
            <DashboardMetricCard
              label="Формат роботи"
              value={workPreference ?? "ще не вказано"}
              description="Дає контекст для вакансій і очікувань від ролі."
            />
            <DashboardMetricCard
              label="Стадія пошуку"
              value={jobSearchStage ?? "ще не вказано"}
              description="Допомагає підлаштовувати наступні кроки під ваш ритм."
            />
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-5 md:p-6">
          <div className="flex items-start gap-4">
            <DashboardAvatar
              label={profileAvatarLabel}
              avatarUrl={draft.avatar_url}
              sizeClassName="h-20 w-20"
              textClassName="text-xl font-semibold"
            />
            <div className="min-w-0">
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">
                Ваш профіль
              </p>
              <h2 className="mt-2 break-words text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)] [overflow-wrap:anywhere]">
                {profileHeading}
              </h2>
              <p className="mt-2 break-all text-[0.92rem] leading-[1.7] text-[var(--text-muted)]">
                {email}
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarUpload}
          />

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAvatarBusy}
              className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="inline-flex items-center gap-2">
                <UploadIcon />
                {isAvatarBusy ? "Оновлюємо..." : "Оновити аватар"}
              </span>
            </button>
            {draft.avatar_url ? (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={isAvatarBusy}
                className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-70"
              >
                Прибрати аватар
              </button>
            ) : null}
          </div>

          {avatarError ? (
            <p className="mt-4 rounded-[1.2rem] border border-[rgba(201,155,134,0.5)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-strong)]">
              {avatarError}
            </p>
          ) : null}

          {avatarNotice ? (
            <p className="mt-4 rounded-[1.2rem] border border-[rgba(63,94,255,0.16)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-strong)]">
              {avatarNotice}
            </p>
          ) : null}

          <div className="mt-5 space-y-3">
            {missingItems.length > 0 ? (
              missingItems.map((item) => (
                <div key={item} className="surface-soft rounded-[1.2rem] p-4">
                  <p className="text-[0.92rem] leading-[1.68] text-[var(--text-muted)]">
                    {item}
                  </p>
                </div>
              ))
            ) : (
              <div className="surface-soft rounded-[1.2rem] p-4">
                <p className="text-[0.92rem] leading-[1.68] text-[var(--text-muted)]">
                  Профіль виглядає зібрано. Його контекст уже можна
                  використовувати для перевірки вакансій.
                </p>
              </div>
            )}
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr),22rem]">
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <article className="surface-panel rounded-[2rem] p-5 md:p-6">
            <div>
              <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
                Основне
              </h2>
              <p className="mt-3 text-[0.94rem] leading-[1.72] text-[var(--text-muted)]">
                Базові дані профілю та сигнали, які варто не вводити повторно
                перед кожною перевіркою вакансії.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Ім&rsquo;я
                <input
                  value={draft.full_name}
                  onChange={(event) =>
                    updateDraft("full_name", event.target.value)
                  }
                  className="field-surface mt-1"
                  placeholder="Як до вас звертатись"
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Email
                <input
                  value={email}
                  readOnly
                  className="field-surface mt-1 opacity-75"
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Часовий пояс
                <input
                  value={draft.timezone}
                  onChange={(event) =>
                    updateDraft("timezone", event.target.value)
                  }
                  className="field-surface mt-1"
                  placeholder="Europe/Kiev"
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Місто / база
                <input
                  value={draft.city}
                  onChange={(event) => updateDraft("city", event.target.value)}
                  className="field-surface mt-1"
                  placeholder="Київ"
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Бажаний формат роботи
                <select
                  value={draft.work_preference}
                  onChange={(event) =>
                    updateDraft(
                      "work_preference",
                      event.target.value as WorkPreference | "",
                    )
                  }
                  className="field-surface mt-1"
                >
                  <option value="">Оберіть формат</option>
                  {workPreferenceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Стадія пошуку
                <select
                  value={draft.job_search_stage}
                  onChange={(event) =>
                    updateDraft(
                      "job_search_stage",
                      event.target.value as JobSearchStage | "",
                    )
                  }
                  className="field-surface mt-1"
                >
                  <option value="">Оберіть стадію</option>
                  {jobSearchStageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </article>

          <article className="surface-panel rounded-[2rem] p-5 md:p-6">
            <div>
              <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
                Кар&rsquo;єрний контекст
              </h2>
              <p className="mt-3 text-[0.94rem] leading-[1.72] text-[var(--text-muted)]">
                Ці поля підтягуються з останнього онбордингу, але тут їх можна
                тримати як стабільну базу для Vacancy Fit.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Поточна роль
                <input
                  value={draft.current_role}
                  onChange={(event) =>
                    updateDraft("current_role", event.target.value)
                  }
                  className="field-surface mt-1"
                  placeholder="Наприклад, Sales Manager"
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Цільова роль
                <input
                  value={draft.target_role}
                  onChange={(event) =>
                    updateDraft("target_role", event.target.value)
                  }
                  className="field-surface mt-1"
                  placeholder="Наприклад, Product Manager"
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Поточний чистий дохід, грн/міс
                <input
                  value={draft.current_income}
                  onChange={(event) =>
                    updateDraft("current_income", event.target.value)
                  }
                  className="field-surface mt-1"
                  inputMode="numeric"
                  placeholder="35000"
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Стаж у поточній сфері
                <input
                  value={draft.current_experience_years}
                  onChange={(event) =>
                    updateDraft("current_experience_years", event.target.value)
                  }
                  className="field-surface mt-1"
                  inputMode="decimal"
                  placeholder="4"
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Релевантний досвід
                <select
                  value={draft.experience_level}
                  onChange={(event) =>
                    updateDraft(
                      "experience_level",
                      event.target.value as ExperienceLevel | "",
                    )
                  }
                  className="field-surface mt-1"
                >
                  <option value="">Оберіть рівень</option>
                  {experienceLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Англійська
                <select
                  value={draft.english_level}
                  onChange={(event) =>
                    updateDraft(
                      "english_level",
                      event.target.value as EnglishLevel | "",
                    )
                  }
                  className="field-surface mt-1"
                >
                  <option value="">Оберіть рівень</option>
                  {englishLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Ринок
                <select
                  value={draft.target_market}
                  onChange={(event) =>
                    updateDraft(
                      "target_market",
                      event.target.value as TargetMarket | "",
                    )
                  }
                  className="field-surface mt-1"
                >
                  <option value="">Оберіть ринок</option>
                  {targetMarketOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Пріоритет переходу
                <select
                  value={draft.transition_priority}
                  onChange={(event) =>
                    updateDraft(
                      "transition_priority",
                      event.target.value as TransitionPriority | "",
                    )
                  }
                  className="field-surface mt-1"
                >
                  <option value="">Оберіть пріоритет</option>
                  {transitionPriorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </article>

          <article className="surface-panel rounded-[2rem] p-5 md:p-6">
            <div>
              <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
                Додатковий контекст
              </h2>
              <p className="mt-3 text-[0.94rem] leading-[1.72] text-[var(--text-muted)]">
                Це дані, які допомагають видавати точніші підказки вже після
                реєстрації і не змушують вас щоразу пояснювати контекст заново.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Години на підготовку за тиждень
                <input
                  value={draft.weekly_learning_hours}
                  onChange={(event) =>
                    updateDraft("weekly_learning_hours", event.target.value)
                  }
                  className="field-surface mt-1"
                  inputMode="numeric"
                  placeholder="6"
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                LinkedIn
                <input
                  value={draft.linkedin_url}
                  onChange={(event) =>
                    updateDraft("linkedin_url", event.target.value)
                  }
                  className="field-surface mt-1"
                  placeholder="https://linkedin.com/in/..."
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)] md:col-span-2">
                Портфоліо / сайт
                <input
                  value={draft.portfolio_url}
                  onChange={(event) =>
                    updateDraft("portfolio_url", event.target.value)
                  }
                  className="field-surface mt-1"
                  placeholder="https://..."
                />
              </label>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)] md:col-span-2">
                Фокус на найближчі 90 днів
                <textarea
                  value={draft.focus_note}
                  onChange={(event) =>
                    updateDraft("focus_note", event.target.value)
                  }
                  className="field-surface mt-1 min-h-[8rem] resize-y"
                  placeholder="Наприклад: підготувати резюме, пройти 2 пробні співбесіди і вийти на 10 релевантних відгуків."
                  maxLength={280}
                />
              </label>
            </div>

            {saveError ? (
              <p className="mt-5 rounded-[1.2rem] border border-[rgba(201,155,134,0.5)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-strong)]">
                {saveError}
              </p>
            ) : null}

            {saveNotice ? (
              <p className="mt-5 rounded-[1.2rem] border border-[rgba(63,94,255,0.16)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-strong)]">
                {saveNotice}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Зберігаємо..." : "Зберегти профіль"}
              </button>
              <Link href="/dashboard" className="btn-secondary">
                На головну
              </Link>
            </div>
          </article>
        </form>

        <div className="space-y-6">
          <article className="surface-panel rounded-[2rem] p-5 md:p-6">
            <div className="flex items-center gap-3">
              <span className="surface-soft inline-flex h-11 w-11 items-center justify-center rounded-[1rem] text-[var(--accent-strong)]">
                <LockIcon />
              </span>
              <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
                Пароль
              </h2>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Новий пароль
                <input
                  type="password"
                  value={nextPassword}
                  onChange={(event) => setNextPassword(event.target.value)}
                  className="field-surface mt-1"
                  autoComplete="new-password"
                />
              </label>
              <p className="text-xs leading-[1.72] text-[var(--text-soft)]">
                {PASSWORD_POLICY_HINT}
              </p>

              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Повторіть пароль
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="field-surface mt-1"
                  autoComplete="new-password"
                />
              </label>

              {passwordError ? (
                <p className="rounded-[1.2rem] border border-[rgba(201,155,134,0.5)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-strong)]">
                  {passwordError}
                </p>
              ) : null}

              {passwordNotice ? (
                <p className="rounded-[1.2rem] border border-[rgba(63,94,255,0.16)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-strong)]">
                  {passwordNotice}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isPasswordSaving}
                className="btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPasswordSaving ? "Оновлюємо..." : "Оновити пароль"}
              </button>
            </form>
          </article>

          <article className="surface-panel rounded-[2rem] p-5 md:p-6">
            <h2 className="text-[1.45rem] font-semibold leading-[1.06] tracking-[-0.04em] text-[var(--text-strong)]">
              Де профіль спрацює
            </h2>
            <div className="mt-5 space-y-3">
              {[
                "Ринкова позиція використовує роль, дохід, ринок і пріоритет переходу для нових оцінок.",
                "Vacancy Fit підтягує англійську, досвід і формат роботи без повторного введення.",
                "Resume-правки спираються на цільову роль і конкретну вакансію.",
                "Salary talking points використовують зарплатний контекст і вашу стадію пошуку.",
              ].map((item) => (
                <div key={item} className="surface-soft rounded-[1.2rem] p-4">
                  <p className="text-[0.92rem] leading-[1.68] text-[var(--text-muted)]">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
