import "server-only";

import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedUserFromRequest } from "@/lib/request-auth";
import { consumeRateLimit } from "@/lib/request-rate-limit";

export async function readJsonBody(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function requireUser(supabase: SupabaseClient, request: Request) {
  try {
    return await getAuthenticatedUserFromRequest(supabase, request);
  } catch {
    return null;
  }
}

export async function enforceRateLimit(
  supabase: SupabaseClient,
  request: Request,
  route: string,
  limit: number,
  windowSeconds: number,
) {
  const result = await consumeRateLimit(supabase, {
    route,
    subjectHint: route,
    headers: request.headers,
    limit,
    windowSeconds,
  });

  return result.allowed
    ? null
    : jsonError(`Забагато запитів. Спробуйте через ${Math.ceil(result.retryAfterSeconds / 60)} хв.`, 429);
}

export function readOptionalString(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().slice(0, maxLength);
  return trimmed === "" ? null : trimmed;
}
