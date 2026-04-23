"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { claimGuestSimulations } from "@/lib/auth-session-client";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import { PASSWORD_MIN_LENGTH, PASSWORD_POLICY_HINT, validateStrongPassword } from "@/lib/password-policy";

export type AuthView = "login" | "signup" | "reset";

type AuthFormProps = {
  initialView: AuthView;
  nextPath?: string | null;
  initialNotice?: string | null;
  display?: "page" | "modal";
  onClose?: () => void;
  titleId?: string;
};

type FieldName = "email" | "password" | "confirmPassword";
type TouchedFields = Record<FieldName, boolean>;

function normalizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

function buildCallbackUrl(nextPath: string) {
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("next", nextPath);
  return url.toString();
}

function mapAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("failed to fetch") || normalized.includes("networkerror")) {
    return "Не вдалося підключитися до сервісу авторизації. Якщо ви працюєте локально, перевірте, чи запущений Supabase.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "Неправильний email або пароль.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Пошта ще не підтверджена. Спершу відкрийте лист і підтвердьте акаунт.";
  }

  if (normalized.includes("user already registered")) {
    return "Користувач із таким email уже існує.";
  }

  if (normalized.includes("same password")) {
    return "Новий пароль має відрізнятися від попереднього.";
  }

  if (normalized.includes("password")) {
    return "Пароль занадто слабкий або не відповідає вимогам.";
  }

  if (normalized.includes("rate limit")) {
    return "Забагато спроб. Спробуйте ще раз трохи пізніше.";
  }

  return message;
}

function getViewCopy(view: AuthView) {
  switch (view) {
    case "signup":
      return {
        title: "Реєстрація",
        description: null,
        submitLabel: "Зареєструватися",
        submitBusyLabel: "Створюємо акаунт..."
      };
    case "reset":
      return {
        title: "Відновлення пароля",
        description: "Введіть email, і ми надішлемо посилання для зміни пароля.",
        submitLabel: "Надіслати посилання",
        submitBusyLabel: "Надсилаємо лист..."
      };
    default:
      return {
        title: "Вхід",
        description: null,
        submitLabel: "Увійти",
        submitBusyLabel: "Входимо..."
      };
  }
}

function isEmailFormatValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getEmailValidationError(value: string) {
  if (!value.trim()) {
    return "Введіть email.";
  }

  if (!isEmailFormatValid(value)) {
    return "Вкажіть коректний email.";
  }

  return null;
}

function getPasswordValidationError(value: string, view: AuthView) {
  if (view === "reset") {
    return null;
  }

  if (!value) {
    return "Введіть пароль.";
  }

  if (view === "signup") {
    return validateStrongPassword(value);
  }

  return null;
}

function getConfirmPasswordValidationError(password: string, confirmPassword: string, view: AuthView) {
  if (view !== "signup") {
    return null;
  }

  if (!confirmPassword) {
    return "Підтвердіть пароль.";
  }

  if (password !== confirmPassword) {
    return "Паролі не збігаються.";
  }

  return null;
}

