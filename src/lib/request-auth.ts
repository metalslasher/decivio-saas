import type { SupabaseClient } from "@supabase/supabase-js";

function getBearerToken(request: Request) {
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

export async function getAuthenticatedUserIdFromRequest(supabase: SupabaseClient, request: Request) {
  const accessToken = getBearerToken(request);

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

  return user.id;
}
