import { NextResponse } from "next/server";
import { syncCheckoutFromMonoSubscriptionStatus } from "@/lib/billing-store";
import { BillingSecurityError } from "@/lib/billing-security";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import {
  getMonoSubscriptionStatus,
  isMonoSubscriptionStatusWebhookPayload,
  verifyMonoWebhookSignature
} from "@/lib/mono-acquiring";

const genericWebhookError = { ok: false };

function webhookError(status: number) {
  return NextResponse.json(genericWebhookError, { status });
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-sign")?.trim();
  if (!signature) {
    return webhookError(400);
  }

  const rawBody = Buffer.from(await request.arrayBuffer());
  let isValidSignature;
  try {
    isValidSignature = await verifyMonoWebhookSignature(rawBody, signature);
  } catch (error) {
    console.error("Mono subscription status webhook signature verification failed.", error);
    return webhookError(500);
  }

  if (!isValidSignature) {
    console.warn("Rejected mono subscription status webhook with invalid signature.");
    return webhookError(401);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString("utf8")) as unknown;
  } catch {
    return webhookError(400);
  }

  if (!isMonoSubscriptionStatusWebhookPayload(payload)) {
    return webhookError(400);
  }

  try {
    const supabase = getSupabaseServiceRoleClient();
    const subscriptionStatus = await getMonoSubscriptionStatus(payload.subscriptionId);
    const checkout = await syncCheckoutFromMonoSubscriptionStatus(supabase, subscriptionStatus, {
      source: "webhook_status",
      signature,
      payload
    });

    if (!checkout) {
      console.warn("Ignored mono subscription status webhook for unknown checkout.", {
        subscriptionId: payload.subscriptionId
      });
      return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
    }
  } catch (error) {
    if (error instanceof BillingSecurityError) {
      console.warn("Rejected mono subscription webhook because payment details did not match checkout.", {
        reason: error.message,
        subscriptionId: payload.subscriptionId
      });
      return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
    }

    console.error("Mono subscription status webhook processing failed.", error);
    return webhookError(500);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
