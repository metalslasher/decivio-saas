"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { WordmarkLogo } from "@/components/wordmark-logo";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";

const publicNavItems = [
  { href: "/#how", label: "Як це працює" },
  { href: "/#roles", label: "Для кого" },
  { href: "/#pricing", label: "Тарифи" },
  { href: "/#faq", label: "Питання" }
];

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

  if (pathname?.startsWith("/auth/callback") || pathname?.startsWith("/apply")) {
    return null;
  }

  const effectiveHeaderProgress = Math.max(headerProgress, isOpen ? 1 : 0);
  const headerStyle = {
    "--mirror-progress": effectiveHeaderProgress,
    "--mirror-blur": `${Math.round(effectiveHeaderProgress * 26)}px`
  } as CSSProperties;
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
    openAuthDialog("login", { nextPath: "/hire" });
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
                        <Link href="/hire" className="account-menu-link">
                          <CabinetIcon />
                          <span>Мої вакансії</span>
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
                    className="header-login-button hidden items-center justify-center md:inline-flex"
                  >
                    Вхід
                  </button>
                  <Link
                    href="/hire/new"
                    className="header-cta-button hidden min-w-[11.25rem] items-center justify-center md:inline-flex"
                  >
                    Створити вакансію
                  </Link>
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
                    <Link href="/hire" onClick={() => setIsOpen(false)} className="account-menu-link">
                      <CabinetIcon />
                      <span>Мої вакансії</span>
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
                    className="header-login-button mt-1 flex w-full items-center justify-center"
                  >
                    Вхід
                  </button>
                  <Link
                    href="/hire/new"
                    onClick={() => setIsOpen(false)}
                    className="btn-primary"
                  >
                    Створити вакансію
                  </Link>
                </>
              )}
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
