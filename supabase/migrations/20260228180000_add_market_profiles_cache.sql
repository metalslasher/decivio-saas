-- Cache for AI-generated labor market profiles (Ukraine focus)

create table if not exists public.market_profiles_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists market_profiles_cache_expires_at_idx
  on public.market_profiles_cache (expires_at);

alter table public.market_profiles_cache enable row level security;

-- Intentionally no user policies. Table is accessed only from backend
-- via service role key (service role bypasses RLS).
