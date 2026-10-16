-- Hiring assistant core: employer vacancies and candidate applications.
-- All reads and writes go through backend routes with service_role, so the
-- tables have RLS enabled without policies and no grants for anon/authenticated.

create table if not exists public.hiring_vacancies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'closed')),
  title text not null,
  city text,
  brief text not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hiring_vacancies_owner_idx
  on public.hiring_vacancies (owner_id, created_at desc);

create table if not exists public.hiring_applications (
  id uuid primary key default gen_random_uuid(),
  vacancy_id uuid not null references public.hiring_vacancies(id) on delete cascade,
  candidate_name text not null,
  candidate_phone text not null,
  answers jsonb not null,
  about text,
  screening jsonb,
  score integer check (score between 0 and 100),
  verdict text check (verdict in ('call', 'maybe', 'reject')),
  status text not null default 'new' check (status in ('new', 'invited', 'hired', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hiring_applications_vacancy_idx
  on public.hiring_applications (vacancy_id, score desc nulls last, created_at desc);

drop trigger if exists set_hiring_vacancies_updated_at on public.hiring_vacancies;
create trigger set_hiring_vacancies_updated_at
before update on public.hiring_vacancies
for each row
execute function public.set_updated_at();

drop trigger if exists set_hiring_applications_updated_at on public.hiring_applications;
create trigger set_hiring_applications_updated_at
before update on public.hiring_applications
for each row
execute function public.set_updated_at();

alter table public.hiring_vacancies enable row level security;
alter table public.hiring_applications enable row level security;

revoke all privileges on table
  public.hiring_vacancies,
  public.hiring_applications
from anon, authenticated;

grant all privileges on table
  public.hiring_vacancies,
  public.hiring_applications
to service_role;
