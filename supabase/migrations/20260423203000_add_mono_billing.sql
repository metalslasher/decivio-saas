with ranked_subscriptions as (
  select
    id,
    row_number() over (
      partition by user_id
      order by coalesce(updated_at, created_at) desc, created_at desc, id desc
    ) as rn
  from public.subscriptions
)
delete from public.subscriptions
where id in (
  select id
  from ranked_subscriptions
  where rn > 1
);

create unique index if not exists subscriptions_user_id_uidx
  on public.subscriptions (user_id);

alter table public.subscriptions
  add column if not exists provider text,
  add column if not exists mono_invoice_id text,
  add column if not exists mono_subscription_id text,
  add column if not exists activated_at timestamptz;

create unique index if not exists subscriptions_mono_invoice_id_uidx
  on public.subscriptions (mono_invoice_id)
  where mono_invoice_id is not null;

create unique index if not exists subscriptions_mono_subscription_id_uidx
  on public.subscriptions (mono_subscription_id)
  where mono_subscription_id is not null;

create table if not exists public.billing_checkouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('mono')),
  plan_id text not null check (plan_id in ('monthly', 'annual')),
  billing_kind text not null check (billing_kind in ('subscription', 'one_time')),
  status text not null check (
    status in ('pending', 'processing', 'paid', 'active', 'failed', 'canceled', 'expired', 'reversed')
  ),
  amount integer not null check (amount > 0),
  ccy integer not null default 980,
  mono_invoice_id text,
  mono_subscription_id text,
  mono_page_url text,
  redirect_url text,
  last_event_at timestamptz,
  last_event_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_checkouts_single_mono_target check (
    (mono_invoice_id is null and mono_subscription_id is null)
    or (mono_invoice_id is not null and mono_subscription_id is null)
    or (mono_invoice_id is null and mono_subscription_id is not null)
  )
);

create unique index if not exists billing_checkouts_mono_invoice_id_uidx
  on public.billing_checkouts (mono_invoice_id)
  where mono_invoice_id is not null;

create unique index if not exists billing_checkouts_mono_subscription_id_uidx
  on public.billing_checkouts (mono_subscription_id)
  where mono_subscription_id is not null;

create index if not exists billing_checkouts_user_id_idx
  on public.billing_checkouts (user_id, created_at desc);

create index if not exists billing_checkouts_status_idx
  on public.billing_checkouts (status);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  checkout_id uuid references public.billing_checkouts(id) on delete set null,
  provider text not null check (provider in ('mono')),
  event_type text not null,
  external_id text,
  status text,
  event_time timestamptz,
  signature text,
  dedupe_key text not null unique,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists billing_events_user_id_idx
  on public.billing_events (user_id, created_at desc);

create index if not exists billing_events_checkout_id_idx
  on public.billing_events (checkout_id);

drop trigger if exists set_billing_checkouts_updated_at on public.billing_checkouts;
create trigger set_billing_checkouts_updated_at
before update on public.billing_checkouts
for each row
execute function public.set_updated_at();

alter table public.billing_checkouts enable row level security;
alter table public.billing_events enable row level security;

create policy billing_checkouts_select_own
  on public.billing_checkouts
  for select
  using (auth.uid() = user_id);

create policy billing_events_select_own
  on public.billing_events
  for select
  using (auth.uid() = user_id);
