drop policy if exists billing_checkouts_select_own
  on public.billing_checkouts;

drop policy if exists billing_events_select_own
  on public.billing_events;

comment on table public.billing_checkouts is
  'Server-managed mono checkout attempts. Read/write access goes through backend payment APIs.';

comment on table public.billing_events is
  'Server-managed mono webhook and polling audit log. Not exposed to browser clients.';
