import { CANONICAL_SITE_URL, getOriginFromUrl, getPublicSiteUrl } from "@/lib/site-url";
import { isLocalTestModeEnabled } from "@/lib/test-mode";

function readRequestOrigin(request: Request) {
  const origin = request.headers.get("origin")?.trim();
  if (origin) {
    return origin;
  }

  const referer = request.headers.get("referer")?.trim();
  if (!referer) {
    return null;
  }

  try {
    return getOriginFromUrl(referer);
  } catch {
    return null;
  }
}

function getAllowedOrigins() {
  const origins = new Set<string>([
    getOriginFromUrl(CANONICAL_SITE_URL),
    getOriginFromUrl(getPublicSiteUrl())
  ]);

  if (process.env.NODE_ENV !== "production" || isLocalTestModeEnabled()) {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }

  return origins;
}

function isAllowedLocalDevelopmentOrigin(origin: string) {
  if (process.env.NODE_ENV === "production" && !isLocalTestModeEnabled()) {
    return false;
  }

  try {
    const url = new URL(origin);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
  } catch {
    return false;
  }
}

export function isAllowedSameSiteRequest(request: Request) {
  const requestOrigin = readRequestOrigin(request);

  if (!requestOrigin) {
    return process.env.NODE_ENV !== "production" || isLocalTestModeEnabled();
  }

  let normalizedOrigin;
  try {
    normalizedOrigin = getOriginFromUrl(requestOrigin);
  } catch {
    return false;
  }

  if (isAllowedLocalDevelopmentOrigin(normalizedOrigin)) {
    return true;
  }

  return getAllowedOrigins().has(normalizedOrigin);
}
