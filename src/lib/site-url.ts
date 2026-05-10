export const CANONICAL_SITE_URL = "https://www.decivio.net";

export function normalizeSiteUrl(value?: string | null) {
  const source = value?.trim() || CANONICAL_SITE_URL;
  const withProtocol = /^https?:\/\//i.test(source) ? source : `https://${source}`;

  return withProtocol.replace(/\/+$/, "");
}

export function getPublicSiteUrl() {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? CANONICAL_SITE_URL);
}

export function getOriginFromUrl(value: string) {
  return new URL(value).origin;
}
