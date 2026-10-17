-- Employer notifications about new candidates via the Telegram bot.

create table if not exists public.employer_notification_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  telegram_chat_id bigint unique,
  -- strong: only "call first" candidates; all: every new candidate; off: nothing.
  notify_level text not null default 'strong' check (notify_level in ('strong', 'all', 'off')),
  link_token text unique,
  link_token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_employer_notification_settings_updated_at on public.employer_notification_settings;
create trigger set_employer_notification_settings_updated_at
before update on public.employer_notification_settings
for each row
execute function public.set_updated_at();

alter table public.employer_notification_settings enable row level security;

revoke all privileges on table public.employer_notification_settings from anon, authenticated;
grant all privileges on table public.employer_notification_settings to service_role;
