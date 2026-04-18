"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties } from "react";
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

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { openAuthDialog } = useAuthDialog();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [headerProgress, setHeaderProgress] = useState(0);
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

  if (pathname?.startsWith("/auth/callback") || pathname?.startsWith("/dashboard")) {
    return null;
  }

  const effectiveHeaderProgress = Math.max(headerProgress, isOpen ? 1 : 0);
  const headerStyle = { "--mirror-progress": effectiveHeaderProgress } as CSSProperties;
  const profileLabel = authState.status === "user" ? getShortProfileLabel(authState.email) : null;
  const profileInitials = authState.status === "user" ? getInitials(authState.email) : null;

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
        <nav style={headerStyle} className="mirror-header relative w-full overflow-hidden px-4 py-3 md:px-6 md:py-4 lg:px-8">
          <div className="relative z-[1] flex items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <Link href="/" aria-label="Decivio" className="inline-flex items-center">
                <WordmarkLogo className="text-[2.1rem] md:text-[2.35rem]" />
              </Link>
            </div>

            <div className="hidden items-center gap-7 lg:flex">
              {publicNavItems.map((item) => (
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
                  <Link href="/dashboard" className="account-cta-pill">
                    У кабінет
                  </Link>

                  <div className="group relative">
                    <Link href="/dashboard?view=access" className="account-profile-pill">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(238,242,255,0.92)] text-sm font-semibold text-[var(--accent-strong)]">
                        {profileInitials}
                      </span>
                      <span className="hidden min-w-0 lg:block">
                        <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-soft)]">Профіль</span>
                        <span className="block max-w-[10rem] truncate text-sm font-semibold text-[var(--text-strong)]">{profileLabel}</span>
                      </span>
                    </Link>

                    <div className="pointer-events-none absolute right-0 top-full z-40 translate-y-1 pt-2 opacity-0 transition-all duration-150 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                      <div className="account-menu-panel min-w-[11.5rem] p-2">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          disabled={isSigningOut}
                          className="account-menu-action disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSigningOut ? "Виходимо..." : "Вийти"}
                        </button>
                      </div>
                    </div>
                  </div>
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
              {publicNavItems.map((item) => (
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
                  <Link href="/dashboard" onClick={() => setIsOpen(false)} className="btn-primary mt-2">
                    У кабінет
                  </Link>
                  <Link
                    href="/dashboard?view=access"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--line-soft)] bg-[rgba(255,255,255,0.76)] px-3 py-3 text-sm font-semibold text-[var(--text-muted)]"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(238,242,255,0.92)] text-sm font-semibold text-[var(--accent-strong)]">
                      {profileInitials}
                    </span>
                    <span className="truncate">{profileLabel}</span>
                  </Link>
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
