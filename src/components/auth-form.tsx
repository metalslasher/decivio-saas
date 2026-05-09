"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { claimGuestSimulations } from "@/lib/auth-session-client";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import { PASSWORD_MIN_LENGTH, PASSWORD_POLICY_HINT } from "@/lib/password-policy";
import { GoogleIcon } from "./auth-form-google-icon";
import {
  buildCallbackUrl,
  getConfirmPasswordValidationError,
  getEmailValidationError,
  getFullNameValidationError,
  getPasswordValidationError,
  getViewCopy,
  mapAuthErrorMessage,
  normalizeNextPath,
  type AuthFormProps,
  type AuthView,
  type FieldName,
  type TouchedFields,
} from "./auth-form-helpers";

export type { AuthView } from "./auth-form-helpers";

export function AuthForm({
  initialView,
  nextPath,
  initialNotice = null,
  display = "page",
  onClose,
  titleId
}: AuthFormProps) {
  const router = useRouter();
  const redirectTo = useMemo(() => normalizeNextPath(nextPath ?? null), [nextPath]);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [view, setView] = useState<AuthView>(initialView);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(initialView !== "reset" && display === "page");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(initialNotice);
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  const copy = getViewCopy(view);
  const isSignup = view === "signup";
  const isReset = view === "reset";
  const showDescription = Boolean(copy.description);
  const showModalCloseButton = display === "modal" && Boolean(onClose);
  const isAnyAuthPending = isSubmitting || isGoogleSubmitting;
  const shouldBlockForSessionCheck = display === "page" && isCheckingSession;
  const validationErrors = useMemo(
    () => ({
      fullName: getFullNameValidationError(fullName, view),
      email: getEmailValidationError(email),
      password: getPasswordValidationError(password, view),
      confirmPassword: getConfirmPasswordValidationError(password, confirmPassword, view)
    }),
    [confirmPassword, email, fullName, password, view]
  );
  const fullNameError = touchedFields.fullName ? validationErrors.fullName : null;
  const emailError = touchedFields.email ? validationErrors.email : null;
  const passwordError = touchedFields.password ? validationErrors.password : null;
  const confirmPasswordError = touchedFields.confirmPassword ? validationErrors.confirmPassword : null;
  const passwordDescriptionIds = [isSignup ? "auth-password-note" : null, passwordError ? "auth-password-error" : null].filter(Boolean).join(" ") || undefined;
  const confirmPasswordDescriptionIds = confirmPasswordError ? "auth-confirm-password-error" : undefined;

  useEffect(() => {
    setView(initialView);
    setError(null);
    setNotice(initialNotice);
    setFullName("");
    setPassword("");
    setConfirmPassword("");
    setIsPasswordVisible(false);
    setIsCheckingSession(initialView !== "reset" && display === "page");
    setTouchedFields({
      fullName: false,
      email: false,
      password: false,
      confirmPassword: false
    });
  }, [display, initialNotice, initialView]);

  useEffect(() => {
    let isMounted = true;

    if (view === "reset") {
      setIsCheckingSession(false);
      return () => {
        isMounted = false;
      };
    }

    setIsCheckingSession(display === "page");

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!isMounted) {
          return;
        }

        if (data.session) {
          await claimGuestSimulations(data.session.access_token);

          if (!isMounted) {
            return;
          }

          onClose?.();
          router.replace(redirectTo);
          router.refresh();
          return;
        }

        setIsCheckingSession(false);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setIsCheckingSession(false);
      });

    return () => {
      isMounted = false;
    };
  }, [display, onClose, redirectTo, router, supabase, view]);

  const switchView = (nextView: AuthView, nextNotice?: string | null) => {
    setView(nextView);
    setError(null);
    setNotice(nextNotice ?? null);
    setFullName("");
    setPassword("");
    setConfirmPassword("");
    setIsPasswordVisible(false);
    setTouchedFields({
      fullName: false,
      email: false,
      password: false,
      confirmPassword: false
    });
  };

  const markFieldTouched = (fieldName: FieldName) => {
    setTouchedFields((current) => (current[fieldName] ? current : { ...current, [fieldName]: true }));
  };

  const markActiveFieldsTouched = () => {
    setTouchedFields({
      fullName: isSignup,
      email: true,
      password: !isReset,
      confirmPassword: isSignup
    });
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setNotice(null);
    setIsGoogleSubmitting(true);

    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildCallbackUrl(redirectTo),
          skipBrowserRedirect: true
        }
      });

      if (oauthError) {
        setError(mapAuthErrorMessage(oauthError.message));
        return;
      }

      if (!data?.url) {
        setError("Не вдалося підготувати вхід через Google. Спробуйте ще раз.");
        return;
      }

      window.location.assign(data.url);
    } catch (oauthError) {
      setError(oauthError instanceof Error ? mapAuthErrorMessage(oauthError.message) : "Сталася помилка під час входу через Google.");
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const hasLocalValidationErrors =
      Boolean(validationErrors.email) ||
      (isSignup && Boolean(validationErrors.fullName)) ||
      (!isReset && Boolean(validationErrors.password)) ||
      (isSignup && Boolean(validationErrors.confirmPassword));

    if (hasLocalValidationErrors) {
      markActiveFieldsTouched();
      return;
    }

    setIsSubmitting(true);

    try {
      if (isReset) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: buildCallbackUrl("/reset-password")
        });

        if (resetError) {
          setError(mapAuthErrorMessage(resetError.message));
          return;
        }

        switchView("login", "Надіслали лист для зміни пароля. Перевірте пошту й відкрийте посилання з листа.");
        return;
      }

      if (isSignup) {
        const normalizedFullName = fullName.trim();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: normalizedFullName,
              name: normalizedFullName,
              source: display === "modal" ? "modal_signup" : "page_signup"
            },
            emailRedirectTo: buildCallbackUrl(redirectTo)
          }
        });

        if (signUpError) {
          setError(mapAuthErrorMessage(signUpError.message));
          return;
        }

        if (data.session) {
          await claimGuestSimulations(data.session.access_token);
          onClose?.();
          router.replace(redirectTo);
          router.refresh();
          return;
        }

        switchView("login", "Акаунт створено. Підтвердьте email у листі, а потім увійдіть у свій профіль.");
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (signInError) {
        setError(mapAuthErrorMessage(signInError.message));
        return;
      }

      await claimGuestSimulations(data.session?.access_token ?? null);
      onClose?.();
      router.replace(redirectTo);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? mapAuthErrorMessage(submitError.message) : "Сталася помилка під час авторизації.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (shouldBlockForSessionCheck) {
    return (
      <section className="mx-auto max-w-xl py-10">
        <div className="surface-panel rounded-[2rem] p-6 md:p-8">
          <p className="body-copy">Перевіряємо вашу сесію...</p>
        </div>
      </section>
    );
  }

  const rootClassName = display === "modal" ? "" : "mx-auto max-w-xl py-6 md:py-10";
  const panelClassName = display === "modal" ? "surface-panel rounded-[2rem] p-6 md:p-8" : "surface-panel rounded-[2rem] p-6 md:p-8";
  const formClassName = "mt-6 space-y-4";
  const titleClassName =
    display === "modal"
      ? "section-title max-w-[13ch]"
      : "page-title max-w-[13ch]";

  return (
    <section className={rootClassName}>
      <div className={panelClassName}>
        <div className={`flex items-start ${showModalCloseButton ? "justify-between gap-4" : ""}`}>
          <div>
            <h1 id={titleId} className={titleClassName}>
              {copy.title}
            </h1>
            {showDescription ? <p className="mt-3 text-[0.98rem] leading-[1.72] text-[var(--text-muted)]">{copy.description}</p> : null}
          </div>

          {showModalCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full border border-white/60 bg-[rgba(252,253,255,0.84)] text-[var(--text-muted)] transition hover:bg-white hover:text-[var(--text-strong)]"
              aria-label="Закрити"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none" aria-hidden="true">
                <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className={formClassName} aria-busy={isAnyAuthPending}>
          {!isReset ? (
            <>
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isAnyAuthPending}
                className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-[var(--line-soft)] bg-white/88 px-4 py-3 text-[1rem] font-semibold text-[var(--text-strong)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_8px_18px_-14px_rgba(18,24,38,0.36)]">
                  <GoogleIcon />
                </span>
                <span>{isGoogleSubmitting ? "Переходимо до Google..." : isSignup ? "Зареєструватися через Google" : "Увійти через Google"}</span>
              </button>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-[var(--line-soft)]" />
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">або</span>
                <span className="h-px flex-1 bg-[var(--line-soft)]" />
              </div>
            </>
          ) : null}

          {isSignup ? (
            <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
              Ім&apos;я
              <input
                type="text"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setError(null);
                }}
                onBlur={() => markFieldTouched("fullName")}
                className="field-surface mt-1"
                autoComplete="name"
                maxLength={80}
                aria-invalid={fullNameError ? true : undefined}
                aria-describedby={fullNameError ? "auth-full-name-error" : undefined}
                required
              />
              {fullNameError ? (
                <p id="auth-full-name-error" className="mt-2 text-xs text-[var(--danger-strong)]">
                  {fullNameError}
                </p>
              ) : null}
            </label>
          ) : null}

          <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
            Електронна пошта
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError(null);
              }}
              onBlur={() => markFieldTouched("email")}
              className="field-surface mt-1"
              autoComplete="email"
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? "auth-email-error" : undefined}
              required
            />
            {emailError ? (
              <p id="auth-email-error" className="mt-2 text-xs text-[var(--danger-strong)]">
                {emailError}
              </p>
            ) : null}
          </label>

          {!isReset ? (
            <>
              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Пароль
                <div className="relative mt-1">
                  <input
                    type={isPasswordVisible ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError(null);
                    }}
                    onBlur={() => markFieldTouched("password")}
                    className="field-surface pr-24"
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    minLength={isSignup ? PASSWORD_MIN_LENGTH : undefined}
                    aria-invalid={passwordError ? true : undefined}
                    aria-describedby={passwordDescriptionIds}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]"
                    aria-label={isPasswordVisible ? "Сховати пароль" : "Показати пароль"}
                  >
                    {isPasswordVisible ? "Сховати" : "Показати"}
                  </button>
                </div>
                {isSignup ? (
                  <p id="auth-password-note" className="mt-2 text-xs text-[var(--text-soft)]">
                    {PASSWORD_POLICY_HINT}
                  </p>
                ) : null}
                {passwordError ? (
                  <p id="auth-password-error" className="mt-2 text-xs text-[var(--danger-strong)]">
                    {passwordError}
                  </p>
                ) : null}
              </label>

              {isSignup ? (
                <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                  Підтвердіть пароль
                  <div className="relative mt-1">
                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setError(null);
                      }}
                      onBlur={() => markFieldTouched("confirmPassword")}
                      className="field-surface pr-24"
                      autoComplete="new-password"
                      minLength={PASSWORD_MIN_LENGTH}
                      aria-invalid={confirmPasswordError ? true : undefined}
                      aria-describedby={confirmPasswordDescriptionIds}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setIsPasswordVisible((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]"
                      aria-label={isPasswordVisible ? "Сховати пароль" : "Показати пароль"}
                    >
                      {isPasswordVisible ? "Сховати" : "Показати"}
                    </button>
                  </div>
                  {confirmPasswordError ? (
                    <p id="auth-confirm-password-error" className="mt-2 text-xs text-[var(--danger-strong)]">
                      {confirmPasswordError}
                    </p>
                  ) : null}
                </label>
              ) : null}

              {view === "login" ? (
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => switchView("reset")}
                    disabled={isAnyAuthPending}
                    className="text-sm font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]"
                  >
                    Забули пароль?
                  </button>
                </div>
              ) : null}
            </>
          ) : null}

          {error ? (
            <p role="alert" className="rounded-[1.3rem] border border-[rgba(201,155,134,0.5)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-strong)]">
              {error}
            </p>
          ) : null}

          {notice ? (
            <p aria-live="polite" className="rounded-[1.3rem] border border-[rgba(63,94,255,0.16)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-strong)]">
              {notice}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isAnyAuthPending}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
            data-testid="auth-submit"
          >
            {isSubmitting ? copy.submitBusyLabel : copy.submitLabel}
          </button>
        </form>

        {view === "reset" ? (
          <div className="mt-5 text-sm text-[var(--text-muted)]">
            <p>
              Згадали пароль?{" "}
              {display === "modal" ? (
                <button
                  type="button"
                  onClick={() => switchView("login")}
                  className="font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]"
                >
                  Повернутися до входу
                </button>
              ) : (
                <Link href={`/login?next=${encodeURIComponent(redirectTo)}`} className="font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)]">
                  Повернутися до входу
                </Link>
              )}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
