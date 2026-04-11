"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";

type CallbackState =
  | { status: "loading"; message: string }
  | { status: "error"; title: string; message: string };

function normalizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

function mapCallbackErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Не вдалося завершити підтвердження акаунта.";
  const normalized = message.toLowerCase();

  if (normalized.includes("failed to fetch") || normalized.includes("networkerror")) {
    return "Не вдалося завершити підтвердження акаунта. Схоже, браузер або розширення заблокувало auth-запит, або Supabase зараз недоступний.";
  }

  if (normalized.includes("expired")) {
    return "Посилання для підтвердження вже недійсне. Спробуйте увійти або запросіть новий лист.";
  }

  return message;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [state, setState] = useState<CallbackState>({
    status: "loading",
    message: "Підтверджуємо акаунт і відкриваємо ваш кабінет..."
  });

  useEffect(() => {
    let isMounted = true;

    const finalizeAuth = async () => {
      const currentUrl = new URL(window.location.href);
      const searchParams = currentUrl.searchParams;
      const nextPath = normalizeNextPath(searchParams.get("next"));
      const urlError = searchParams.get("error_description") ?? searchParams.get("error");

      if (urlError) {
        if (!isMounted) {
          return;
        }

        setState({
          status: "error",
          title: "Не вдалося завершити вхід",
          message: urlError
        });
        return;
      }

      try {
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type");
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
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
          throw new Error("У посиланні для підтвердження бракує службових параметрів.");
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
          title: "Не вдалося підтвердити акаунт",
          message: mapCallbackErrorMessage(error)
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
        {state.status === "loading" ? (
          <>
            <span className="eyebrow-pill">Підтвердження</span>
            <h1 className="page-title mt-4 max-w-[12ch]">Завершуємо вхід</h1>
            <p className="lead-copy mt-4">{state.message}</p>
          </>
        ) : (
          <>
            <span className="eyebrow-pill">Підтвердження</span>
            <h1 className="page-title mt-4 max-w-[14ch]">{state.title}</h1>
            <p className="lead-copy mt-4">{state.message}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login?next=%2Fdashboard" className="btn-primary">
                Перейти до входу
              </Link>
              <Link href="/" className="btn-secondary">
                На головну
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
