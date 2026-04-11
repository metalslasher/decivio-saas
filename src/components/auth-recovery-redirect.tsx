"use client";

import { useEffect } from "react";

function hasSupabaseAuthParams(searchParams: URLSearchParams, hashParams: URLSearchParams) {
  return (
    hashParams.has("access_token") ||
    hashParams.has("refresh_token") ||
    hashParams.has("error") ||
    hashParams.has("error_description") ||
    searchParams.has("code") ||
    searchParams.has("token_hash") ||
    searchParams.has("error") ||
    searchParams.has("error_description")
  );
}

export function AuthRecoveryRedirect() {
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const searchParams = currentUrl.searchParams;
    const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ""));

    if (currentUrl.pathname === "/auth/callback") {
      return;
    }

    if (!hasSupabaseAuthParams(searchParams, hashParams)) {
      return;
    }

    const callbackUrl = new URL("/auth/callback", currentUrl.origin);

    ["code", "token_hash", "type", "error", "error_code", "error_description", "next"].forEach((key) => {
      const value = searchParams.get(key);
      if (value) {
        callbackUrl.searchParams.set(key, value);
      }
    });

    if (!callbackUrl.searchParams.has("next") && currentUrl.pathname !== "/") {
      callbackUrl.searchParams.set("next", currentUrl.pathname);
    }

    callbackUrl.hash = currentUrl.hash;
    window.location.replace(callbackUrl.toString());
  }, []);

  return null;
}
