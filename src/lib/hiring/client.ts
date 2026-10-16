"use client";

import { getAccessTokenFromSupabase, buildAuthorizedHeaders } from "@/lib/auth-session-client";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import type { VacancyContent } from "@/lib/hiring/types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function getAccessToken() {
  return getAccessTokenFromSupabase(getSupabaseBrowserClient());
}

export async function apiRequest<T>(
  url: string,
  init: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const token = init.auth ? await getAccessToken() : null;
  if (init.auth && !token) {
    throw new ApiError("Потрібно увійти в акаунт.", 401);
  }

  const response = await fetch(url, {
    method: init.method ?? (init.body === undefined ? "GET" : "POST"),
    headers: buildAuthorizedHeaders(token, init.body === undefined ? {} : { "Content-Type": "application/json" }),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) {
    throw new ApiError(payload?.error ?? "Щось пішло не так. Спробуйте ще раз.", response.status);
  }

  return payload as T;
}

export type StoredDraft = {
  brief: string;
  city: string;
  pay: string;
  schedule: string;
  content: VacancyContent | null;
};

const DRAFT_KEY = "decivio:vacancy-draft";

export function loadDraft(): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as StoredDraft) : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: StoredDraft) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage can be unavailable (private mode); the draft just won't survive reloads.
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function buildApplyUrl(slug: string) {
  return `${window.location.origin}/apply/${slug}`;
}

export function withApplyLink(postingText: string, url: string) {
  return postingText.includes("[посилання]")
    ? postingText.split("[посилання]").join(url)
    : `${postingText}\n\n👉 Відгукнутися за 2 хвилини: ${url}`;
}

export async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function formatRelativeDate(iso: string) {
  const date = new Date(iso);
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return "щойно";
  if (diffMinutes < 60) return `${diffMinutes} хв тому`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} год тому`;
  return date.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
}
