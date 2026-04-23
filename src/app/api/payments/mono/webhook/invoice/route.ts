import { NextResponse } from "next/server";
import { syncCheckoutFromMonoInvoiceStatus } from "@/lib/billing-store";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import { isMonoInvoiceStatusPayload, verifyMonoWebhookSignature } from "@/lib/mono-acquiring";

export async function POST(request: Request) {
  const signature = request.headers.get("x-sign")?.trim();
  if (!signature) {
    return NextResponse.json({ error: "Missing x-sign header." }, { status: 400 });
  }

  const rawBody = Buffer.from(await request.arrayBuffer());
  const isValidSignature = await verifyMonoWebhookSignature(rawBody, signature);
  if (!isValidSignature) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString("utf8")) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  if (!isMonoInvoiceStatusPayload(payload)) {
    return NextResponse.json({ error: "Unexpected mono invoice webhook payload." }, { status: 400 });
  }

  const supabase = getSupabaseServiceRoleClient();
  await syncCheckoutFromMonoInvoiceStatus(supabase, payload, {
    source: "webhook",
    signature,
    payload
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
