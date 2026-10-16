import type { PaidPlanId } from "@/lib/pricing";

export const MONO_PROVIDER = "mono" as const;
export const MONO_CCY_UAH = 980;

export type BillingKind = "subscription" | "one_time";
export type BillingCheckoutStatus =
  | "pending"
  | "processing"
  | "paid"
  | "active"
  | "failed"
  | "canceled"
  | "expired"
  | "reversed";

type BillingPlanConfig = {
  planId: PaidPlanId;
  amount: number;
  billingKind: BillingKind;
  monoInterval: string | null;
  destination: string;
  successLabel: string;
};

const BILLING_PLAN_CONFIG: Record<PaidPlanId, BillingPlanConfig> = {
  monthly: {
    planId: "monthly",
    amount: 89900,
    billingKind: "subscription",
    monoInterval: "1m",
    destination: "Decivio Pro monthly subscription",
    successLabel: "Підписка Decivio Pro активована."
  },
  annual: {
    planId: "annual",
    amount: 219900,
    billingKind: "one_time",
    monoInterval: null,
    destination: "Decivio 90-day Career Upgrade access",
    successLabel: "90-денний доступ Decivio активовано."
  }
};

export function isPaidPlanId(value: unknown): value is PaidPlanId {
  return value === "monthly" || value === "annual";
}

export function getBillingPlanConfig(planId: PaidPlanId) {
  return BILLING_PLAN_CONFIG[planId];
}

export function mapMonoInvoiceStatusToCheckoutStatus(status: string): BillingCheckoutStatus {
  switch (status) {
    case "processing":
    case "hold":
      return "processing";
    case "success":
      return "paid";
    case "failure":
      return "failed";
    case "reversed":
      return "reversed";
    case "expired":
      return "expired";
    case "created":
    default:
      return "pending";
  }
}

export function mapMonoSubscriptionStatusToCheckoutStatus(status: string): BillingCheckoutStatus {
  switch (status) {
    case "active":
      return "active";
    case "cancelled":
      return "canceled";
    default:
      return "pending";
  }
}

export function isAccessGrantedForCheckoutStatus(status: BillingCheckoutStatus) {
  return status === "paid" || status === "active";
}

export function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

export function addYears(date: Date, years: number) {
  const result = new Date(date);
  result.setUTCFullYear(result.getUTCFullYear() + years);
  return result;
}

export function resolveOneTimeAccessEndsAt(sourceIso: string | null | undefined) {
  const sourceDate = sourceIso ? new Date(sourceIso) : new Date();
  return addMonths(sourceDate, 3).toISOString();
}

export function resolveMonthlyAccessEndsAt(nextChargeDate: string | null | undefined, startDate: string | null | undefined) {
  if (nextChargeDate) {
    return nextChargeDate;
  }

  const sourceDate = startDate ? new Date(startDate) : new Date();
  return addMonths(sourceDate, 1).toISOString();
}
