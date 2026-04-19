export const PROFILE_UPDATED_EVENT = "decivio-profile-updated";

export type BroadcastProfilePayload = {
  fullName: string | null;
  avatarUrl: string | null;
};

export function emitProfileUpdated(payload: BroadcastProfilePayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<BroadcastProfilePayload>(PROFILE_UPDATED_EVENT, {
      detail: payload
    })
  );
}

export function isBroadcastProfilePayload(value: unknown): value is BroadcastProfilePayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  const hasValidFullName = payload.fullName === null || typeof payload.fullName === "string";
  const hasValidAvatar = payload.avatarUrl === null || typeof payload.avatarUrl === "string";

  return hasValidFullName && hasValidAvatar;
}
