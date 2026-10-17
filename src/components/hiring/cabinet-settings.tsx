"use client";

import { useRouter } from "next/navigation";
import { NotificationsCard } from "@/components/hiring/notifications-card";
import { useEmployerSession } from "@/components/hiring/use-employer-session";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";

export function CabinetSettings() {
  const router = useRouter();
  const session = useEmployerSession();
  const email = session.status === "user" ? session.email : null;

  return (
    <div className="mx-auto max-w-3xl fade-up">
      <h1 className="section-title">Налаштування</h1>

      <h2 className="mt-8 text-sm font-extrabold uppercase tracking-wide text-[var(--text-soft)]">Сповіщення</h2>
      <NotificationsCard
        fallback={<p className="card mt-4 p-5 text-sm text-[var(--text-muted)]">Сповіщення в Telegram ще не налаштовані на сервері.</p>}
      />

      <h2 className="mt-10 text-sm font-extrabold uppercase tracking-wide text-[var(--text-soft)]">Акаунт</h2>
      <section className="card mt-4 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[var(--text-muted)]">Електронна пошта</p>
          <p className="mt-1 truncate font-extrabold text-[var(--text-strong)]">{email ?? "—"}</p>
        </div>
        <button
          type="button"
          className="btn-secondary !py-2.5 text-sm"
          onClick={async () => {
            await getSupabaseBrowserClient().auth.signOut();
            router.push("/");
            router.refresh();
          }}
        >
          Вийти з акаунта
        </button>
      </section>

      <p className="body-copy mt-8 text-sm">
        Щоб видалити акаунт і всі дані, напишіть на oleg.burikov.adv@gmail.com — ми видалимо їх протягом 3 робочих днів.
      </p>
    </div>
  );
}
