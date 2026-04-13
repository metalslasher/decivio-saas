import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type GuestSessionResolution =
  | { kind: "guest_session"; id: string; isNew: boolean }
  | { kind: "legacy_guest_user"; id: string; isNew: false };

function isUuid(value: string | null): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

function isLegacyGuestEmail(value: string | null | undefined) {
  return typeof value === "string" && value.startsWith("guest+") && value.endsWith("@decivio.local");
}

export async function resolveGuestSessionIdentity(
  supabase: SupabaseClient,
  existingGuestId: string | null
): Promise<GuestSessionResolution> {
  if (isUuid(existingGuestId)) {
    const { data: guestSession, error: guestSessionError } = await supabase
      .from("guest_sessions")
      .select("id")
      .eq("id", existingGuestId)
      .maybeSingle();

    if (guestSessionError) {
      throw new Error(`Не вдалося перевірити guest session: ${guestSessionError.message}`);
    }

    if (guestSession?.id) {
      const { error: guestSessionUpdateError } = await supabase
        .from("guest_sessions")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", guestSession.id);

      if (guestSessionUpdateError) {
        throw new Error(`Не вдалося оновити guest session: ${guestSessionUpdateError.message}`);
      }

      return { kind: "guest_session", id: guestSession.id, isNew: false };
    }

    const { data: legacyProfile, error: legacyProfileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", existingGuestId)
      .maybeSingle();

    if (legacyProfileError) {
      throw new Error(`Не вдалося перевірити legacy guest profile: ${legacyProfileError.message}`);
    }

    if (legacyProfile?.id && isLegacyGuestEmail(legacyProfile.email)) {
      return { kind: "legacy_guest_user", id: legacyProfile.id, isNew: false };
    }
  }

  const nextGuestSessionId = isUuid(existingGuestId) ? existingGuestId : randomUUID();
  const { data: insertedGuestSession, error: guestSessionInsertError } = await supabase
    .from("guest_sessions")
    .insert({
      id: nextGuestSessionId,
      last_seen_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (guestSessionInsertError || !insertedGuestSession?.id) {
    throw new Error(`Не вдалося створити guest session: ${guestSessionInsertError?.message ?? "missing id"}`);
  }

  return { kind: "guest_session", id: insertedGuestSession.id, isNew: true };
}
