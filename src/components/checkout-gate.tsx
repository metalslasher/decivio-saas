"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import { formatUah, getCheckoutHref, pricingPlans } from "@/lib/pricing";

type CheckoutGateProps = {
  plan: (typeof pricingPlans)[number];
};

type CheckoutState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "user"; email: string };

export function CheckoutGate({ plan }: CheckoutGateProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [authState, setAuthState] = useState<CheckoutState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      const email = data.session?.user?.email?.trim();
      setAuthState(email ? { status: "user", email } : { status: "guest" });
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email?.trim();
      setAuthState(email ? { status: "user", email } : { status: "guest" });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const nextPath = getCheckoutHref(plan.id);
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
  const signupHref = `/signup?next=${encodeURIComponent(nextPath)}`;

  if (authState.status === "loading") {
    return (
      <div className="surface-panel rounded-[2rem] p-6 md:p-7">
        <p className="text-sm leading-[1.7] text-[var(--text-muted)]">Перевіряємо сесію перед оформленням…</p>
      </div>
    );
  }

  if (authState.status === "guest") {
    return (
      <div className="surface-panel rounded-[2rem] p-6 md:p-7">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">Крок перед оплатою</p>
          <h2 className="font-display text-[1.6rem] font-bold leading-[1.02] tracking-[-0.04em] text-[var(--text-strong)] md:text-[2rem]">
            Спочатку закріпимо доступ за акаунтом.
          </h2>
          <p className="text-[0.98rem] leading-[1.72] text-[var(--text-muted)]">
            Це потрібно, щоб після підключення mono checkout і успішної оплати платний доступ відкрився саме у вашому профілі, а
            не загубився між сесіями.
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Link href={signupHref} className="btn-primary text-center">
            Створити акаунт
          </Link>
          <Link href={loginHref} className="btn-secondary text-center">
            У мене вже є акаунт
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-[1.15fr,0.85fr]">
      <article className="surface-dark rounded-[2rem] p-6 text-white md:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/60">Обраний план</p>
        <h2 className="mt-3 font-display text-[1.8rem] font-bold leading-[0.98] tracking-[-0.045em] md:text-[2.3rem]">
          {plan.name}
        </h2>
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
          <p className="text-sm text-white/56">Поточний статус</p>
          <p className="mt-2 text-[0.98rem] leading-[1.7] text-white/82">
            Ви вже авторизовані як <span className="font-semibold text-white">{authState.email}</span>. Наступним кроком тут підключаємо
            створення mono invoice, редирект на hosted checkout і автозакриття доступу після webhook.
          </p>
        </div>
      </article>

      <article className="surface-panel rounded-[2rem] p-6 md:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">Що буде далі</p>
        <div className="mt-4 space-y-3">
          <p className="rounded-[1.3rem] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-[0.96rem] leading-[1.68] text-[var(--text-strong)]">
            1. Створюємо mono checkout invoice на сервері через merchant token.
          </p>
          <p className="rounded-[1.3rem] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-[0.96rem] leading-[1.68] text-[var(--text-strong)]">
            2. Переадресовуємо вас на mono hosted payment page.
          </p>
          <p className="rounded-[1.3rem] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-[0.96rem] leading-[1.68] text-[var(--text-strong)]">
            3. Отримуємо webhook, підтверджуємо оплату і відкриваємо весь платний функціонал у вашому акаунті.
          </p>
        </div>

        <span
          aria-disabled="true"
          className="mt-6 inline-flex w-full cursor-not-allowed items-center justify-center rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.72)] px-6 py-3 text-sm font-semibold text-[var(--text-soft)]"
        >
          Оплата mono підключається на наступному етапі
        </span>
      </article>
    </div>
  );
}
