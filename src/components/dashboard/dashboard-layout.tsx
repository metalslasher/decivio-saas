import type { CSSProperties, ReactNode } from "react";
import { DashboardSidebar, DashboardTopbar } from "./dashboard-navigation";
import type { DashboardView } from "./types";

type DashboardLayoutProps = {
  activeView: DashboardView;
  isSidebarCompact: boolean;
  canCompactSidebar: boolean;
  isMobileSidebarOpen: boolean;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  accessLabel: string;
  isSigningOut: boolean;
  onSignOut: () => void;
  onToggleCollapsed: () => void;
  onOpenMobileSidebar: () => void;
  onCloseMobileSidebar: () => void;
  children: ReactNode;
};

export function DashboardLayout({
  activeView,
  isSidebarCompact,
  canCompactSidebar,
  isMobileSidebarOpen,
  displayName,
  email,
  avatarUrl,
  accessLabel,
  isSigningOut,
  onSignOut,
  onToggleCollapsed,
  onOpenMobileSidebar,
  onCloseMobileSidebar,
  children,
}: DashboardLayoutProps) {
  const shellStyle = {
    "--cabinet-sidebar-width": isSidebarCompact ? "5.75rem" : "17.25rem",
    "--dashboard-header-height": "5.3rem",
  } as CSSProperties;

  return (
    <section
      className="dashboard-shell-screen dashboard-shell"
      style={shellStyle}
    >
      <DashboardSidebar
        activeView={activeView}
        isCompact={isSidebarCompact}
        canCompact={canCompactSidebar}
        isMobileOpen={isMobileSidebarOpen}
        displayName={displayName}
        email={email}
        avatarUrl={avatarUrl}
        accessLabel={accessLabel}
        onSignOut={onSignOut}
        isSigningOut={isSigningOut}
        onToggleCollapsed={onToggleCollapsed}
        onCloseMobile={onCloseMobileSidebar}
      />

      <div className="lg:pl-[var(--cabinet-sidebar-width)]">
        <DashboardTopbar
          displayName={displayName}
          email={email}
          avatarUrl={avatarUrl}
          onOpenMobileSidebar={onOpenMobileSidebar}
          onSignOut={onSignOut}
          isSigningOut={isSigningOut}
        />

        <div className="space-y-6 px-4 py-6 md:px-6 xl:px-8">
          {children}
        </div>
      </div>
    </section>
  );
}
