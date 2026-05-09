"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { WordmarkLogo } from "@/components/wordmark-logo";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import { PROFILE_UPDATED_EVENT, isBroadcastProfilePayload } from "@/lib/profile-broadcast";

const publicNavItems = [
  { href: "/#features", label: "Можливості" },
  { href: "/#faq", label: "Часті питання" },
  { href: "/#reviews", label: "Відгуки" },
  { href: "/pricing", label: "Ціни" }
];

const simulateCtaHref = "https://www.decivio.net/simulate";

type AuthState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "user"; email: string; displayName: string; avatarUrl: string | null };

function formatDisplayName(fullName: string | null | undefined, email: string) {
  const normalizedName = fullName?.trim();

  if (normalizedName) {
    return normalizedName;
  }

  const localPart = email.split("@")[0]?.trim() ?? "";
  if (!localPart) {
    return "Кабінет";
  }

  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

function getInitials(value: string) {
  const normalized = value.replace(/[^a-zA-Zа-яА-ЯіїєІЇЄҐґ0-9]+/g, " ").trim();
  const parts = normalized.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return (parts[0] ?? normalized.slice(0, 2) ?? "DC").slice(0, 2).toUpperCase();
}

function getShortProfileLabel(displayName: string, email: string) {
  const normalized = displayName.trim();
  if (normalized) {
    return normalized;
  }

  return email.split("@")[0]?.trim() ?? email;
}

function ProfileAvatar({ label, avatarUrl }: { label: string; avatarUrl: string | null }) {
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[rgba(238,242,255,0.92)] text-sm font-semibold text-[var(--accent-strong)]">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={label} className="h-full w-full object-cover" />
      ) : (
        getInitials(label)
      )}
    </span>
  );
}

function CabinetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="account-menu-icon" fill="none" aria-hidden="true">
      <path d="M4 11.5L12 5l8 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 10.5V19h11V10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 19v-4.5h4V19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="account-menu-icon" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 19c1.7-3.4 4.2-5.1 7-5.1s5.3 1.7 7 5.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BillingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="account-menu-icon" fill="none" aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.5 14.5h3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="account-menu-icon" fill="none" aria-hidden="true">
      <path d="M14 7l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 12h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

  useEffect(() => {
    let isMounted = true;

    const loadAuthState = async (sessionUser: { id: string; email?: string | null } | null | undefined) => {
      if (!isMounted) {
        return;
      }

      const email = sessionUser?.email?.trim();
      if (!sessionUser?.id || !email) {
        setAuthState({ status: "guest" });
        return;
      }

      let fullName: string | null = null;
      let avatarUrl: string | null = null;

      try {
        const { data } = await supabase.from("profiles").select("*").eq("id", sessionUser.id).maybeSingle();
        fullName = typeof data?.full_name === "string" && data.full_name.trim() !== "" ? data.full_name.trim() : null;
        avatarUrl = typeof data?.avatar_url === "string" && data.avatar_url.trim() !== "" ? data.avatar_url.trim() : null;
      } catch {
        fullName = null;
        avatarUrl = null;
      }

      if (!isMounted) {
        return;
      }

      setAuthState({
        status: "user",
        email,
        displayName: formatDisplayName(fullName, email),
        avatarUrl
      });
    };

    supabase.auth.getSession().then(({ data }) => {
      void loadAuthState(data.session?.user ?? null);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadAuthState(session?.user ?? null);
    });

    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      const detail = customEvent.detail;

      if (!isBroadcastProfilePayload(detail)) {
        return;
      }

      setAuthState((current) => {
        if (current.status !== "user") {
          return current;
        }

        return {
          ...current,
          displayName: formatDisplayName(detail.fullName, current.email),
          avatarUrl: detail.avatarUrl
        };
      });
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated as EventListener);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated as EventListener);
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
  const profileLabel = authState.status === "user" ? getShortProfileLabel(authState.displayName, authState.email) : null;

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

  return (
    <header className="sticky top-0 z-50">
      <div className="w-full">
        <nav style={headerStyle} className="mirror-header relative w-full overflow-visible px-4 py-3 md:px-6 md:py-4 lg:px-8">
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
                <div className="hidden items-center md:flex">
                  <div className="group relative">
                    <button type="button" className="account-profile-pill" aria-haspopup="menu" aria-label="Відкрити меню акаунта">
                      <ProfileAvatar label={authState.displayName} avatarUrl={authState.avatarUrl} />
                      <span className="hidden min-w-0 lg:block">
                        <span className="block max-w-[10rem] truncate text-sm font-semibold text-[var(--text-strong)]">{profileLabel}</span>
                      </span>
                    </button>

                    <div className="pointer-events-none absolute right-0 top-full z-40 translate-y-1 pt-2 opacity-0 transition-all duration-150 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                      <div className="account-menu-panel min-w-[14rem] p-2">
                        <Link href="/dashboard" className="account-menu-link">
                          <CabinetIcon />
                          <span>Кабінет</span>
                        </Link>
                        <Link href="/dashboard?view=profile" className="account-menu-link">
                          <ProfileIcon />
                          <span>Профіль</span>
                        </Link>
                        <Link href="/dashboard?view=access" className="account-menu-link">
                          <BillingIcon />
                          <span>Оплата</span>
                        </Link>
                        <div className="account-menu-divider" />
                        <button type="button" onClick={handleSignOut} disabled={isSigningOut} className="account-menu-link account-menu-link-danger disabled:cursor-not-allowed disabled:opacity-60">
                          <LogoutIcon />
                          <span>{isSigningOut ? "Виходимо..." : "Вийти"}</span>
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
                  <a
                    href={simulateCtaHref}
                    className="hidden min-w-[11.2rem] items-center justify-start gap-3 rounded-full bg-[var(--accent-strong)] px-3 py-2.5 pr-4 text-[1.03rem] font-semibold text-white transition hover:-translate-y-px hover:bg-[var(--accent)] md:inline-flex"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--accent-strong)]">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none" aria-hidden="true">
                        <path d="M6 12h11M12 7l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span>Запустити аналіз</span>
                  </a>
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
                  <div className="mt-2 flex items-center gap-3 rounded-[1.5rem] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.78)] px-3 py-3">
                    <ProfileAvatar label={authState.displayName} avatarUrl={authState.avatarUrl} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[var(--text-strong)]">{profileLabel}</span>
                      <span className="block break-all text-xs text-[var(--text-soft)]">{authState.email}</span>
                    </span>
                  </div>

                  <div className="account-menu-panel mt-1 p-2">
                    <Link href="/dashboard" onClick={() => setIsOpen(false)} className="account-menu-link">
                      <CabinetIcon />
                      <span>Кабінет</span>
                    </Link>
                    <Link href="/dashboard?view=profile" onClick={() => setIsOpen(false)} className="account-menu-link">
                      <ProfileIcon />
                      <span>Профіль</span>
                    </Link>
                    <Link href="/dashboard?view=access" onClick={() => setIsOpen(false)} className="account-menu-link">
                      <BillingIcon />
                      <span>Оплата</span>
                    </Link>
                    <div className="account-menu-divider" />
                    <button type="button" onClick={handleSignOut} disabled={isSigningOut} className="account-menu-link account-menu-link-danger disabled:cursor-not-allowed disabled:opacity-60">
                      <LogoutIcon />
                      <span>{isSigningOut ? "Виходимо..." : "Вийти"}</span>
                    </button>
                  </div>
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
                  <a
                    href={simulateCtaHref}
                    onClick={() => setIsOpen(false)}
                    className="btn-primary"
                  >
                    Запустити аналіз
                  </a>
                </>
              )}
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
