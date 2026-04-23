import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type RateLimitRow = {
  allowed: boolean;
  remaining: number;
  retry_after_seconds: number;
};

const IP_HEADER_CANDIDATES = [
  "x-forwarded-for",
  "x-vercel-forwarded-for",
  "cf-connecting-ip",
  "x-real-ip"
] as const;

function readClientIpFromHeader(headers: Headers, headerName: (typeof IP_HEADER_CANDIDATES)[number]) {
  const headerValue = headers.get(headerName);
  if (!headerValue) {
    return null;
  }

  const [firstIp] = headerValue.split(",");
  return firstIp?.trim() || null;
}

function getRequestIp(headers: Headers) {
  for (const headerName of IP_HEADER_CANDIDATES) {
    const clientIp = readClientIpFromHeader(headers, headerName);
    if (clientIp) {
      return clientIp;
    }
  }

  return "unknown";
}

function createRateLimitKey(route: string, subjectHint: string, headers: Headers) {
  const fingerprint = [route, subjectHint, getRequestIp(headers), headers.get("user-agent") ?? "unknown"].join("|");
  return createHash("sha256").update(fingerprint).digest("hex");
}

export async function consumeRateLimit(
  supabase: SupabaseClient,
  {
    route,
    subjectHint,
    headers,
    limit,
    windowSeconds
  }: {
    route: string;
    subjectHint: string;
    headers: Headers;
    limit: number;
    windowSeconds: number;
  }
): Promise<RateLimitResult> {
  const key = createRateLimitKey(route, subjectHint, headers);
  const { data, error } = await supabase
    .rpc("consume_rate_limit", {
      p_key: key,
      p_route: route,
      p_limit: limit,
      p_window_seconds: windowSeconds
    })
    .single();

  if (error) {
    throw new Error(`Не вдалося застосувати обмеження запитів: ${error.message}`);
  }

  const row = data as RateLimitRow | null;
  if (!row) {
    throw new Error("Не вдалося отримати результат перевірки обмеження запитів.");
  }

  return {
    allowed: row.allowed,
    remaining: row.remaining,
    retryAfterSeconds: row.retry_after_seconds
  };
}
