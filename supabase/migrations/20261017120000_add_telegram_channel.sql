-- Telegram bot as a second candidate channel.

alter table public.hiring_applications
  add column if not exists source text not null default 'web' check (source in ('web', 'telegram')),
  add column if not exists telegram_user_id bigint;

-- One in-progress application dialog per Telegram chat. Server-only (service role).
create table if not exists public.telegram_sessions (
  chat_id bigint primary key,
  telegram_user_id bigint not null,
  vacancy_id uuid not null references public.hiring_vacancies(id) on delete cascade,
  step integer not null default 0,
  answers jsonb not null default '{}'::jsonb,
  candidate_name text,
  candidate_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_telegram_sessions_updated_at on public.telegram_sessions;
create trigger set_telegram_sessions_updated_at
before update on public.telegram_sessions
for each row
execute function public.set_updated_at();

alter table public.telegram_sessions enable row level security;

revoke all privileges on table public.telegram_sessions from anon, authenticated;
grant all privileges on table public.telegram_sessions to service_role;
