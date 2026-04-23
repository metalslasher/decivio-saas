import "server-only";

import { createClient } from "@supabase/supabase-js";

function getMissingEnvVars(variableNames: string[]) {
  return variableNames.filter((name) => {
    const value = process.env[name];
    return typeof value !== "string" || value.trim() === "";
  });
}

export function getSupabaseServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing = getMissingEnvVars(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }

  if (!url || !serviceRoleKey) {
    throw new Error("Unexpected env resolution error for admin Supabase client.");
  }

  return createClient(url, serviceRoleKey);
}

export const getSupabaseAdminClient = getSupabaseServiceRoleClient;
