import { NextResponse } from "next/server";
import { syncCheckoutFromMonoSubscriptionStatus } from "@/lib/billing-store";
import { getSupabaseServiceRoleClient } from "@/lib/db/supabase";
import {
  extractMonoSubscriptionId,
  getMonoSubscriptionStatus,
  verifyMonoWebhookSignature
} from "@/lib/mono-acquiring";

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

  const subscriptionId = extractMonoSubscriptionId(payload);
  if (!subscriptionId) {
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
  }

  const supabase = getSupabaseServiceRoleClient();
  const subscriptionStatus = await getMonoSubscriptionStatus(subscriptionId);
  await syncCheckoutFromMonoSubscriptionStatus(supabase, subscriptionStatus, {
    source: "webhook_charge",
    signature,
    payload
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
