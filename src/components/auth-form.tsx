"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";

export type AuthView = "login" | "signup" | "reset";

type AuthFormProps = {
  initialView: AuthView;
  nextPath?: string | null;
  initialNotice?: string | null;
  display?: "page" | "modal";
  onClose?: () => void;
};

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

export function AuthForm({
  initialView,
  nextPath,
  initialNotice = null,
  display = "page",
  onClose
}: AuthFormProps) {
  const router = useRouter();
  const redirectTo = useMemo(() => normalizeNextPath(nextPath ?? null), [nextPath]);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [view, setView] = useState<AuthView>(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(initialView !== "reset");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(initialNotice);

  const copy = getViewCopy(view);
  const isSignup = view === "signup";
  const isReset = view === "reset";
  const showDescription = Boolean(copy.description);

  useEffect(() => {
    setView(initialView);
    setError(null);
    setNotice(initialNotice);
    setPassword("");
    setIsCheckingSession(initialView !== "reset");
  }, [initialNotice, initialView]);

  useEffect(() => {
    let isMounted = true;

    if (view === "reset") {
      setIsCheckingSession(false);
      return () => {
        isMounted = false;
      };
    }

    setIsCheckingSession(true);

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      if (data.session) {
        onClose?.();
        router.replace(redirectTo);
        router.refresh();
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
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
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
          onClose?.();
          router.replace(redirectTo);
          router.refresh();
          return;
        }

        switchView("login", "Акаунт створено. Підтвердьте email у листі, а потім увійдіть у свій профіль.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (signInError) {
        setError(mapAuthErrorMessage(signInError.message));
        return;
      }

      onClose?.();
      router.replace(redirectTo);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? mapAuthErrorMessage(submitError.message) : "Сталася помилка під час авторизації.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingSession) {
    return (
      <section className={display === "modal" ? "" : "mx-auto max-w-xl py-10"}>
        <div className="surface-panel rounded-[2rem] p-6 md:p-8">
          <p className="body-copy">Перевіряємо вашу сесію...</p>
        </div>
      </section>
    );
  }

  const rootClassName = display === "modal" ? "" : "mx-auto max-w-xl py-6 md:py-10";
  const panelClassName = display === "modal" ? "surface-panel rounded-[2rem] p-6 md:p-8" : "surface-panel rounded-[2rem] p-6 md:p-8";
  const switchHref = `${view === "signup" ? "/login" : "/signup"}?next=${encodeURIComponent(redirectTo)}`;

  return (
    <section className={rootClassName}>
      <div className={panelClassName}>
        <div>
          <h1 className="page-title max-w-[13ch]">{copy.title}</h1>
          {showDescription ? <p className="mt-3 text-[0.98rem] leading-[1.72] text-[var(--text-muted)]">{copy.description}</p> : null}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field-surface mt-1"
              autoComplete="email"
              required
            />
          </label>

          {!isReset ? (
            <>
              <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
                Пароль
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="field-surface mt-1"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  minLength={6}
                  required
                />
              </label>

              {view === "login" ? (
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => switchView("reset")}
                    className="text-sm font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]"
                  >
                    Забули пароль?
                  </button>
                </div>
              ) : null}
            </>
          ) : null}

          {error ? (
            <p className="rounded-[1.3rem] border border-[rgba(201,155,134,0.5)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-strong)]">
              {error}
            </p>
          ) : null}

          {notice ? (
            <p className="rounded-[1.3rem] border border-[rgba(63,94,255,0.16)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-strong)]">
              {notice}
            </p>
          ) : null}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70">
            {isSubmitting ? copy.submitBusyLabel : copy.submitLabel}
          </button>
        </form>

        <div className="mt-5 text-sm text-[var(--text-muted)]">
          {view === "signup" ? (
            display === "modal" ? (
              <p>
                Уже є акаунт?{" "}
                <button
                  type="button"
                  onClick={() => switchView("login")}
                  className="font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]"
                >
                  Увійти
                </button>
              </p>
            ) : (
              <p>
                Уже є акаунт?{" "}
                <Link href={switchHref} className="font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)]">
                  Увійти
                </Link>
              </p>
            )
          ) : view === "login" ? (
            display === "modal" ? (
              <p>
                Немає акаунта?{" "}
                <button
                  type="button"
                  onClick={() => switchView("signup")}
                  className="font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]"
                >
                  Зареєструватися
                </button>
              </p>
            ) : (
              <p>
                Немає акаунта?{" "}
                <Link href={switchHref} className="font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)]">
                  Зареєструватися
                </Link>
              </p>
            )
          ) : (
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
          )}
        </div>
      </div>
    </section>
  );
}
