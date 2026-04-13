create table if not exists public.guest_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists guest_sessions_last_seen_at_idx
  on public.guest_sessions (last_seen_at);

alter table public.guest_sessions enable row level security;

drop trigger if exists set_guest_sessions_updated_at on public.guest_sessions;
create trigger set_guest_sessions_updated_at
before update on public.guest_sessions
for each row
execute function public.set_updated_at();

alter table if exists public.simulations
  add column if not exists guest_session_id uuid references public.guest_sessions(id) on delete cascade;

alter table if exists public.simulations
  alter column user_id drop not null;

alter table if exists public.simulations
  drop constraint if exists simulations_owner_check;

alter table if exists public.simulations
  add constraint simulations_owner_check
  check (num_nonnulls(user_id, guest_session_id) = 1);

create index if not exists simulations_guest_session_id_idx
  on public.simulations (guest_session_id);

alter table if exists public.simulation_results
  add column if not exists guest_session_id uuid references public.guest_sessions(id) on delete cascade;

alter table if exists public.simulation_results
  alter column user_id drop not null;

alter table if exists public.simulation_results
  drop constraint if exists simulation_results_simulation_user_fk;

alter table if exists public.simulation_results
  add constraint simulation_results_simulation_fk
  foreign key (simulation_id)
  references public.simulations(id)
  on delete cascade;

alter table if exists public.simulation_results
  drop constraint if exists simulation_results_owner_check;

alter table if exists public.simulation_results
  add constraint simulation_results_owner_check
  check (num_nonnulls(user_id, guest_session_id) = 1);

create index if not exists simulation_results_guest_session_id_idx
  on public.simulation_results (guest_session_id);

create table if not exists public.request_rate_limits (
  key text primary key,
  route text not null,
  hits integer not null check (hits > 0),
  window_started_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists request_rate_limits_updated_at_idx
  on public.request_rate_limits (updated_at);

alter table public.request_rate_limits enable row level security;

create or replace function public.consume_rate_limit(
  p_key text,
  p_route text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_hits integer;
  current_window_started_at timestamptz;
  current_time timestamptz := now();
  elapsed_seconds integer;
begin
  if p_limit <= 0 then
    raise exception 'p_limit must be > 0';
  end if;

  if p_window_seconds <= 0 then
    raise exception 'p_window_seconds must be > 0';
  end if;

  insert into public.request_rate_limits as rl (
    key,
    route,
    hits,
    window_started_at,
    created_at,
    updated_at
  )
  values (
    p_key,
    p_route,
    1,
    current_time,
    current_time,
    current_time
  )
  on conflict (key) do update
    set route = excluded.route,
        hits = case
          when extract(epoch from (current_time - rl.window_started_at)) >= p_window_seconds then 1
          else rl.hits + 1
        end,
        window_started_at = case
          when extract(epoch from (current_time - rl.window_started_at)) >= p_window_seconds then current_time
          else rl.window_started_at
        end,
        updated_at = current_time
  returning hits, window_started_at
  into current_hits, current_window_started_at;

  elapsed_seconds := greatest(0, floor(extract(epoch from (current_time - current_window_started_at)))::integer);

  if current_hits > p_limit then
    return query
    select false, 0, greatest(1, p_window_seconds - elapsed_seconds);
  end if;

  return query
  select true, greatest(0, p_limit - current_hits), greatest(1, p_window_seconds - elapsed_seconds);
end;
$$;
