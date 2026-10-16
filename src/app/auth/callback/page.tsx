"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";

type CallbackState =
  | { status: "loading"; eyebrow: string; title: string; message: string }
  | { status: "error"; eyebrow: string; title: string; message: string; primaryHref: string; primaryLabel: string };

function normalizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/hire";
  }

  return value;
}

function getFlowType(searchParams: URLSearchParams, hashParams: URLSearchParams) {
  return searchParams.get("type") ?? hashParams.get("type") ?? "signup";
}

function resolveNextPath(searchParams: URLSearchParams, hashParams: URLSearchParams) {
  const nextValue = searchParams.get("next");
  if (nextValue) {
    return normalizeNextPath(nextValue);
  }

  return getFlowType(searchParams, hashParams) === "recovery" ? "/reset-password" : "/hire";
}

function getFlowCopy(flowType: string) {
  if (flowType === "recovery") {
    return {
      eyebrow: "Зміна пароля",
      loadingTitle: "Відкриваємо зміну пароля",
      loadingMessage: "Це займе лише кілька секунд.",
      errorTitle: "Не вдалося відкрити зміну пароля",
      errorHref: "/login?next=%2Freset-password",
      errorLabel: "Перейти до входу"
    };
  }

  return {
    eyebrow: "Вхід",
    loadingTitle: "Відкриваємо кабінет",
    loadingMessage: "Це займе лише кілька секунд.",
    errorTitle: "Не вдалося підтвердити акаунт",
    errorHref: "/login?next=%2Fhire",
    errorLabel: "Перейти до входу"
  };
}

function mapCallbackErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Не вдалося завершити авторизацію.";
  const normalized = message.toLowerCase();

  if (normalized.includes("failed to fetch") || normalized.includes("networkerror")) {
    return "Не вдалося завершити авторизацію. Схоже, браузер або розширення заблокувало auth-запит, або Supabase зараз недоступний.";
  }

  if (normalized.includes("expired")) {
    return "Посилання вже недійсне. Запросіть новий лист і спробуйте ще раз.";
  }

  return message;
}

export default function AuthCallbackPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [state, setState] = useState<CallbackState>({
    status: "loading",
    eyebrow: "Вхід",
    title: "Відкриваємо кабінет",
    message: "Це займе лише кілька секунд."
  });

  useEffect(() => {
    let isMounted = true;

    const finalizeAuth = async () => {
      const currentUrl = new URL(window.location.href);
      const searchParams = currentUrl.searchParams;
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const flowType = getFlowType(searchParams, hashParams);
      const flowCopy = getFlowCopy(flowType);
      const nextPath = resolveNextPath(searchParams, hashParams);
      const urlError = searchParams.get("error_description") ?? searchParams.get("error");
      const hasHashParams = currentUrl.hash.length > 1;

      if (isMounted) {
        setState({
          status: "loading",
          eyebrow: flowCopy.eyebrow,
          title: flowCopy.loadingTitle,
          message: flowCopy.loadingMessage
        });
      }

      if (hasHashParams) {
        window.history.replaceState(window.history.state, "", `${currentUrl.pathname}${currentUrl.search}`);
      }

      if (urlError) {
        if (!isMounted) {
          return;
        }

        setState({
          status: "error",
          eyebrow: flowCopy.eyebrow,
          title: flowCopy.errorTitle,
          message: urlError,
          primaryHref: flowCopy.errorHref,
          primaryLabel: flowCopy.errorLabel
        });
        return;
      }

      try {
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const hashError = hashParams.get("error_description") ?? hashParams.get("error");
        let sessionAccessToken: string | null = null;

        if (hashError) {
          throw new Error(hashError);
        }

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }

          sessionAccessToken = data.session?.access_token ?? null;
        } else if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            throw error;
          }

          sessionAccessToken = data.session?.access_token ?? accessToken;
        } else if (tokenHash && type) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType
          });

          if (error) {
            throw error;
          }

          sessionAccessToken = data.session?.access_token ?? null;
        } else {
          throw new Error("У посиланні бракує службових параметрів авторизації.");
        }


        if (!isMounted) {
          return;
        }

        window.location.replace(nextPath);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({
          status: "error",
          eyebrow: flowCopy.eyebrow,
          title: flowCopy.errorTitle,
          message: mapCallbackErrorMessage(error),
          primaryHref: flowCopy.errorHref,
          primaryLabel: flowCopy.errorLabel
        });
      }
    };

    void finalizeAuth();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  if (state.status === "loading") {
    return (
      <section className="fixed inset-0 z-[80] flex items-center justify-center bg-[radial-gradient(46rem_28rem_at_18%_12%,#edf2ff_0%,transparent_72%),radial-gradient(34rem_24rem_at_82%_10%,#f2f5ff_0%,transparent_68%),linear-gradient(180deg,#fbfcff_0%,#f5f7fb_100%)]">
        <div role="status" aria-live="polite" aria-label={state.title} className="relative flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-[rgba(52,83,244,0.12)] bg-white/80" />
          <span className="absolute inset-[0.6rem] rounded-full border-[3px] border-[rgba(52,83,244,0.12)] border-t-[var(--accent-strong)] animate-spin" />
          <span className="absolute h-3.5 w-3.5 rounded-full bg-[var(--accent-strong)] shadow-[0_0_0_8px_rgba(67,97,255,0.12)]" />
          <span className="sr-only">{state.message}</span>
        </div>
      </section>
    );
  }

  return (
    <section className="fixed inset-0 z-[80] overflow-y-auto bg-[radial-gradient(46rem_28rem_at_18%_12%,#edf2ff_0%,transparent_72%),radial-gradient(34rem_24rem_at_82%_10%,#f2f5ff_0%,transparent_68%),linear-gradient(180deg,#fbfcff_0%,#f5f7fb_100%)] px-5 py-8 sm:px-6 md:px-8">
      <div className="mx-auto flex min-h-full max-w-xl items-center justify-center">
        <div className="surface-panel w-full rounded-[2rem] px-6 py-8 text-left sm:px-8 sm:py-10 sm:text-center">
          <span className="eyebrow-pill">{state.eyebrow}</span>
          <h1 className="page-title mt-5 text-balance">{state.title}</h1>
          <p className="mt-4 text-[0.98rem] leading-[1.75] text-[var(--text-muted)]">{state.message}</p>

          <div className="mt-7 flex flex-wrap gap-3 sm:justify-center">
            <Link href={state.primaryHref} className="btn-primary">
              {state.primaryLabel}
            </Link>
            <Link href="/" className="btn-secondary">
              На головну
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
