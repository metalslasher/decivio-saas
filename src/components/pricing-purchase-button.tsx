"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import { getPricingPurchaseHref, type PaidPlanId } from "@/lib/pricing";

type PricingPurchaseButtonProps = {
  planId: PaidPlanId;
  label: string;
  className: string;
};

type PurchaseState =
  | { status: "idle"; error: string | null }
  | { status: "checking"; error: string | null }
  | { status: "creating"; error: string | null };

function getCheckoutErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Не вдалося підготувати оплату.";
}

export function PricingPurchaseButton({ planId, label, className }: PricingPurchaseButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { openAuthDialog } = useAuthDialog();
  const [purchaseState, setPurchaseState] = useState<PurchaseState>({ status: "idle", error: null });
  const hasPromptedForAuthRef = useRef(false);
  const isCheckoutInFlightRef = useRef(false);

  const nextPath = getPricingPurchaseHref(planId);
  const shouldAutoStart = searchParams.get("checkoutPlan") === planId;
  const isBusy = purchaseState.status === "checking" || purchaseState.status === "creating";

  const openSignup = useCallback(() => {
    openAuthDialog("signup", {
      nextPath,
      notice: "Створіть акаунт, щоб закріпити оплату саме за вашим профілем."
    });
  }, [nextPath, openAuthDialog]);

  const createCheckout = useCallback(
    async (accessToken: string) => {
      if (isCheckoutInFlightRef.current) {
        return;
      }

      isCheckoutInFlightRef.current = true;
      setPurchaseState({ status: "creating", error: null });

      try {
        const response = await fetch("/api/payments/mono/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ planId })
        });

        const payload = (await response.json()) as {
          checkoutId?: string;
          redirectUrl?: string;
          error?: string;
          code?: string;
          redirectTo?: string;
        };

        if (!response.ok) {
          if (response.status === 409 && payload.code === "subscription_already_active" && payload.redirectTo) {
            router.replace(payload.redirectTo);
            return;
          }

          throw new Error(payload.error || "Не вдалося створити mono checkout.");
        }

        if (!payload.redirectUrl) {
          throw new Error("mono checkout створено без платіжного посилання.");
        }

        window.location.assign(payload.redirectUrl);
      } catch (error) {
        isCheckoutInFlightRef.current = false;
        setPurchaseState({ status: "idle", error: getCheckoutErrorMessage(error) });
      }
    },
    [planId, router]
  );

  const startPurchase = useCallback(async () => {
    setPurchaseState({ status: "checking", error: null });

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setPurchaseState({ status: "idle", error: null });
        openSignup();
        return;
      }

      await createCheckout(session.access_token);
    } catch (error) {
      setPurchaseState({ status: "idle", error: getCheckoutErrorMessage(error) });
    }
  }, [createCheckout, openSignup, supabase]);

  useEffect(() => {
    if (!shouldAutoStart || hasPromptedForAuthRef.current || isCheckoutInFlightRef.current) {
      return;
    }

    hasPromptedForAuthRef.current = true;
    void startPurchase();
  }, [shouldAutoStart, startPurchase]);

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!shouldAutoStart || !session?.access_token) {
        return;
      }

      setTimeout(() => {
        void createCheckout(session.access_token);
      }, 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [createCheckout, shouldAutoStart, supabase]);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={startPurchase}
        disabled={isBusy}
        className={`${className} disabled:cursor-not-allowed disabled:opacity-70`}
        data-testid={`pricing-purchase-${planId}`}
      >
        {purchaseState.status === "checking"
          ? "Перевіряємо акаунт..."
          : purchaseState.status === "creating"
            ? "Переходимо до оплати..."
            : label}
      </button>

      {purchaseState.error ? (
        <p className="rounded-[1rem] border border-[rgba(201,155,134,0.48)] bg-[var(--danger-soft)] px-3 py-2 text-sm leading-[1.55] text-[var(--danger-strong)]">
          {purchaseState.error}
        </p>
      ) : null}
    </div>
  );
}
