export type AccessSubscriptionSnapshot = {
  plan: "free" | "pro";
  status: "free" | "trial" | "active" | "canceled" | "past_due";
  currentPeriodEnd: string | null;
};

const MANUAL_FULL_ACCESS_EMAILS = new Set(["t0mmy.v4sk1s@gmail.com"]);

function normalizeAccessEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function hasManualFullAccess(email: string | null | undefined) {
  return MANUAL_FULL_ACCESS_EMAILS.has(normalizeAccessEmail(email));
}

export function applyManualFullAccess<TSubscription extends AccessSubscriptionSnapshot>(
  email: string | null | undefined,
  subscription: TSubscription,
): TSubscription {
  if (!hasManualFullAccess(email)) {
    return subscription;
  }

  return {
    ...subscription,
    plan: "pro",
    status: "active",
    currentPeriodEnd: null,
  };
}
