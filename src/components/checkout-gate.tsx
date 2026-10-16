"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import { applyManualFullAccess } from "@/lib/manual-full-access";
import { formatUah, pricingPlans } from "@/lib/pricing";

type CheckoutGateProps = {
  plan: (typeof pricingPlans)[number];
  initialCheckoutId: string | null;
  authNextPath: string;
};

type SubscriptionSnapshot = {
  plan: "free" | "pro";
  status: "free" | "trial" | "active" | "canceled" | "past_due";
  currentPeriodEnd: string | null;
};

type CheckoutStatusPayload = {
  checkoutId: string;
  planId: string;
  billingKind: "subscription" | "one_time";
  status: "pending" | "processing" | "paid" | "active" | "failed" | "canceled" | "expired" | "reversed";
  accessGranted: boolean;
  redirectUrl: string | null;
  subscription: SubscriptionSnapshot | null;
  warning?: string | null;
};

type CheckoutStatusResponse = Partial<CheckoutStatusPayload> & {
  error?: string;
  warning?: string | null;
};

type CheckoutState =
  | { status: "loading" }
  | { status: "guest" }
  | {
      status: "user";
      email: string;
      accessToken: string;
      subscription: SubscriptionSnapshot;
    };

type CheckoutFlowState =
  | { status: "idle"; error: string | null }
  | { status: "creating"; error: string | null }
  | { status: "checking"; error: string | null; checkoutId: string }
  | { status: "resolved"; error: string | null; payload: CheckoutStatusPayload }
  | { status: "error"; error: string; checkoutId: string | null };

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "2-digit",
  month: "long",
  year: "numeric"
});

const checkoutPollIntervalMs = 3000;
const checkoutPollLimit = 10;

function isWaitingCheckoutStatus(status: CheckoutStatusPayload["status"]) {
  return status === "pending" || status === "processing";
}

function isRetryableCheckoutStatus(status: CheckoutStatusPayload["status"]) {
  return status === "failed" || status === "expired" || status === "canceled" || status === "reversed";
}

function canReopenMonoPayment(payload: CheckoutStatusPayload | null) {
  return Boolean(payload?.redirectUrl && isWaitingCheckoutStatus(payload.status));
}

function hasCurrentProAccess(subscription: SubscriptionSnapshot | null) {
  if (!subscription || subscription.plan !== "pro") {
    return false;
  }

  if (subscription.status !== "active" && subscription.status !== "trial" && subscription.status !== "canceled") {
    return false;
  }

  if (!subscription.currentPeriodEnd) {
    return subscription.status === "active" || subscription.status === "trial";
  }

  return new Date(subscription.currentPeriodEnd).getTime() > Date.now();
}

function formatAccessDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return dateFormatter.format(date);
}

function normalizeSubscriptionSnapshot(value: Partial<SubscriptionSnapshot> | null | undefined): SubscriptionSnapshot {
  const plan = value?.plan === "pro" ? "pro" : "free";
  const status =
    value?.status === "active" ||
    value?.status === "trial" ||
    value?.status === "canceled" ||
    value?.status === "past_due"
      ? value.status
      : "free";

  return {
    plan,
    status,
    currentPeriodEnd: typeof value?.currentPeriodEnd === "string" ? value.currentPeriodEnd : null
  };
}

function mapCheckoutStatusLabel(status: CheckoutStatusPayload["status"]) {
  switch (status) {
    case "processing":
      return "Обробка платежу";
    case "paid":
      return "Оплачено";
    case "active":
      return "Підписка активна";
    case "failed":
      return "Оплата не пройшла";
    case "canceled":
      return "Підписку зупинено";
    case "expired":
      return "Інвойс протерміновано";
    case "reversed":
      return "Платіж повернено";
    case "pending":
    default:
      return "Очікує підтвердження";
  }
}

function getCheckoutMessage(payload: CheckoutStatusPayload) {
  switch (payload.status) {
    case "paid":
      return "mono підтвердив оплату. Доступ уже закріплено за вашим акаунтом.";
    case "active":
      return "mono підтвердив підписку. Весь Pro-доступ уже відкритий у цьому профілі.";
    case "processing":
      return "Платіж уже в процесі. Зазвичай статус змінюється автоматично за кілька секунд.";
    case "failed":
      return "mono повернув неуспішний статус. Доступ не відкрито, можна створити нову оплату.";
    case "expired":
      return "Час життя цього рахунку завершився. Потрібно створити новий checkout.";
    case "reversed":
      return "mono повернув статус повернення. Доступ не буде відкрито, поки не з’явиться нова успішна оплата.";
    case "canceled":
      return "mono повідомив, що підписку скасовано. Доступ не активний, можна створити нову оплату.";
    case "pending":
    default:
      return "Чекаємо підтвердження від mono. Якщо ви вже повернулися після оплати, сторінка сама дотягне актуальний статус.";
  }
}

