"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import { PASSWORD_MIN_LENGTH, PASSWORD_POLICY_HINT, validateStrongPassword } from "@/lib/password-policy";

type ResetPasswordState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "missing" };

function mapResetErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("same password")) {
    return "Новий пароль має відрізнятися від попереднього.";
  }

  if (normalized.includes("password")) {
    return "Пароль занадто слабкий або не відповідає вимогам.";
  }

  if (normalized.includes("session")) {
    return "Сесію для зміни пароля не знайдено. Запросіть новий лист для відновлення.";
  }

  return message;
}

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [state, setState] = useState<ResetPasswordState>({ status: "loading" });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const updateStateFromSession = (hasUser: boolean) => {
      if (!isMounted) {
        return;
      }

      setState(hasUser ? { status: "ready" } : { status: "missing" });
    };

    supabase.auth.getSession().then(({ data }) => {
      updateStateFromSession(Boolean(data.session?.user));
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      updateStateFromSession(Boolean(session?.user));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const passwordValidationError = validateStrongPassword(password);
    if (passwordValidationError) {
      setError(passwordValidationError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Паролі не збігаються.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(mapResetErrorMessage(updateError.message));
        return;
      }

      setNotice("Пароль оновлено. Відкриваємо ваш кабінет...");
      router.replace("/hire");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? mapResetErrorMessage(submitError.message) : "Не вдалося оновити пароль.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (state.status === "loading") {
    return (
      <section className="mx-auto max-w-xl py-8 md:py-10">
        <div className="surface-panel rounded-[2rem] p-6 md:p-8">
          <p className="body-copy">Готуємо форму для зміни пароля...</p>
        </div>
      </section>
    );
  }

  if (state.status === "missing") {
    return (
      <section className="mx-auto max-w-xl py-8 md:py-10">
        <div className="surface-panel rounded-[2rem] p-6 md:p-8">
          <h1 className="page-title max-w-[15ch]">Посилання для зміни пароля недійсне.</h1>
          <p className="mt-4 text-[0.98rem] leading-[1.72] text-[var(--text-muted)]">
            Запросіть новий лист для відновлення пароля зі сторінки входу й відкрийте його ще раз.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login?next=%2Fhire" className="btn-primary">
              Перейти до входу
            </Link>
            <Link href="/" className="btn-secondary">
              На головну
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl py-8 md:py-10">
      <div className="surface-panel rounded-[2rem] p-6 md:p-8">
        <div>
          <h1 className="page-title max-w-[14ch]">Новий пароль</h1>
          <p className="mt-3 text-[0.98rem] leading-[1.72] text-[var(--text-muted)]">
            Встановіть новий пароль для вашого акаунта Decivio.
          </p>
          <p className="mt-3 text-xs leading-[1.72] text-[var(--text-soft)]">{PASSWORD_POLICY_HINT}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
            Новий пароль
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field-surface mt-1"
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              required
            />
          </label>

          <label className="block text-sm font-medium leading-[1.6] text-[var(--text-muted)]">
            Повторіть пароль
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="field-surface mt-1"
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
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
            {isSubmitting ? "Оновлюємо пароль..." : "Зберегти новий пароль"}
          </button>
        </form>
      </div>
    </section>
  );
}
