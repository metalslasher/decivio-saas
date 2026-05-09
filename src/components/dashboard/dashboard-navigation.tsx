import Link from "next/link";
import { BrandBadge } from "@/components/brand-badge";
import { WordmarkLogo } from "@/components/wordmark-logo";
import { dashboardNavItems } from "./dashboard-config";
import { CloseIcon, CollapseIcon, CreditCardIcon, ExpandIcon, MenuIcon, UserIcon } from "./icons";
import { DashboardAvatar } from "./dashboard-primitives";
import type { DashboardView } from "./types";
import { getDashboardHref, getShortProfileLabel } from "./dashboard-utils";

export function DashboardAccountMenuContent({
  onSignOut,
  isSigningOut,
}: {
  onSignOut: () => void;
  isSigningOut: boolean;
}) {
  return (
    <>
      <Link href={getDashboardHref("profile")} className="account-menu-link">
        <span className="account-menu-icon">
          <UserIcon />
        </span>
        <span>Профіль</span>
      </Link>
      <Link href={getDashboardHref("access")} className="account-menu-link">
        <span className="account-menu-icon">
          <CreditCardIcon />
        </span>
        <span>Доступ</span>
      </Link>
      <div className="account-menu-divider" />
      <button
        type="button"
        onClick={onSignOut}
        disabled={isSigningOut}
        className="account-menu-link account-menu-link-danger disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg
          viewBox="0 0 24 24"
          className="account-menu-icon"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M14 7l5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 12h11"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        {isSigningOut ? "Виходимо..." : "Вийти"}
      </button>
    </>
  );
}

export function DashboardSidebarAccount({
  displayName,
  email,
  avatarUrl,
  accessLabel,
  isCompact,
  onSignOut,
  isSigningOut,
}: {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  accessLabel: string;
  isCompact: boolean;
  onSignOut: () => void;
  isSigningOut: boolean;
}) {
  const profileLabel = getShortProfileLabel(displayName, email);
  const menuPositionClass = isCompact
    ? "left-full bottom-0 pl-3"
    : "bottom-full left-0 right-0 pb-3";
  const panelWidthClass = isCompact ? "min-w-[15rem]" : "w-full min-w-[16rem]";

  return (
    <div className={`group relative ${isCompact ? "mx-auto" : ""}`}>
      <button
        type="button"
        className={`dashboard-profile-pill w-full ${isCompact ? "h-14 w-14 justify-center rounded-[1.35rem] p-0" : "justify-between px-3.5 py-3"}`}
        aria-haspopup="menu"
        aria-label="Відкрити меню акаунта"
        title={profileLabel}
      >
        <span
          className={`flex min-w-0 items-center ${isCompact ? "justify-center" : "gap-3"}`}
        >
          <DashboardAvatar
            label={displayName}
            avatarUrl={avatarUrl}
            sizeClassName={isCompact ? "h-10 w-10" : "h-11 w-11"}
            textClassName="text-sm font-semibold"
          />
          {!isCompact ? (
            <span className="min-w-0 text-left">
              <span className="block truncate text-sm font-semibold text-[var(--text-strong)]">
                {profileLabel}
              </span>
              <span className="mt-1 block truncate text-[0.78rem] leading-[1.4] text-[var(--text-soft)]">
                {accessLabel}
              </span>
            </span>
          ) : null}
        </span>

        {!isCompact ? (
          <span className="text-lg leading-none text-[var(--text-soft)]">
            ›
          </span>
        ) : null}
      </button>

      <div
        className={`pointer-events-none absolute z-40 opacity-0 transition-all duration-150 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 ${menuPositionClass}`}
      >
        <div className={`account-menu-panel p-2 ${panelWidthClass}`}>
          <DashboardAccountMenuContent
            onSignOut={onSignOut}
            isSigningOut={isSigningOut}
          />
        </div>
      </div>
    </div>
  );
}

