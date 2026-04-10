-- Add lifecycle status for simulations used by onboarding wizard submissions

alter table if exists public.simulations
  add column if not exists status text not null default 'pending'
  check (status in ('pending', 'processing', 'completed', 'failed'));

create index if not exists simulations_status_idx
  on public.simulations (status);

