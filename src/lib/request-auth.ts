import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthenticatedRequestUser = {
  accessToken: string;
  userId: string;
};

export function getBearerTokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new Error("Некоректний формат Authorization header.");
  }

  return token;
}

export async function getAuthenticatedUserFromRequest(
  supabase: SupabaseClient,
  request: Request
): Promise<AuthenticatedRequestUser | null> {
  const accessToken = getBearerTokenFromRequest(request);

  if (!accessToken) {
    return null;
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    throw new Error(error?.message ?? "Не вдалося підтвердити авторизацію.");
  }

  return {
    accessToken,
    userId: user.id
  };
}

export async function getAuthenticatedUserIdFromRequest(supabase: SupabaseClient, request: Request) {
  const authenticatedUser = await getAuthenticatedUserFromRequest(supabase, request);
  return authenticatedUser?.userId ?? null;
}
