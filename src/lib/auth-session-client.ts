import type { SupabaseClient } from "@supabase/supabase-js";

export async function getAccessTokenFromSupabase(supabase: SupabaseClient) {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

export function buildAuthorizedHeaders(accessToken: string | null, headers: Record<string, string> = {}) {
  return accessToken ? { ...headers, Authorization: `Bearer ${accessToken}` } : headers;
}

export async function claimGuestSimulations(accessToken: string | null) {
  if (!accessToken) {
    return false;
  }

  try {
    const response = await fetch("/api/auth/claim-guest-simulations", {
      method: "POST",
      headers: buildAuthorizedHeaders(accessToken)
    });

    return response.ok;
  } catch {
    return false;
  }
}
