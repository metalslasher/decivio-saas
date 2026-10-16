import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { GUEST_USER_COOKIE_NAME } from "@/lib/guest-session";
import { applyManualFullAccess } from "@/lib/manual-full-access";
import { emitProfileUpdated } from "@/lib/profile-broadcast";
import { mergeProfileContext, parseProfileContext } from "@/lib/profile-context";
import type {
  DashboardState,
  DashboardUserProfile,
  ProfileRow,
  SimulationResultRow,
  SimulationRow,
  SubscriptionRow,
} from "./types";
import {
  buildProfileCompletion,
  buildProfileContextSeed,
  extractSimulationSnapshot,
  formatDisplayName,
  isValidGuestSessionId,
  readCookie,
} from "./dashboard-utils";

export function useDashboardData(supabase: SupabaseClient) {
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      if (!isMounted) {
        return;
      }

      setState({ status: "loading" });

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (sessionError) {
        setState({
          status: "error",
          message: "Не вдалося перевірити сесію. Спробуйте увійти ще раз.",
        });
        return;
      }

      if (!session?.user) {
        setState({ status: "guest" });
        return;
      }

      const userId = session.user.id;
      const rawGuestSessionId = readCookie(GUEST_USER_COOKIE_NAME);
      const guestSessionId = isValidGuestSessionId(rawGuestSessionId)
        ? rawGuestSessionId
        : null;

      let simulationsCountQuery = supabase
        .from("simulations")
        .select("id", { count: "exact", head: true });
      let simulationsListQuery = supabase
        .from("simulations")
        .select("id, created_at, status, inputs")
        .order("created_at", { ascending: false })
        .limit(8);

      if (guestSessionId) {
        simulationsCountQuery = simulationsCountQuery.or(
          `user_id.eq.${userId},guest_session_id.eq.${guestSessionId}`,
        );
        simulationsListQuery = simulationsListQuery.or(
          `user_id.eq.${userId},guest_session_id.eq.${guestSessionId}`,
        );
      } else {
        simulationsCountQuery = simulationsCountQuery.eq("user_id", userId);
        simulationsListQuery = simulationsListQuery.eq("user_id", userId);
      }

      const [
        profileResponse,
        subscriptionResponse,
        countResponse,
        simulationsResponse,
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase
          .from("subscriptions")
          .select("status, plan, current_period_end")
          .eq("user_id", userId)
          .maybeSingle(),
        simulationsCountQuery,
        simulationsListQuery,
      ]);

      if (!isMounted) {
        return;
      }

      if (
        profileResponse.error ||
        countResponse.error ||
        simulationsResponse.error ||
        subscriptionResponse.error
      ) {
        setState({
          status: "error",
          message:
            "Не вдалося завантажити дані кабінету. Перевірте підключення і спробуйте ще раз.",
        });
        return;
      }

      const simulations = (simulationsResponse.data ?? []) as SimulationRow[];
      const simulationIds = simulations.map((item) => item.id);

      let resultMap = new Map<string, SimulationResultRow>();
      if (simulationIds.length > 0) {
        const { data: results, error: resultsError } = await supabase
          .from("simulation_results")
          .select("simulation_id, summary_metrics")
          .in("simulation_id", simulationIds);

        if (!resultsError) {
          resultMap = new Map(
            (results as SimulationResultRow[]).map((item) => [
              item.simulation_id,
              item,
            ]),
          );
        }
      }

      const profile = (profileResponse.data ?? null) as ProfileRow | null;
      const subscriptionRow = (subscriptionResponse.data ??
        null) as SubscriptionRow | null;
      const email =
        session.user.email?.trim() ||
        profile?.email?.trim() ||
        "account@decivio.local";
      const recentSimulations = simulations.map((item) =>
        extractSimulationSnapshot(item, resultMap.get(item.id) ?? null),
      );
      const profileContext = mergeProfileContext(
        parseProfileContext(profile?.profile_context),
        buildProfileContextSeed(recentSimulations[0] ?? null),
      );
      const profileCompletion = buildProfileCompletion(
        profile?.full_name?.trim() ?? null,
        profile?.avatar_url?.trim() ?? null,
        profileContext,
      );
      const derivedPlan = subscriptionRow?.plan === "pro" ? "pro" : "free";
      const derivedStatus =
        subscriptionRow?.status === "active" ||
        subscriptionRow?.status === "trial" ||
        subscriptionRow?.status === "canceled" ||
        subscriptionRow?.status === "past_due"
          ? subscriptionRow.status
          : "free";
      const subscription = applyManualFullAccess(email, {
        plan: derivedPlan,
        status: derivedStatus,
        currentPeriodEnd: subscriptionRow?.current_period_end ?? null,
      });

      setState({
        status: "ready",
        user: {
          id: userId,
          email,
          displayName: formatDisplayName(profile?.full_name, email),
        },
        profile: {
          fullName: profile?.full_name?.trim() ?? null,
          timezone: profile?.timezone?.trim() ?? null,
          avatarUrl: profile?.avatar_url?.trim() ?? null,
          context: profileContext,
          completion: profileCompletion,
        },
        subscription,
        totalSimulations: countResponse.count ?? simulations.length,
        recentSimulations,
      });
    };

    void loadDashboard();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadDashboard();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleProfileSaved = useCallback((profile: DashboardUserProfile) => {
    emitProfileUpdated({
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
    });

    setState((current) => {
      if (current.status !== "ready") {
        return current;
      }

      return {
        ...current,
        user: {
          ...current.user,
          displayName: formatDisplayName(profile.fullName, current.user.email),
        },
        profile,
      };
    });
  }, []);

  return { state, handleProfileSaved };
}
