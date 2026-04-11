"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { WordmarkLogo } from "@/components/wordmark-logo";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";

const publicNavItems = [
  { href: "/#features", label: "Можливості" },
  { href: "/#process", label: "Як це працює" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#reviews", label: "Відгуки" },
  { href: "/pricing", label: "Ціни" }
];

const dashboardNavItems = [
  { href: "/dashboard", label: "Огляд" },
  { href: "/dashboard?view=scenarios", label: "Сценарії" },
  { href: "/dashboard?view=access", label: "Доступ" },
  { href: "/dashboard?view=tools", label: "Інструменти" }
];

type AuthState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "user"; email: string };

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { openAuthDialog } = useAuthDialog();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });

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

  const isDashboardArea = pathname?.startsWith("/dashboard") ?? false;
  const isDashboardUser = authState.status === "user" && isDashboardArea;
  const logoHref = isDashboardUser ? "/dashboard" : "/";
  const navItems = isDashboardUser ? dashboardNavItems : authState.status === "user" ? [{ href: "/dashboard", label: "Кабінет" }, ...publicNavItems] : publicNavItems;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    setIsOpen(false);
    setIsSigningOut(false);
    router.refresh();
    router.push("/");
  };

  const openLoginDialog = () => {
    openAuthDialog("login", { nextPath: "/dashboard" });
  };

  const openSignupDialog = () => {
    openAuthDialog("signup", { nextPath: "/dashboard" });
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="w-full">
        <nav className="mirror-header relative w-full overflow-hidden px-4 py-3 md:px-6 md:py-4 lg:px-8">
          <div className="relative z-[1] flex items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <Link href={logoHref} aria-label="Decivio" className="inline-flex items-center">
                <WordmarkLogo className="text-[2.1rem] md:text-[2.35rem]" />
              </Link>

              {isDashboardUser ? (
                <span className="hidden rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.76)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)] lg:inline-flex">
                  Кабінет
                </span>
              ) : null}
            </div>

            <div className="hidden items-center gap-7 lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-semibold text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {authState.status === "loading" ? (
                <span className="hidden rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.76)] px-3 py-2 text-sm font-semibold text-[var(--text-soft)] md:inline-flex">
                  Сесія...
                </span>
              ) : authState.status === "user" ? (
                <div className="hidden items-center gap-3 md:flex">
                  {isDashboardUser ? (
                    <Link href="/simulate" className="btn-secondary !px-5 !py-2.5">
                      Симуляція
                    </Link>
                  ) : (
                    <span className="rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.76)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)]">
                      {authState.email}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="inline-flex items-center justify-center px-2 text-[1.03rem] font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSigningOut ? "Виходимо..." : "Вийти"}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={openLoginDialog}
                    className="hidden items-center justify-center px-2 text-[1.03rem] font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)] md:inline-flex"
                  >
                    Вхід
                  </button>
                  <button
                    type="button"
                    onClick={openSignupDialog}
                    className="hidden min-w-[11.2rem] items-center justify-start gap-3 rounded-full bg-[var(--accent-strong)] px-3 py-2.5 pr-4 text-[1.03rem] font-semibold text-white shadow-[0_14px_30px_-22px_rgba(41,73,244,0.54)] transition hover:-translate-y-px hover:bg-[var(--accent)] md:inline-flex"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--accent-strong)]">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none" aria-hidden="true">
                        <path d="M6 12h11M12 7l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span>Реєстрація</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/64 bg-[rgba(252,253,255,0.74)] text-[var(--accent-strong)] transition hover:bg-[rgba(255,255,255,0.9)] lg:hidden"
                aria-label="Відкрити меню"
                aria-expanded={isOpen}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none" aria-hidden="true">
                  <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {isOpen ? (
            <div className="relative z-[1] mt-3 grid gap-2 border-t border-[rgba(23,24,28,0.08)] pt-3 lg:hidden">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-2xl px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[rgba(248,250,255,0.86)] hover:text-[var(--accent-strong)]"
                >
                  {item.label}
                </Link>
              ))}

              {authState.status === "user" ? (
                <>
                  {isDashboardUser ? (
                    <Link href="/simulate" onClick={() => setIsOpen(false)} className="btn-secondary mt-1">
                      Симуляція
                    </Link>
                  ) : (
                    <div className="rounded-2xl border border-[var(--line-soft)] bg-[rgba(255,255,255,0.76)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)]">
                      {authState.email}
                    </div>
                  )}

                  <button type="button" onClick={handleSignOut} disabled={isSigningOut} className="btn-secondary mt-1">
                    {isSigningOut ? "Виходимо..." : "Вийти"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      openLoginDialog();
                    }}
                    className="btn-secondary mt-1"
                  >
                    Вхід
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      openSignupDialog();
                    }}
                    className="btn-primary"
                  >
                    Реєстрація
                  </button>
                </>
              )}
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
