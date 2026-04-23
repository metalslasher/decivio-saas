import "server-only";

import { createClient } from "@supabase/supabase-js";

function getMissingEnvVars(variableNames: string[]) {
  return variableNames.filter((name) => {
    const value = process.env[name];
    return typeof value !== "string" || value.trim() === "";
  });
}

export function getSupabaseUserServerClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing = getMissingEnvVars([
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ]);

  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }

  if (!url || !anonKey) {
    throw new Error("Unexpected env resolution error for server Supabase client.");
  }

  if (!accessToken.trim()) {
    throw new Error("Missing access token for scoped Supabase client.");
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });
}
