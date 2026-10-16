"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthDialog } from "@/components/auth-dialog-provider";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import { DashboardAccess } from "./dashboard/dashboard-access";
import { DashboardAccessRequired, DashboardError, DashboardGuest } from "./dashboard/dashboard-gates";
import { DashboardLayout } from "./dashboard/dashboard-layout";
import { DashboardOverview } from "./dashboard/dashboard-overview";
import { DashboardProfileWorkspace } from "./dashboard/dashboard-profile-workspace";
import { DashboardScenarioWorkspace } from "./dashboard/dashboard-scenario-workspace";
import { DashboardSkeleton } from "./dashboard/dashboard-primitives";
import { DashboardVacancyFitWorkspace } from "./dashboard/dashboard-vacancy-fit-workspace";
import { useDashboardData } from "./dashboard/use-dashboard-data";
import {
  getDashboardView,
  hasPaidDashboardAccess,
  mapAccessLabel,
} from "./dashboard/dashboard-utils";

export function DashboardShell({
  requestedView,
}: {
  requestedView?: string | null;
}) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { openAuthDialog } = useAuthDialog();
  const { state, handleProfileSaved } = useDashboardData(supabase);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isPhoneViewport, setIsPhoneViewport] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncViewportMode = () => {
      setIsPhoneViewport(window.innerWidth < 768);
    };

    syncViewportMode();
    window.addEventListener("resize", syncViewportMode);

    return () => {
      window.removeEventListener("resize", syncViewportMode);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedValue = window.localStorage.getItem(
      "decivio_dashboard_sidebar_collapsed",
    );
    if (savedValue === "true" || savedValue === "false") {
      setIsSidebarCollapsed(savedValue === "true");
      return;
    }

    setIsSidebarCollapsed(window.innerWidth < 1440);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      "decivio_dashboard_sidebar_collapsed",
      String(isSidebarCollapsed),
    );
  }, [isSidebarCollapsed]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [requestedView]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    setIsSigningOut(false);
  };

  if (state.status === "loading") {
    return <DashboardSkeleton />;
  }

  if (state.status === "guest") {
    return (
      <DashboardGuest
        onLogin={() => openAuthDialog("login", { nextPath: "/dashboard" })}
      />
    );
  }

  if (state.status === "error") {
    return <DashboardError message={state.message} />;
  }

  if (!hasPaidDashboardAccess(state.subscription)) {
    return (
      <DashboardAccessRequired
        email={state.user.email}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />
    );
  }

  const activeView = getDashboardView(requestedView ?? null);
  const accessLabel = mapAccessLabel(
    state.subscription.plan,
    state.subscription.status,
  );
  const lastSimulation = state.recentSimulations[0] ?? null;
  const canCompactSidebar = !isPhoneViewport;
  const isSidebarCompact = canCompactSidebar && isSidebarCollapsed;

  return (
    <DashboardLayout
      activeView={activeView}
      isSidebarCompact={isSidebarCompact}
      canCompactSidebar={canCompactSidebar}
      isMobileSidebarOpen={isMobileSidebarOpen}
      displayName={state.user.displayName}
      email={state.user.email}
      avatarUrl={state.profile.avatarUrl}
      accessLabel={accessLabel}
      isSigningOut={isSigningOut}
      onSignOut={handleSignOut}
      onToggleCollapsed={() => setIsSidebarCollapsed((current) => !current)}
      onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
      onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
    >
      {activeView === "overview" ? (
        <DashboardOverview
          totalSimulations={state.totalSimulations}
          profile={state.profile}
          subscription={state.subscription}
          recentSimulations={state.recentSimulations}
          lastSimulation={lastSimulation}
        />
      ) : null}

      {activeView === "market" ? (
        <DashboardScenarioWorkspace
          recentSimulations={state.recentSimulations}
        />
      ) : null}

      {activeView === "vacancies" ? (
        <DashboardVacancyFitWorkspace
          supabase={supabase}
          profile={state.profile}
          lastSimulation={lastSimulation}
        />
      ) : null}

      {activeView === "profile" ? (
        <DashboardProfileWorkspace
          supabase={supabase}
          userId={state.user.id}
          email={state.user.email}
          profile={state.profile}
          onProfileSaved={handleProfileSaved}
        />
      ) : null}

      {activeView === "access" ? (
        <DashboardAccess
          accessLabel={accessLabel}
          subscription={state.subscription}
          email={state.user.email}
          onSignOut={handleSignOut}
          isSigningOut={isSigningOut}
        />
      ) : null}
    </DashboardLayout>
  );
}
