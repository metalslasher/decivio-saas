import {
  MONO_CCY_UAH,
  type BillingKind,
  getBillingPlanConfig
} from "@/lib/billing";
import type { PaidPlanId } from "@/lib/pricing";

export class BillingSecurityError extends Error {
  code = "billing_security_mismatch";

  constructor(message: string) {
    super(message);
    this.name = "BillingSecurityError";
  }
}

type CheckoutSecuritySnapshot = {
  id: string;
  plan_id: PaidPlanId;
  billing_kind: BillingKind;
  amount: number;
  ccy: number;
  mono_invoice_id: string | null;
  mono_subscription_id: string | null;
};

export type InvoiceSecuritySnapshot = {
  invoiceId: string;
  status: string;
  amount: number;
  ccy: number;
  finalAmount?: number;
  reference?: string;
};

export type SubscriptionSecuritySnapshot = {
  subscriptionId: string;
  status: string;
  startDate?: string;
  amount: number;
  ccy: number;
  interval: string;
};

function isFiniteInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);
}

function isValidDateString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 && !Number.isNaN(new Date(value).getTime());
}

export function getInvoiceCheckoutMismatch(
  checkout: CheckoutSecuritySnapshot,
  invoice: InvoiceSecuritySnapshot
) {
  if (checkout.billing_kind !== "one_time") {
    return "invoice_kind_mismatch";
  }

  if (checkout.mono_invoice_id !== invoice.invoiceId) {
    return "invoice_id_mismatch";
  }

  if (!isFiniteInteger(invoice.amount) || invoice.amount !== checkout.amount) {
    return "invoice_amount_mismatch";
  }

  if (!isFiniteInteger(invoice.ccy) || invoice.ccy !== checkout.ccy || invoice.ccy !== MONO_CCY_UAH) {
    return "invoice_currency_mismatch";
  }

  if (invoice.reference && invoice.reference !== checkout.id) {
    return "invoice_reference_mismatch";
  }

  if (
    invoice.status === "success" &&
    invoice.finalAmount !== undefined &&
    (!isFiniteInteger(invoice.finalAmount) || invoice.finalAmount !== checkout.amount)
  ) {
    return "invoice_final_amount_mismatch";
  }

  return null;
}

export function getSubscriptionCheckoutMismatch(
  checkout: CheckoutSecuritySnapshot,
  subscription: SubscriptionSecuritySnapshot
) {
  if (checkout.billing_kind !== "subscription") {
    return "subscription_kind_mismatch";
  }

  if (checkout.mono_subscription_id !== subscription.subscriptionId) {
    return "subscription_id_mismatch";
  }

  if (!isFiniteInteger(subscription.amount) || subscription.amount !== checkout.amount) {
    return "subscription_amount_mismatch";
  }

  if (!isFiniteInteger(subscription.ccy) || subscription.ccy !== checkout.ccy || subscription.ccy !== MONO_CCY_UAH) {
    return "subscription_currency_mismatch";
  }

  const expectedInterval = getBillingPlanConfig(checkout.plan_id).monoInterval;
  if (expectedInterval && subscription.interval !== expectedInterval) {
    return "subscription_interval_mismatch";
  }

  if (subscription.status === "active" && !isValidDateString(subscription.startDate)) {
    return "subscription_start_date_invalid";
  }

  return null;
}

export function assertInvoiceCheckoutIsTrusted(
  checkout: CheckoutSecuritySnapshot,
  invoice: InvoiceSecuritySnapshot
) {
  const mismatch = getInvoiceCheckoutMismatch(checkout, invoice);
  if (mismatch) {
    throw new BillingSecurityError(mismatch);
  }
}

export function assertSubscriptionCheckoutIsTrusted(
  checkout: CheckoutSecuritySnapshot,
  subscription: SubscriptionSecuritySnapshot
) {
  const mismatch = getSubscriptionCheckoutMismatch(checkout, subscription);
  if (mismatch) {
    throw new BillingSecurityError(mismatch);
  }
}
