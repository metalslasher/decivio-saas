import "server-only";

import { createPublicKey, createVerify, KeyObject } from "node:crypto";
import type { PaidPlanId } from "@/lib/pricing";

const DEFAULT_MONO_API_BASE_URL = "https://api.monobank.ua";

export type MonoInvoiceCreateResponse = {
  invoiceId: string;
  pageUrl: string;
};

export type MonoSubscriptionCreateResponse = {
  subscriptionId: string;
  pageUrl: string;
};

export type MonoInvoiceStatus = {
  invoiceId: string;
  status: "created" | "processing" | "hold" | "success" | "failure" | "reversed" | "expired";
  amount: number;
  ccy: number;
  finalAmount?: number;
  createdDate?: string;
  modifiedDate?: string;
  reference?: string;
  destination?: string;
  errCode?: string;
  failureReason?: string;
};

export type MonoSubscriptionStatus = {
  subscriptionId: string;
  status: "active" | "cancelled";
  startDate: string;
  endDate?: string;
  amount: number;
  ccy: number;
  interval: string;
  nextChargeDate?: string;
  cancellationDesc?: string;
  summary?: {
    totalPaid?: number;
    totalFailed?: number;
  };
};

type MonoRequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
};

let cachedMonoPublicKeyBase64: string | null = null;
let cachedMonoPublicKey: KeyObject | null = null;

function getMonoToken() {
  const token = process.env.MONO_ACQUIRING_TOKEN?.trim();
  if (!token) {
    throw new Error("Missing env var: MONO_ACQUIRING_TOKEN.");
  }

  return token;
}

function getMonoApiBaseUrl() {
  return (process.env.MONO_ACQUIRING_API_BASE_URL?.trim() || DEFAULT_MONO_API_BASE_URL).replace(/\/+$/, "");
}

export function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!siteUrl) {
    throw new Error("Missing env var: NEXT_PUBLIC_SITE_URL.");
  }

  return siteUrl.replace(/\/+$/, "");
}

export function buildAppUrl(pathname: string) {
  return new URL(pathname, `${getSiteUrl()}/`).toString();
}

export function buildMonoCheckoutReturnUrl(planId: PaidPlanId, checkoutId: string) {
  return buildAppUrl(`/checkout?plan=${planId}&checkout=${checkoutId}`);
}

export function buildMonoInvoiceWebhookUrl() {
  return buildAppUrl("/api/payments/mono/webhook/invoice");
}

export function buildMonoSubscriptionStatusWebhookUrl() {
  return buildAppUrl("/api/payments/mono/webhook/subscription/status");
}

export function buildMonoSubscriptionChargeWebhookUrl() {
  return buildAppUrl("/api/payments/mono/webhook/subscription/charge");
}

async function monoRequest<T>(pathname: string, options: MonoRequestOptions = {}) {
  const response = await fetch(`${getMonoApiBaseUrl()}${pathname}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Token": getMonoToken()
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store"
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`mono API ${options.method ?? "GET"} ${pathname} failed with ${response.status}: ${responseText}`);
  }

  return (await response.json()) as T;
}

export async function createMonoInvoice(input: {
  amount: number;
  reference: string;
  destination: string;
  redirectUrl: string;
}) {
  return monoRequest<MonoInvoiceCreateResponse>("/api/merchant/invoice/create", {
    method: "POST",
    body: {
      amount: input.amount,
      ccy: 980,
      redirectUrl: input.redirectUrl,
      webHookUrl: buildMonoInvoiceWebhookUrl(),
      merchantPaymInfo: {
        reference: input.reference,
        destination: input.destination,
        comment: input.destination
      }
    }
  });
}

export async function createMonoSubscription(input: {
  amount: number;
  interval: string;
  redirectUrl: string;
}) {
  return monoRequest<MonoSubscriptionCreateResponse>("/api/merchant/subscription/create", {
    method: "POST",
    body: {
      amount: input.amount,
      ccy: 980,
      redirectUrl: input.redirectUrl,
      interval: input.interval,
      webHookUrls: {
        chargeUrl: buildMonoSubscriptionChargeWebhookUrl(),
        statusUrl: buildMonoSubscriptionStatusWebhookUrl()
      }
    }
  });
}

export async function getMonoInvoiceStatus(invoiceId: string) {
  const encodedInvoiceId = encodeURIComponent(invoiceId);
  return monoRequest<MonoInvoiceStatus>(`/api/merchant/invoice/status?invoiceId=${encodedInvoiceId}`);
}

export async function getMonoSubscriptionStatus(subscriptionId: string) {
  const encodedSubscriptionId = encodeURIComponent(subscriptionId);
  return monoRequest<MonoSubscriptionStatus>(`/api/merchant/subscription/status?subscriptionId=${encodedSubscriptionId}`);
}

async function fetchMonoWebhookPublicKey() {
  const response = await monoRequest<{ key: string }>("/api/merchant/pubkey");
  const keyBase64 = response.key?.trim();

  if (!keyBase64) {
    throw new Error("mono webhook public key response is empty.");
  }

  cachedMonoPublicKeyBase64 = keyBase64;
  cachedMonoPublicKey = createPublicKey(Buffer.from(keyBase64, "base64").toString("utf8"));
  return cachedMonoPublicKey;
}

async function getMonoWebhookPublicKey(forceRefresh = false) {
  if (!forceRefresh && cachedMonoPublicKey) {
    return cachedMonoPublicKey;
  }

  return fetchMonoWebhookPublicKey();
}

function verifyMonoSignatureWithKey(body: Buffer, signatureBase64: string, key: KeyObject) {
  const signature = Buffer.from(signatureBase64, "base64");
  const verifier = createVerify("sha256");
  verifier.update(body);
  verifier.end();
  return verifier.verify(key, signature);
}

export async function verifyMonoWebhookSignature(body: Buffer, signatureBase64: string) {
  const signature = signatureBase64.trim();
  if (!signature) {
    return false;
  }

  const cachedKey = await getMonoWebhookPublicKey(false);
  if (verifyMonoSignatureWithKey(body, signature, cachedKey)) {
    return true;
  }

  const refreshedKey = await getMonoWebhookPublicKey(true);
  return verifyMonoSignatureWithKey(body, signature, refreshedKey);
}

export function isMonoInvoiceStatusPayload(payload: unknown): payload is MonoInvoiceStatus {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const maybePayload = payload as Record<string, unknown>;
  return typeof maybePayload.invoiceId === "string" && typeof maybePayload.status === "string";
}

export function isMonoSubscriptionStatusPayload(payload: unknown): payload is MonoSubscriptionStatus {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const maybePayload = payload as Record<string, unknown>;
  return (
    typeof maybePayload.subscriptionId === "string" &&
    (maybePayload.status === "active" || maybePayload.status === "cancelled")
  );
}

export function extractMonoSubscriptionId(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const maybePayload = payload as Record<string, unknown>;
  return typeof maybePayload.subscriptionId === "string" ? maybePayload.subscriptionId : null;
}
