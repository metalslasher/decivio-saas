"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";

type CallbackState =
  | { status: "loading"; eyebrow: string; title: string; message: string }
  | { status: "error"; eyebrow: string; title: string; message: string; primaryHref: string; primaryLabel: string };

function normalizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
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

  return getFlowType(searchParams, hashParams) === "recovery" ? "/reset-password" : "/dashboard";
}

function getFlowCopy(flowType: string) {
  if (flowType === "recovery") {
    return {
      eyebrow: "Зміна пароля",
      loadingTitle: "Готуємо форму нового пароля",
      loadingMessage: "Перевіряємо посилання і відкриваємо безпечне оновлення пароля.",
      errorTitle: "Не вдалося відкрити зміну пароля",
      errorHref: "/login?next=%2Freset-password",
      errorLabel: "Перейти до входу"
    };
  }

  return {
    eyebrow: "Підтвердження",
    loadingTitle: "Завершуємо вхід",
    loadingMessage: "Підтверджуємо акаунт і відкриваємо ваш кабінет.",
    errorTitle: "Не вдалося підтвердити акаунт",
    errorHref: "/login?next=%2Fdashboard",
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
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [state, setState] = useState<CallbackState>({
    status: "loading",
    eyebrow: "Підтвердження",
    title: "Завершуємо вхід",
    message: "Підтверджуємо акаунт і відкриваємо ваш кабінет."
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

      if (isMounted) {
        setState({
          status: "loading",
          eyebrow: flowCopy.eyebrow,
          title: flowCopy.loadingTitle,
          message: flowCopy.loadingMessage
        });
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

        if (hashError) {
          throw new Error(hashError);
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            throw error;
          }
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType
          });

          if (error) {
            throw error;
          }
        } else {
          throw new Error("У посиланні бракує службових параметрів авторизації.");
        }

        if (!isMounted) {
          return;
        }

        router.replace(nextPath);
        router.refresh();
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
  }, [router, supabase]);

  return (
    <section className="mx-auto max-w-2xl py-10 md:py-14">
      <div className="surface-panel rounded-[2rem] p-6 md:p-8">
        <span className="eyebrow-pill">{state.eyebrow}</span>

        <h1 className="page-title mt-4 max-w-[14ch]">{state.title}</h1>
        <p className="lead-copy mt-4">{state.message}</p>

        {state.status === "error" ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={state.primaryHref} className="btn-primary">
              {state.primaryLabel}
            </Link>
            <Link href="/" className="btn-secondary">
              На головну
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
