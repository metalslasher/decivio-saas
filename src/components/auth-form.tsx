"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";

type AuthMode = "login" | "signup";

function normalizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/simulate";
  }

  return value;
}

function mapAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Неправильний email або пароль.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Пошта ще не підтверджена.";
  }

  if (normalized.includes("user already registered")) {
    return "Користувач із таким email уже існує.";
  }

  if (normalized.includes("password")) {
    return "Пароль занадто слабкий або не відповідає вимогам.";
  }

  if (normalized.includes("rate limit")) {
    return "Забагато спроб. Спробуйте ще раз трохи пізніше.";
  }

  return message;
}

export function AuthForm({
  mode,
  nextPath,
  wasJustCreated = false
}: {
  mode: AuthMode;
  nextPath?: string | null;
  wasJustCreated?: boolean;
}) {
  const router = useRouter();
  const redirectTo = useMemo(() => normalizeNextPath(nextPath ?? null), [nextPath]);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      if (data.session) {
        router.replace(redirectTo);
        return;
      }

      setIsCheckingSession(false);
    });

    return () => {
      isMounted = false;
    };
  }, [redirectTo, router, supabase]);

  useEffect(() => {
    if (mode === "login" && wasJustCreated) {
      setNotice("Акаунт створено. Тепер можете увійти у свій профіль.");
    }
  }, [mode, wasJustCreated]);

  const isSignup = mode === "signup";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              source: "header_signup"
            }
          }
        });

        if (signUpError) {
          setError(mapAuthErrorMessage(signUpError.message));
          return;
        }

        if (data.session) {
          router.replace(redirectTo);
          router.refresh();
          return;
        }

        router.replace(`/login?next=${encodeURIComponent(redirectTo)}&created=1`);
        router.refresh();
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

      router.replace(redirectTo);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Сталася помилка під час авторизації.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingSession) {
    return (
      <section className="mx-auto max-w-xl py-10">
        <div className="surface-panel rounded-[2rem] p-6 md:p-8">
          <p className="body-copy">Перевіряємо вашу сесію...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl py-6 md:py-10">
      <div className="surface-panel rounded-[2rem] p-6 md:p-8">
        <div>
          <h1 className="page-title max-w-[11ch]">{isSignup ? "Реєстрація" : "Вхід"}</h1>
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
            {isSubmitting ? (isSignup ? "Створюємо акаунт..." : "Входимо...") : isSignup ? "Зареєструватися" : "Увійти"}
          </button>
        </form>

        <div className="mt-5 text-sm text-[var(--text-muted)]">
          {isSignup ? (
            <p>
              Уже є акаунт?{" "}
              <Link href={`/login?next=${encodeURIComponent(redirectTo)}`} className="font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)]">
                Увійти
              </Link>
            </p>
          ) : (
            <p>
              Немає акаунта?{" "}
              <Link href={`/signup?next=${encodeURIComponent(redirectTo)}`} className="font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)]">
                Зареєструватися
              </Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
