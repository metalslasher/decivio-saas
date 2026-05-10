import { NextResponse } from "next/server";
import { syncCheckoutFromMonoInvoiceStatus } from "@/lib/billing-store";
import { BillingSecurityError } from "@/lib/billing-security";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { isMonoInvoiceStatusPayload, verifyMonoWebhookSignature } from "@/lib/mono-acquiring";

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
    console.error("Mono invoice webhook signature verification failed.", error);
    return webhookError(500);
  }

  if (!isValidSignature) {
    console.warn("Rejected mono invoice webhook with invalid signature.");
    return webhookError(401);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString("utf8")) as unknown;
  } catch {
    return webhookError(400);
  }

  if (!isMonoInvoiceStatusPayload(payload)) {
    return webhookError(400);
  }

  try {
    const supabase = getSupabaseServiceRoleClient();
    const checkout = await syncCheckoutFromMonoInvoiceStatus(supabase, payload, {
      source: "webhook",
      signature,
      payload
    });

    if (!checkout) {
      console.warn("Ignored mono invoice webhook for unknown checkout.", { invoiceId: payload.invoiceId });
      return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
    }
  } catch (error) {
    if (error instanceof BillingSecurityError) {
      console.warn("Rejected mono invoice webhook because payment details did not match checkout.", {
        reason: error.message,
        invoiceId: payload.invoiceId
      });
      return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
    }

    console.error("Mono invoice webhook processing failed.", error);
    return webhookError(500);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