export function CheckoutGate({ plan, initialCheckoutId, authNextPath }: CheckoutGateProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { openAuthDialog } = useAuthDialog();
  const [authState, setAuthState] = useState<CheckoutState>({ status: "loading" });
  const [flowState, setFlowState] = useState<CheckoutFlowState>(
    initialCheckoutId ? { status: "checking", error: null, checkoutId: initialCheckoutId } : { status: "idle", error: null }
  );

  useEffect(() => {
    let isMounted = true;

    async function hydrate(sessionOverride?: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] | null) {
      const session = sessionOverride ?? (await supabase.auth.getSession()).data.session;

      if (!isMounted) {
        return;
      }

      if (!session?.user || !session.access_token) {
        setAuthState({ status: "guest" });
        return;
      }

      const { data: subscriptionRow } = await supabase
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      setAuthState({
        status: "user",
        email: session.user.email?.trim() || "Активна сесія",
        accessToken: session.access_token,
        subscription: applyManualFullAccess(
          session.user.email,
          normalizeSubscriptionSnapshot({
            plan: subscriptionRow?.plan,
            status: subscriptionRow?.status,
            currentPeriodEnd: subscriptionRow?.current_period_end
          })
        )
      });
    }

    hydrate();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrate(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const applyCheckoutSubscription = useCallback((payload: CheckoutStatusPayload) => {
    if (!payload.subscription) {
      return;
    }

    const nextSubscription = normalizeSubscriptionSnapshot(payload.subscription);
    setAuthState((current) =>
      current.status === "user"
        ? {
            ...current,
            subscription: nextSubscription
          }
        : current
    );
  }, []);

  const fetchCheckoutStatus = useCallback(
    async (checkoutId: string) => {
      if (authState.status !== "user") {
        throw new Error("Потрібно увійти в акаунт, щоб перевірити статус оплати.");
      }

      const response = await fetch(`/api/payments/mono/checkout/${checkoutId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authState.accessToken}`
        },
        cache: "no-store"
      });

      const payload = (await response.json()) as CheckoutStatusResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Не вдалося перевірити статус оплати.");
      }

      return payload as CheckoutStatusPayload;
    },
    [authState]
  );

  useEffect(() => {
    if (authState.status !== "user" || !initialCheckoutId) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let pollAttempt = 0;

    const pollCheckoutStatus = async () => {
      pollAttempt += 1;

      try {
        setFlowState((current) => ({
          status: "checking",
          error: current.error,
          checkoutId: initialCheckoutId
        }));

        const payload = await fetchCheckoutStatus(initialCheckoutId);
        if (cancelled) {
          return;
        }

        applyCheckoutSubscription(payload);

        setFlowState({
          status: "resolved",
          error: payload.warning ?? null,
          payload
        });

        if (isWaitingCheckoutStatus(payload.status)) {
          if (pollAttempt < checkoutPollLimit) {
            timeoutId = setTimeout(pollCheckoutStatus, checkoutPollIntervalMs);
            return;
          }

          setFlowState({
            status: "resolved",
            error: "Статус ще очікує підтвердження від mono. Ви можете перевірити ще раз або повернутися до цієї сторінки пізніше.",
            payload
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setFlowState({
          status: "error",
          error: error instanceof Error ? error.message : "Не вдалося перевірити статус оплати.",
          checkoutId: initialCheckoutId
        });
      }
    };

    pollCheckoutStatus();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [applyCheckoutSubscription, authState.status, fetchCheckoutStatus, initialCheckoutId]);

  const resolvedPayload = flowState.status === "resolved" ? flowState.payload : null;
  const subscription =
    resolvedPayload?.subscription
      ? normalizeSubscriptionSnapshot(resolvedPayload.subscription)
      : authState.status === "user"
        ? authState.subscription
        : null;
  const activeUntilLabel = formatAccessDate(subscription?.currentPeriodEnd ?? null);
  const hasActiveProAccess = hasCurrentProAccess(subscription);

  const handleCheckCheckoutStatus = async (checkoutId: string) => {
    if (authState.status !== "user") {
      return;
    }

    setFlowState({ status: "checking", error: null, checkoutId });

    try {
      const payload = await fetchCheckoutStatus(checkoutId);
      applyCheckoutSubscription(payload);
      setFlowState({
        status: "resolved",
        error: payload.warning ?? null,
        payload
      });
    } catch (error) {
      setFlowState({
        status: "error",
        error: error instanceof Error ? error.message : "Не вдалося перевірити статус оплати.",
        checkoutId
      });
    }
  };

  const handleCreateCheckout = async () => {
    if (authState.status !== "user") {
      return;
    }

    setFlowState({ status: "creating", error: null });

    try {
      const response = await fetch("/api/payments/mono/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.accessToken}`
        },
        body: JSON.stringify({ planId: plan.id })
      });

      const payload = (await response.json()) as {
        checkoutId?: string;
        redirectUrl?: string;
        status?: CheckoutStatusPayload["status"];
        error?: string;
        code?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        if (response.status === 409 && payload.code === "subscription_already_active" && payload.redirectTo) {
          window.location.assign(payload.redirectTo);
          return;
        }

        setFlowState({
          status: "error",
          error: payload.error || "Не вдалося створити оплату mono.",
          checkoutId: payload.checkoutId ?? null
        });
        return;
      }

      if (!payload.redirectUrl) {
        setFlowState({
          status: "error",
          error: "Оплату створено без платіжного посилання. Спробуйте ще раз.",
          checkoutId: payload.checkoutId ?? null
        });
        return;
      }

      window.location.assign(payload.redirectUrl);
    } catch (error) {
      setFlowState({
        status: "error",
        error: error instanceof Error ? error.message : "Не вдалося створити оплату mono.",
        checkoutId: null
      });
    }
  };

  const handlePrimaryCheckoutAction = () => {
    if (resolvedPayload && isWaitingCheckoutStatus(resolvedPayload.status)) {
      void handleCheckCheckoutStatus(resolvedPayload.checkoutId);
      return;
    }

    void handleCreateCheckout();
  };

  if (authState.status === "loading") {
    return (
      <div className="surface-panel rounded-[2rem] p-6 md:p-7">
        <p className="text-sm leading-[1.7] text-[var(--text-muted)]">Перевіряємо сесію перед оформленням...</p>
      </div>
    );
  }

  if (authState.status === "guest") {
    return (
      <div className="surface-panel rounded-[2rem] p-6 md:p-7">
        <div className="space-y-3">
          <span className="eyebrow-pill">Крок перед оплатою</span>
          <h2 className="section-title max-w-xl">
            Спочатку закріпимо доступ за акаунтом.
          </h2>
          <p className="body-copy max-w-2xl">
            Після успішної mono-оплати саме цей профіль автоматично отримає платний доступ, історію оплат і подальше керування
            підпискою.
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <button type="button" onClick={() => openAuthDialog("signup", { nextPath: authNextPath })} className="btn-primary text-center">
            Створити акаунт
          </button>
          <button type="button" onClick={() => openAuthDialog("login", { nextPath: authNextPath })} className="btn-secondary text-center">
            У мене вже є акаунт
          </button>
        </div>
      </div>
    );
  }

  const checkoutStatusLabel = resolvedPayload ? mapCheckoutStatusLabel(resolvedPayload.status) : null;
  const checkoutMessage = resolvedPayload ? getCheckoutMessage(resolvedPayload) : null;
  const checkoutActiveUntil = formatAccessDate(resolvedPayload?.subscription?.currentPeriodEnd ?? null);
  const primaryCheckoutButtonLabel =
    flowState.status === "creating"
      ? "Створюємо оплату mono..."
      : flowState.status === "checking"
        ? "Перевіряємо статус..."
        : resolvedPayload && isWaitingCheckoutStatus(resolvedPayload.status)
          ? "Перевірити статус ще раз"
          : resolvedPayload && isRetryableCheckoutStatus(resolvedPayload.status)
            ? "Створити нову оплату"
            : "Перейти до оплати mono";

  return (
    <div className="grid gap-5 md:grid-cols-[1.15fr,0.85fr]">
      <article className="surface-dark rounded-[2rem] p-6 text-white md:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/60">Обраний план</p>
        <h2 className="mt-3 font-display text-[1.8rem] font-bold leading-[1] tracking-normal md:text-[2.3rem]">{plan.name}</h2>
        <p className="mt-3 text-[1rem] leading-[1.72] text-white/72">{plan.description}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.35rem] border border-white/10 bg-white/8 px-4 py-4">
            <p className="text-sm text-white/56">Вартість</p>
            <p className="mt-2 text-[1.28rem] font-semibold text-white">{formatUah(plan.billedNowUah)}</p>
          </div>
          <div className="rounded-[1.35rem] border border-white/10 bg-white/8 px-4 py-4">
            <p className="text-sm text-white/56">Формат списання</p>
            <p className="mt-2 text-[1.05rem] font-semibold text-white">{plan.billingLabel}</p>
          </div>
        </div>

        <div className="mt-6 rounded-[1.35rem] border border-white/10 bg-white/8 px-4 py-4">
          <p className="text-sm text-white/56">Акаунт для доступу</p>
          <p className="mt-2 text-[0.98rem] leading-[1.7] text-white/82">
            Платіж буде прив’язано до <span className="font-semibold text-white">{authState.email}</span>.
          </p>
          <p className="mt-2 text-[0.94rem] leading-[1.7] text-white/60">
            Поточний стан доступу:{" "}
            <span className="font-semibold text-white">
              {subscription?.plan === "pro" ? "Pro вже активний" : "базовий доступ"}
            </span>
            {activeUntilLabel ? ` до ${activeUntilLabel}` : ""}.
          </p>
        </div>
      </article>

      <article className="surface-panel rounded-[2rem] p-6 md:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">Що далі</p>

        {hasActiveProAccess ? (
          <div className="mt-4 space-y-4">
            <p className="rounded-[1.3rem] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-[0.96rem] leading-[1.68] text-[var(--text-strong)]">
              {resolvedPayload?.accessGranted
                ? "Оплату підтверджено, Pro-доступ відкритий для цього акаунта"
                : "Для цього акаунта Pro вже активний"}
              {activeUntilLabel ? ` до ${activeUntilLabel}` : ""}. Повторно запускати оплату не потрібно.
            </p>
            <Link href="/hire" className="btn-primary w-full text-center" data-testid="billing-dashboard-link">
              Перейти в кабінет
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="rounded-[1.3rem] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-[0.96rem] leading-[1.68] text-[var(--text-strong)]">
              1. На сервері створюємо mono checkout під ваш план і цей акаунт.
            </p>
            <p className="rounded-[1.3rem] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-[0.96rem] leading-[1.68] text-[var(--text-strong)]">
              2. Переадресовуємо на hosted payment page mono без передачі merchant token у браузер.
            </p>
            <p className="rounded-[1.3rem] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-[0.96rem] leading-[1.68] text-[var(--text-strong)]">
              3. Після повернення або webhook ми підтягнемо актуальний статус і відкриємо доступ у профілі.
            </p>
          </div>
        )}

        {!hasActiveProAccess ? (
          <>
            {resolvedPayload ? (
              <div className="mt-6 rounded-[1.35rem] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.72)] px-4 py-4">
                <p className="text-sm font-semibold text-[var(--text-strong)]">{checkoutStatusLabel}</p>
                <p className="mt-2 text-[0.94rem] leading-[1.68] text-[var(--text-muted)]">{checkoutMessage}</p>
                {checkoutActiveUntil ? (
                  <p className="mt-2 text-[0.9rem] leading-[1.6] text-[var(--text-soft)]">Поточний доступ зафіксовано до {checkoutActiveUntil}.</p>
                ) : null}
                {flowState.error ? (
                  <p className="mt-2 text-[0.9rem] leading-[1.6] text-[var(--text-soft)]">{flowState.error}</p>
                ) : null}
              </div>
            ) : null}

            {flowState.status === "error" ? (
              <p className="mt-6 rounded-[1.2rem] border border-[rgba(201,155,134,0.5)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger-strong)]">
                {flowState.error}
              </p>
            ) : null}

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={handlePrimaryCheckoutAction}
                disabled={flowState.status === "creating" || flowState.status === "checking"}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
              >
                {primaryCheckoutButtonLabel}
              </button>

              {resolvedPayload?.redirectUrl && canReopenMonoPayment(resolvedPayload) ? (
                <a
                  href={resolvedPayload.redirectUrl}
                  className="btn-secondary w-full text-center"
                  target="_self"
                  rel="noreferrer"
                >
                  Відкрити поточну оплату ще раз
                </a>
              ) : null}

              {resolvedPayload?.accessGranted ? (
                <Link href="/hire" className="btn-secondary w-full text-center" data-testid="billing-dashboard-link">
                  Перейти в кабінет
                </Link>
              ) : null}
            </div>
          </>
        ) : null}
      </article>
    </div>
  );
}