export function DashboardSidebar({
  activeView,
  isCompact,
  canCompact,
  isMobileOpen,
  displayName,
  email,
  avatarUrl,
  accessLabel,
  onSignOut,
  isSigningOut,
  onToggleCollapsed,
  onCloseMobile,
}: {
  activeView: DashboardView;
  isCompact: boolean;
  canCompact: boolean;
  isMobileOpen: boolean;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  accessLabel: string;
  onSignOut: () => void;
  isSigningOut: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}) {
  const sidebarLinkWidth = isCompact
    ? "justify-center px-0 py-3"
    : "px-3.5 py-3";

  return (
    <>
      {isMobileOpen ? (
        <button
          type="button"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-[rgba(20,25,37,0.28)] backdrop-blur-sm lg:hidden"
          aria-label="Закрити навігацію"
        />
      ) : null}

      <aside
        className={`dashboard-sidebar-shell fixed inset-y-0 left-0 z-50 w-[17.25rem] transform transition-transform duration-300 md:w-[var(--cabinet-sidebar-width)] ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="dashboard-sidebar-panel flex h-full flex-col">
          <div
            className={`flex h-[var(--dashboard-header-height)] items-center border-b border-[rgba(24,26,32,0.08)] ${
              isCompact ? "justify-center px-0" : "justify-between px-4"
            }`}
          >
            <Link
              href="/dashboard"
              aria-label="Decivio"
              className={`min-w-0 ${isCompact ? "mx-auto" : ""}`}
            >
              {isCompact ? (
                <BrandBadge size="sidebar" />
              ) : (
                <WordmarkLogo className="text-[2.05rem]" />
              )}
            </Link>

            <div className="flex items-center">
              <button
                type="button"
                onClick={onCloseMobile}
                className="dashboard-icon-button lg:hidden"
                aria-label="Закрити навігацію"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          <div className="dashboard-sidebar-scrollarea flex-1 overflow-y-auto px-3 py-4">
            <nav className="space-y-1.5" aria-label="Навігація кабінету">
              {dashboardNavItems.map((item) => {
                const isActive = item.view === activeView;

                return (
                  <Link
                    key={item.view}
                    href={getDashboardHref(item.view)}
                    onClick={onCloseMobile}
                    title={isCompact ? item.label : undefined}
                    aria-label={item.label}
                    className={`group flex items-center gap-3 rounded-[1.25rem] border transition ${sidebarLinkWidth} ${
                      isActive
                        ? "border-[rgba(63,94,255,0.14)] bg-[rgba(238,242,255,0.95)] text-[var(--accent-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]"
                        : "border-transparent bg-transparent text-[var(--text-muted)] hover:border-[rgba(24,26,32,0.08)] hover:bg-[rgba(255,255,255,0.72)] hover:text-[var(--text-strong)]"
                    }`}
                  >
                    <span
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] border transition ${
                        isActive
                          ? "border-[rgba(63,94,255,0.12)] bg-white text-[var(--accent-strong)]"
                          : "border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.78)] text-[var(--text-soft)] group-hover:text-[var(--text-strong)]"
                      }`}
                    >
                      {item.icon}
                    </span>

                    {!isCompact ? (
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">
                          {item.label}
                        </span>
                        <span className="mt-1 block text-[0.82rem] leading-[1.5] text-inherit opacity-80">
                          {item.helper}
                        </span>
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hidden border-t border-[rgba(24,26,32,0.08)] p-3 lg:block">
            <DashboardSidebarAccount
              displayName={displayName}
              email={email}
              avatarUrl={avatarUrl}
              accessLabel={accessLabel}
              isCompact={isCompact}
              onSignOut={onSignOut}
              isSigningOut={isSigningOut}
            />
          </div>

          {canCompact ? (
            <div className="hidden border-t border-[rgba(24,26,32,0.08)] p-3 lg:block">
              <button
                type="button"
                onClick={onToggleCollapsed}
                className={`group flex w-full items-center gap-3 rounded-[1.35rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.76)] p-3 text-left text-[var(--text-muted)] transition hover:border-[rgba(63,94,255,0.14)] hover:bg-[rgba(255,255,255,0.9)] hover:text-[var(--text-strong)] ${
                  isCompact ? "justify-center" : ""
                }`}
                aria-label={isCompact ? "Розгорнути меню" : "Згорнути меню"}
                title={isCompact ? "Розгорнути меню" : "Згорнути меню"}
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] border border-[rgba(24,26,32,0.08)] bg-[rgba(255,255,255,0.86)] text-[var(--text-soft)] transition group-hover:text-[var(--accent-strong)]">
                  {isCompact ? <ExpandIcon /> : <CollapseIcon />}
                </span>

                {!isCompact ? (
                  <span className="min-w-0 text-sm font-semibold text-[var(--text-strong)]">
                    Згорнути
                  </span>
                ) : null}
              </button>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}

export function DashboardTopbar({
  displayName,
  email,
  avatarUrl,
  onOpenMobileSidebar,
  onSignOut,
  isSigningOut,
}: {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  onOpenMobileSidebar: () => void;
  onSignOut: () => void;
  isSigningOut: boolean;
}) {
  return (
    <header className="dashboard-topbar sticky top-0 z-30 lg:hidden">
      <div className="flex h-[var(--dashboard-header-height)] items-center gap-3 px-4 md:px-6 xl:px-8">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="dashboard-icon-button lg:hidden"
          aria-label="Відкрити навігацію"
        >
          <MenuIcon />
        </button>

        <Link
          href="/dashboard"
          className="inline-flex items-center lg:hidden"
          aria-label="Decivio"
        >
          <WordmarkLogo className="text-[2rem]" />
        </Link>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <div className="group relative">
            <button
              type="button"
              className="account-profile-pill"
              aria-haspopup="menu"
              aria-label="Відкрити меню акаунта"
            >
              <DashboardAvatar
                label={displayName}
                avatarUrl={avatarUrl}
                sizeClassName="h-9 w-9"
                textClassName="text-sm font-semibold"
              />
              <span className="hidden min-w-0 lg:block">
                <span className="block max-w-[10rem] truncate text-sm font-semibold text-[var(--text-strong)]">
                  {getShortProfileLabel(displayName, email)}
                </span>
              </span>
            </button>

            <div className="pointer-events-none absolute right-0 top-full z-40 translate-y-1 pt-2 opacity-0 transition-all duration-150 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <div className="account-menu-panel min-w-[14rem] p-2">
                <DashboardAccountMenuContent onSignOut={onSignOut} isSigningOut={isSigningOut} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
