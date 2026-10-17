"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { useEmployerSession } from "@/components/hiring/use-employer-session";
import { WordmarkLogo } from "@/components/wordmark-logo";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import { apiRequest } from "@/lib/hiring/client";
import type { EmployerUsage, VacancySummary } from "@/lib/hiring/types";

type CabinetContextValue = {
  vacancies: VacancySummary[] | null;
  usage: EmployerUsage | null;
  refresh: () => Promise<void>;
};

const CabinetContext = createContext<CabinetContextValue>({ vacancies: null, usage: null, refresh: async () => {} });

export function useCabinet() {
  return useContext(CabinetContext);
}

function Icon({ name }: { name: "list" | "plus" | "card" | "settings" | "back" | "logout" }) {
  const paths: Record<typeof name, string> = {
    list: "M4 6h16M4 12h16M4 18h10",
    plus: "M12 5v14M5 12h14",
    card: "M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9ZM3 10h18M7.5 15h3",
    settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
    back: "M10 6l-6 6 6 6M4 12h16",
    logout: "M14 7l5 5-5 5M8 12h11M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10",
  };
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" aria-hidden="true">
      <path d={paths[name]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV = [
  { href: "/hire", label: "Вакансії", icon: "list" as const, match: (path: string) => path === "/hire" || /^\/hire\/[0-9a-f-]{36}/.test(path) },
  { href: "/hire/new", label: "Нова вакансія", icon: "plus" as const, match: (path: string) => path === "/hire/new" },
  { href: "/hire/billing", label: "Тариф і оплата", icon: "card" as const, match: (path: string) => path.startsWith("/hire/billing") },
  { href: "/hire/settings", label: "Налаштування", icon: "settings" as const, match: (path: string) => path.startsWith("/hire/settings") },
];

export function CabinetShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/hire";
  const router = useRouter();
  const session = useEmployerSession();
  const { openAuthDialog } = useAuthDialog();
  const [vacancies, setVacancies] = useState<VacancySummary[] | null>(null);
  const [usage, setUsage] = useState<EmployerUsage | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await apiRequest<{ vacancies: VacancySummary[]; usage: EmployerUsage }>("/api/hiring/vacancies", { auth: true });
      setVacancies(result.vacancies);
      setUsage(result.usage);
    } catch {
      setVacancies([]);
    }
  }, []);

  useEffect(() => {
    if (session.status === "user") void refresh();
  }, [session.status, pathname, refresh]);

  const signOut = async () => {
    await getSupabaseBrowserClient().auth.signOut();
    router.push("/");
    router.refresh();
  };

  // Guests can try the vacancy builder in a focused layout; everything else needs an account.
  if (session.status === "guest" && pathname === "/hire/new") {
    return (
      <div className="cabinet-shell">
        <header className="cabinet-topbar flex items-center justify-between px-4 py-3 md:px-8">
          <Link href="/" aria-label="Decivio">
            <WordmarkLogo className="text-[1.8rem]" />
          </Link>
          <button type="button" className="header-login-button" onClick={() => openAuthDialog("login", { nextPath: "/hire" })}>
            Увійти
          </button>
        </header>
        <div className="px-4 pb-16 pt-4 md:px-8">{children}</div>
      </div>
    );
  }

  if (session.status === "guest") {
    return (
      <div className="cabinet-shell grid place-items-center px-4">
        <div className="card w-full max-w-md p-8 text-center fade-up">
          <Link href="/" aria-label="Decivio" className="inline-block">
            <WordmarkLogo className="text-[2rem]" />
          </Link>
          <h1 className="panel-title mt-6">Кабінет роботодавця</h1>
          <p className="body-copy mt-2">Увійдіть, щоб бачити вакансії, кандидатів і записи на співбесіди.</p>
          <div className="mt-6 grid gap-2">
            <button type="button" className="btn-primary" onClick={() => openAuthDialog("login", { nextPath: pathname })}>
              Увійти
            </button>
            <button type="button" className="btn-secondary" onClick={() => openAuthDialog("signup", { nextPath: pathname })}>
              Створити акаунт
            </button>
          </div>
          <Link href="/hire/new" className="text-link mt-5 inline-block text-sm">
            Спершу спробувати створити вакансію →
          </Link>
        </div>
      </div>
    );
  }

  if (session.status === "loading") {
    return <div className="cabinet-shell" />;
  }

  const email = session.email ?? "";
  // Builder and editor have their own sticky action bar on mobile.
  const hideTabbar = pathname === "/hire/new" || pathname.endsWith("/edit");
  const activeVacancies = (vacancies ?? []).filter((vacancy) => vacancy.status === "active");

  return (
    <CabinetContext.Provider value={{ vacancies, usage, refresh }}>
      <div className="cabinet-shell">
        <aside className="cabinet-sidebar hidden lg:flex">
          <div className="px-5 pb-4 pt-5">
            <Link href="/hire" aria-label="Decivio">
              <WordmarkLogo className="text-[1.9rem]" />
            </Link>
            <p className="mt-1 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--text-soft)]">Кабінет роботодавця</p>
          </div>

          <nav className="space-y-1 px-3">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="cabinet-nav-link" data-active={item.match(pathname)}>
                <Icon name={item.icon} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-3">
            <p className="px-3 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--text-soft)]">Активні вакансії</p>
            <div className="mt-2 space-y-0.5">
              {vacancies === null ? (
                <div className="space-y-2 px-3 pt-1">
                  <div className="shimmer h-4 w-3/4" />
                  <div className="shimmer h-4 w-1/2" />
                </div>
              ) : activeVacancies.length === 0 ? (
                <p className="px-3 text-sm text-[var(--text-soft)]">Поки немає</p>
              ) : (
                activeVacancies.map((vacancy) => (
                  <Link
                    key={vacancy.id}
                    href={`/hire/${vacancy.id}`}
                    className="cabinet-nav-link !py-2 !text-[0.86rem]"
                    data-active={pathname.startsWith(`/hire/${vacancy.id}`)}
                  >
                    <span className="min-w-0 flex-1 truncate">{vacancy.title}</span>
                    {vacancy.applications_new > 0 ? (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--accent)] px-1.5 text-[0.68rem] font-extrabold text-white">
                        {vacancy.applications_new}
                      </span>
                    ) : null}
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-[var(--line-soft)] p-3">
            {usage?.plan === "free" ? (
              <Link href="/hire/billing" className="mb-2 block rounded-2xl bg-[var(--accent-soft)] p-3 text-xs font-semibold text-[var(--accent-strong)]">
                Безкоштовний тариф · оцінено {usage.screenedApplications} з {usage.limits.screenedApplications}
                <span className="mt-1 block font-extrabold">Перейти на Pro →</span>
              </Link>
            ) : null}
            <div className="flex items-center gap-2 px-2 py-1.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-xs font-extrabold uppercase text-[var(--accent-strong)]">
                {email.slice(0, 2) || "DC"}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--text-muted)]">{email}</span>
              <button type="button" onClick={signOut} className="text-[var(--text-soft)] hover:text-[var(--bad)]" aria-label="Вийти" title="Вийти">
                <Icon name="logout" />
              </button>
            </div>
            <Link href="/" className="cabinet-nav-link !py-2 !text-xs">
              <Icon name="back" />
              На сайт Decivio
            </Link>
          </div>
        </aside>

        <header className="cabinet-topbar sticky top-0 z-30 flex items-center justify-between border-b border-[var(--line-soft)] bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/hire" aria-label="Decivio">
            <WordmarkLogo className="text-[1.6rem]" />
          </Link>
          <button type="button" onClick={signOut} className="text-xs font-bold text-[var(--text-soft)]">
            Вийти
          </button>
        </header>

        <div className="cabinet-content">{children}</div>

        <nav className={`cabinet-tabbar grid lg:hidden ${hideTabbar ? "!hidden" : ""}`}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="cabinet-tab" data-active={item.match(pathname)}>
              <Icon name={item.icon} />
              {item.label.replace("Нова вакансія", "Нова").replace("Тариф і оплата", "Тариф")}
            </Link>
          ))}
        </nav>
      </div>
    </CabinetContext.Provider>
  );
}
