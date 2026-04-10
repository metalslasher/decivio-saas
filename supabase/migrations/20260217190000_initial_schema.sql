-- Decivio Simulator - initial database schema for Supabase/PostgreSQL

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  locale text not null default 'uk',
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('free', 'trial', 'active', 'canceled', 'past_due')),
  plan text not null check (plan in ('free', 'pro')),
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.simulation_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.simulation_projects(id) on delete set null,
  scenario_type text not null check (scenario_type in ('career_switch')),
  name text,
  inputs jsonb not null check (jsonb_typeof(inputs) = 'object'),
  assumptions jsonb check (assumptions is null or jsonb_typeof(assumptions) = 'object'),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint simulations_id_user_id_unique unique (id, user_id)
);

create table if not exists public.simulation_results (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  summary_metrics jsonb not null check (jsonb_typeof(summary_metrics) = 'object'),
  series jsonb not null check (jsonb_typeof(series) = 'object'),
  ai_summary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint simulation_results_simulation_user_fk
    foreign key (simulation_id, user_id)
    references public.simulations (id, user_id)
    on delete cascade
);

create table if not exists public.lead_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('career_audit', 'resume_audit', 'consulting')),
  contact_email text not null,
  details jsonb,
  status text not null default 'new' check (status in ('new', 'in_progress', 'done', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_requests_details_is_object check (details is null or jsonb_typeof(details) = 'object')
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists subscriptions_user_id_idx
  on public.subscriptions (user_id);

create unique index if not exists subscriptions_stripe_customer_id_uidx
  on public.subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists subscriptions_stripe_subscription_id_uidx
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists simulation_projects_user_id_idx
  on public.simulation_projects (user_id);

create index if not exists simulation_projects_is_archived_idx
  on public.simulation_projects (is_archived);

create index if not exists simulations_user_id_idx
  on public.simulations (user_id);

create index if not exists simulations_project_id_idx
  on public.simulations (project_id);

create index if not exists simulations_scenario_type_idx
  on public.simulations (scenario_type);

create index if not exists simulations_inputs_gin_idx
  on public.simulations using gin (inputs);

create index if not exists simulation_results_user_id_idx
  on public.simulation_results (user_id);

create index if not exists lead_requests_type_idx
  on public.lead_requests (type);

create index if not exists lead_requests_status_idx
  on public.lead_requests (status);

create index if not exists lead_requests_user_id_idx
  on public.lead_requests (user_id);

-- ---------------------------------------------------------------------------
-- Trigger function for updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

drop trigger if exists set_simulation_projects_updated_at on public.simulation_projects;
create trigger set_simulation_projects_updated_at
before update on public.simulation_projects
for each row
execute function public.set_updated_at();

drop trigger if exists set_simulations_updated_at on public.simulations;
create trigger set_simulations_updated_at
before update on public.simulations
for each row
execute function public.set_updated_at();

drop trigger if exists set_simulation_results_updated_at on public.simulation_results;
create trigger set_simulation_results_updated_at
before update on public.simulation_results
for each row
execute function public.set_updated_at();

drop trigger if exists set_lead_requests_updated_at on public.lead_requests;
create trigger set_lead_requests_updated_at
before update on public.lead_requests
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed default profile row when a new auth user is created
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, created_at, updated_at)
  values (new.id, new.email, now(), now())
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.simulation_projects enable row level security;
alter table public.simulations enable row level security;
alter table public.simulation_results enable row level security;
alter table public.lead_requests enable row level security;

-- profiles: user can access only own profile
create policy profiles_select_own
  on public.profiles
  for select
  using (auth.uid() = id);

create policy profiles_insert_own
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy profiles_update_own
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy profiles_delete_own
  on public.profiles
  for delete
  using (auth.uid() = id);

-- subscriptions: user can read only own row
create policy subscriptions_select_own
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

-- simulation_projects: user can CRUD only own rows
create policy simulation_projects_select_own
  on public.simulation_projects
  for select
  using (auth.uid() = user_id);

create policy simulation_projects_insert_own
  on public.simulation_projects
  for insert
  with check (auth.uid() = user_id);

create policy simulation_projects_update_own
  on public.simulation_projects
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy simulation_projects_delete_own
  on public.simulation_projects
  for delete
  using (auth.uid() = user_id);

-- simulations: user can CRUD only own rows
create policy simulations_select_own
  on public.simulations
  for select
  using (auth.uid() = user_id);

create policy simulations_insert_own
  on public.simulations
  for insert
  with check (auth.uid() = user_id);

create policy simulations_update_own
  on public.simulations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy simulations_delete_own
  on public.simulations
  for delete
  using (auth.uid() = user_id);

-- simulation_results: user can read only own results
create policy simulation_results_select_own
  on public.simulation_results
  for select
  using (auth.uid() = user_id);

-- lead_requests: user can read own records; inserts for authenticated own user_id only
-- anonymous inserts should go only via backend using service role.
create policy lead_requests_select_own
  on public.lead_requests
  for select
  using (user_id is not null and auth.uid() = user_id);

create policy lead_requests_insert_authenticated_own
  on public.lead_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