function getAuthViewHref(view: Extract<AuthView, "login" | "signup">, redirectTo: string) {
  const path = view === "signup" ? "/signup" : "/login";
  return `${path}?next=${encodeURIComponent(redirectTo)}`;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M21.805 12.23c0-.68-.061-1.334-.174-1.961H12v3.708h5.5a4.703 4.703 0 0 1-2.04 3.084v2.56h3.294c1.928-1.775 3.051-4.39 3.051-7.39Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.075-.915 6.766-2.479l-3.294-2.56c-.915.613-2.083.975-3.472.975-2.67 0-4.93-1.803-5.737-4.226H2.858v2.644A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.263 13.71A5.996 5.996 0 0 1 5.942 12c0-.594.103-1.17.321-1.71V7.646H2.858A10 10 0 0 0 2 12c0 1.61.386 3.134 1.071 4.354l3.192-2.484Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.064c1.5 0 2.847.516 3.907 1.528l2.93-2.93C17.07 3.018 14.756 2 12 2A10 10 0 0 0 3.071 7.646L6.263 10.13C7.07 7.807 9.33 6.064 12 6.064Z"
        fill="#EA4335"
      />
    </svg>
  );
}

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
    email: false,
    password: false,
    confirmPassword: false
  });

  const copy = getViewCopy(view);
  const isSignup = view === "signup";
  const isReset = view === "reset";
  const showDescription = Boolean(copy.description);
  const showVisualTitle = isReset;
  const showModalCloseButton = display === "modal" && Boolean(onClose);
  const isAnyAuthPending = isSubmitting || isGoogleSubmitting;
  const shouldBlockForSessionCheck = display === "page" && isCheckingSession;
  const validationErrors = useMemo(
    () => ({
      email: getEmailValidationError(email),
      password: getPasswordValidationError(password, view),
      confirmPassword: getConfirmPasswordValidationError(password, confirmPassword, view)
    }),
    [confirmPassword, email, password, view]
  );
  const emailError = touchedFields.email ? validationErrors.email : null;
  const passwordError = touchedFields.password ? validationErrors.password : null;
  const confirmPasswordError = touchedFields.confirmPassword ? validationErrors.confirmPassword : null;
  const passwordDescriptionIds = [isSignup ? "auth-password-note" : null, passwordError ? "auth-password-error" : null].filter(Boolean).join(" ") || undefined;
  const confirmPasswordDescriptionIds = confirmPasswordError ? "auth-confirm-password-error" : undefined;

  useEffect(() => {
    setView(initialView);
    setError(null);
    setNotice(initialNotice);
    setPassword("");
    setConfirmPassword("");
    setIsPasswordVisible(false);
    setIsCheckingSession(initialView !== "reset" && display === "page");
    setTouchedFields({
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
    setPassword("");
    setConfirmPassword("");
    setIsPasswordVisible(false);
    setTouchedFields({
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
      Boolean(validationErrors.email) || (!isReset && Boolean(validationErrors.password)) || (isSignup && Boolean(validationErrors.confirmPassword));

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
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
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
  const loginHref = getAuthViewHref("login", redirectTo);
  const signupHref = getAuthViewHref("signup", redirectTo);
  const formClassName = showVisualTitle ? "mt-6 space-y-4" : "space-y-4";

  return (
    <section className={rootClassName}>
      <div className={panelClassName}>
        {display === "modal" ? (
          <div className={`mb-6 flex items-center ${isReset ? "justify-end" : "gap-3"}`}>
            {!isReset ? (
              <div className="grid flex-1 grid-cols-2 rounded-full border border-[var(--line-soft)] bg-white/72 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]">
                <button
                  type="button"
                  onClick={() => switchView("login")}
                  disabled={isAnyAuthPending || view === "login"}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    view === "login"
                      ? "bg-white text-[var(--text-strong)] shadow-[0_10px_24px_-18px_rgba(22,29,43,0.4)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-strong)] disabled:cursor-default"
                  }`}
                  aria-pressed={view === "login"}
                >
                  Вхід
                </button>
                <button
                  type="button"
                  onClick={() => switchView("signup")}
                  disabled={isAnyAuthPending || view === "signup"}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    view === "signup"
                      ? "bg-white text-[var(--text-strong)] shadow-[0_10px_24px_-18px_rgba(22,29,43,0.4)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-strong)] disabled:cursor-default"
                  }`}
                  aria-pressed={view === "signup"}
                >
                  Реєстрація
                </button>
              </div>
            ) : null}

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
        ) : !isReset ? (
          <div className="mb-6 grid grid-cols-2 rounded-full border border-[var(--line-soft)] bg-white/72 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]">
            <Link
              href={loginHref}
              className={`rounded-full px-4 py-2.5 text-center text-sm font-semibold transition ${
                view === "login"
                  ? "bg-white text-[var(--text-strong)] shadow-[0_10px_24px_-18px_rgba(22,29,43,0.4)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"
              }`}
              aria-current={view === "login" ? "page" : undefined}
            >
              Вхід
            </Link>
            <Link
              href={signupHref}
              className={`rounded-full px-4 py-2.5 text-center text-sm font-semibold transition ${
                view === "signup"
                  ? "bg-white text-[var(--text-strong)] shadow-[0_10px_24px_-18px_rgba(22,29,43,0.4)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"
              }`}
              aria-current={view === "signup" ? "page" : undefined}
            >
              Реєстрація
            </Link>
          </div>
        ) : null}

        <div>
          <h1 id={titleId} className={showVisualTitle ? "page-title max-w-[13ch]" : "sr-only"}>
            {copy.title}
          </h1>
          {showVisualTitle && showDescription ? <p className="mt-3 text-[0.98rem] leading-[1.72] text-[var(--text-muted)]">{copy.description}</p> : null}
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

          <button type="submit" disabled={isAnyAuthPending} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70">
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
