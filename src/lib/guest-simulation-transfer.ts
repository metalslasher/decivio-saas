import type { SupabaseClient } from "@supabase/supabase-js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type GuestSimulationClaimResult = {
  claimedSimulationCount: number;
  claimedResultCount: number;
};

function isUuid(value: string | null): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

export async function claimGuestSimulationsForUser(
  supabase: SupabaseClient,
  userId: string,
  guestSessionId: string | null
): Promise<GuestSimulationClaimResult> {
  if (!isUuid(guestSessionId)) {
    return {
      claimedSimulationCount: 0,
      claimedResultCount: 0
    };
  }

  const { data: updatedSimulations, error: simulationsError } = await supabase
    .from("simulations")
    .update({
      user_id: userId,
      guest_session_id: null
    })
    .eq("guest_session_id", guestSessionId)
    .is("user_id", null)
    .select("id");

  if (simulationsError) {
    throw new Error(`Не вдалося закріпити сценарії за акаунтом: ${simulationsError.message}`);
  }

  const { data: updatedResults, error: resultsError } = await supabase
    .from("simulation_results")
    .update({
      user_id: userId,
      guest_session_id: null
    })
    .eq("guest_session_id", guestSessionId)
    .is("user_id", null)
    .select("id");

  if (resultsError) {
    throw new Error(`Не вдалося закріпити результати сценаріїв за акаунтом: ${resultsError.message}`);
  }

  return {
    claimedSimulationCount: updatedSimulations?.length ?? 0,
    claimedResultCount: updatedResults?.length ?? 0
  };
}
