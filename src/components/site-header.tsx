"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { WordmarkLogo } from "@/components/wordmark-logo";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";

const publicNavItems = [
  { href: "/#features", label: "Можливості" },
  { href: "/#faq", label: "Часті питання" },
  { href: "/#reviews", label: "Відгуки" },
  { href: "/pricing", label: "Ціни" }
];

const dashboardMobileItems = [
  { href: "/dashboard", label: "Головна" },
  { href: "/dashboard?view=scenario", label: "Мій сценарій" },
  { href: "/dashboard?view=resume", label: "CV Builder" },
  { href: "/dashboard?view=interviews", label: "Співбесіди" },
  { href: "/dashboard?view=jobs", label: "Нова робота" },
  { href: "/dashboard?view=offers", label: "Порівняння оферів" },
  { href: "/dashboard?view=assistant", label: "AI Assistant" },
  { href: "/dashboard?view=access", label: "Тариф і доступ" }
];

type AuthState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "user"; email: string };

function getInitials(email: string) {
  const localPart = email.split("@")[0]?.trim() ?? "";
  const normalized = localPart.replace(/[^a-zA-Zа-яА-ЯіїєІЇЄґҐ0-9]+/g, " ").trim();
  const parts = normalized.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return (parts[0] ?? localPart.slice(0, 2) ?? "DC").slice(0, 2).toUpperCase();
}

function getShortProfileLabel(email: string) {
  return email.split("@")[0]?.trim() ?? email;
}

function NotificationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 16.5h11" />
      <path d="M8 16.5V11a4 4 0 1 1 8 0v5.5" />
      <path d="M5 16.5h14l-1.5 2.5H6.5L5 16.5Z" />
      <path d="M10.5 19a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { openAuthDialog } = useAuthDialog();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [headerProgress, setHeaderProgress] = useState(0);
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });
  const [dashboardSearch, setDashboardSearch] = useState("");

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

  useEffect(() => {
    const maxScroll = 168;
    let frameId = 0;

    const syncHeaderProgress = () => {
      frameId = 0;
      setHeaderProgress(Math.min(window.scrollY / maxScroll, 1));
    };

    const handleScroll = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(syncHeaderProgress);
    };

    syncHeaderProgress();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setDashboardSearch(new URLSearchParams(window.location.search).get("search") ?? "");
  }, [pathname]);

  if (pathname?.startsWith("/auth/callback")) {
    return null;
  }

  const isDashboardArea = pathname?.startsWith("/dashboard") ?? false;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    setIsOpen(false);
    setIsSigningOut(false);
    router.refresh();
    router.push(isDashboardArea ? "/dashboard" : "/");
  };

  const openLoginDialog = () => {
    openAuthDialog("login", { nextPath: "/dashboard" });
  };

  const openSignupDialog = () => {
    openAuthDialog("signup", { nextPath: "/dashboard" });
  };

  const submitDashboardSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedQuery = dashboardSearch.trim();
    const query = normalizedQuery ? `?search=${encodeURIComponent(normalizedQuery)}` : "";

    setIsOpen(false);
    router.push(`/dashboard${query}`);
  };

  if (isDashboardArea) {
    const headerTone = authState.status === "user" ? "light" : "light";
    const profileInitials = authState.status === "user" ? getInitials(authState.email) : "DC";
    const profileLabel = authState.status === "user" ? getShortProfileLabel(authState.email) : "Гість";

    return (
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[rgba(8,10,18,0.84)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1480px] items-center gap-3 px-4 py-3 md:px-6 lg:gap-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 lg:gap-4">
            <Link href={authState.status === "user" ? "/dashboard" : "/"} aria-label="Decivio" className="inline-flex items-center">
              <WordmarkLogo tone={headerTone} className="text-[2rem] md:text-[2.18rem]" />
            </Link>
            <span className="hidden rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-semibold text-white/54 xl:inline-flex">
              Career workspace
            </span>
          </div>

          {authState.status === "user" ? (
            <form onSubmit={submitDashboardSearch} className="hidden min-w-0 flex-1 md:flex">
              <label className="workspace-search-field flex w-full items-center gap-3">
                <span className="text-white/34">
                  <SearchIcon />
                </span>
                <input
                  value={dashboardSearch}
                  onChange={(event) => setDashboardSearch(event.target.value)}
                  placeholder="Пошук модулів, сценаріїв і дій"
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/32"
                />
              </label>
            </form>
          ) : (
            <div className="hidden min-w-0 flex-1 md:block" />
          )}

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {authState.status === "loading" ? (
              <span className="hidden rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-semibold text-white/46 md:inline-flex">
                Сесія...
              </span>
            ) : authState.status === "user" ? (
              <>
                <Link href="/dashboard?view=scenario" className="workspace-button-primary hidden lg:inline-flex">
                  Продовжити сценарій
                </Link>

                <Link href="/dashboard#activity" className="workspace-icon-button hidden md:inline-flex" aria-label="Перейти до activity feed">
                  <NotificationIcon />
                </Link>

                <Link
                  href="/dashboard?view=access"
                  className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-2 text-white transition hover:border-white/16 hover:bg-white/[0.08] md:inline-flex"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.08] text-sm font-semibold">
                    {profileInitials}
                  </span>
                  <span className="hidden min-w-0 xl:block">
                    <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/40">Профіль</span>
                    <span className="block max-w-[10rem] truncate text-sm font-semibold text-white/82">{profileLabel}</span>
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="hidden px-2 text-sm font-semibold text-white/58 transition hover:text-white disabled:opacity-60 lg:inline-flex"
                >
                  {isSigningOut ? "Виходимо..." : "Вийти"}
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={openLoginDialog} className="workspace-button-secondary hidden md:inline-flex">
                  Вхід
                </button>
                <button type="button" onClick={openSignupDialog} className="workspace-button-primary hidden md:inline-flex">
                  Реєстрація
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="workspace-icon-button lg:hidden"
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
          <div className="border-t border-white/8 px-4 py-4 md:px-6 lg:hidden">
            <div className="mx-auto max-w-[1480px] space-y-3">
              {authState.status === "user" ? (
                <>
                  <form onSubmit={submitDashboardSearch}>
                    <label className="workspace-search-field flex w-full items-center gap-3">
                      <span className="text-white/34">
                        <SearchIcon />
                      </span>
                      <input
                        value={dashboardSearch}
                        onChange={(event) => setDashboardSearch(event.target.value)}
                        placeholder="Пошук модулів, сценаріїв і дій"
                        className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/32"
                      />
                    </label>
                  </form>

                  <div className="grid gap-2">
                    {dashboardMobileItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="rounded-[1.2rem] border border-white/8 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/72 transition hover:border-white/12 hover:bg-white/[0.08] hover:text-white"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  <div className="grid gap-2 pt-2">
                    <Link href="/dashboard?view=access" onClick={() => setIsOpen(false)} className="workspace-button-secondary w-full">
                      Профіль і доступ
                    </Link>
                    <button type="button" onClick={handleSignOut} disabled={isSigningOut} className="workspace-button-dark w-full disabled:opacity-60">
                      {isSigningOut ? "Виходимо..." : "Вийти"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="grid gap-2">
                  <button type="button" onClick={openLoginDialog} className="workspace-button-secondary w-full">
                    Вхід
                  </button>
                  <button type="button" onClick={openSignupDialog} className="workspace-button-primary w-full">
                    Реєстрація
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </header>
    );
  }

  const navItems =
    authState.status === "user" ? [{ href: "/dashboard", label: "Кабінет" }, ...publicNavItems] : publicNavItems;
  const effectiveHeaderProgress = Math.max(headerProgress, isOpen ? 1 : 0);
  const headerStyle = { "--mirror-progress": effectiveHeaderProgress } as CSSProperties;

  return (
    <header className="sticky top-0 z-50">
      <div className="w-full">
        <nav style={headerStyle} className="mirror-header relative w-full overflow-hidden px-4 py-3 md:px-6 md:py-4 lg:px-8">
          <div className="relative z-[1] flex items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <Link href={authState.status === "user" ? "/dashboard" : "/"} aria-label="Decivio" className="inline-flex items-center">
                <WordmarkLogo className="text-[2.1rem] md:text-[2.35rem]" />
              </Link>
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
                  <span className="rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.76)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)]">
                    {authState.email}
                  </span>

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
                    className="hidden min-w-[11.2rem] items-center justify-start gap-3 rounded-full bg-[var(--accent-strong)] px-3 py-2.5 pr-4 text-[1.03rem] font-semibold text-white transition hover:-translate-y-px hover:bg-[var(--accent)] md:inline-flex"
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
                  <div className="rounded-2xl border border-[var(--line-soft)] bg-[rgba(255,255,255,0.76)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)]">
                    {authState.email}
                  </div>

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
