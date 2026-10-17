"use client";

/**
 * Funnel events pushed to Google Tag Manager (container loaded in `src/app/layout.tsx`).
 * In GTM create a Custom Event trigger per name below and forward it to GA4.
 * Never put personal data (names, phones, emails, vacancy texts) into params.
 */
export type AnalyticsEvent =
  | "vacancy_draft_requested"
  | "vacancy_draft_generated"
  | "vacancy_draft_failed"
  | "vacancy_publish_clicked"
  | "vacancy_published"
  | "vacancy_limit_hit"
  | "posting_text_copied"
  | "apply_link_copied"
  | "poster_printed"
  | "apply_started"
  | "apply_submitted"
  | "candidates_rescreened"
  | "subscription_canceled";

type DataLayerWindow = Window & { dataLayer?: Array<Record<string, unknown>> };

export function trackEvent(event: AnalyticsEvent, params: Record<string, string | number | boolean | null> = {}) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const target = window as DataLayerWindow;
    target.dataLayer = target.dataLayer ?? [];
    target.dataLayer.push({ event, ...params });
  } catch {
    // Analytics must never break the product.
  }
}
