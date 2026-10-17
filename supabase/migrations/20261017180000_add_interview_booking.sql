-- Interview booking: employer publishes time slots per vacancy, invited candidates pick one.

-- { "location": text, "slots": ["2026-10-20T14:00", ...] } — slots are Europe/Kyiv local time without offset.
alter table public.hiring_vacancies
  add column if not exists interview jsonb;

alter table public.hiring_applications
  add column if not exists interview_token text unique,
  add column if not exists interview_slot text;

-- One candidate per slot within a vacancy.
create unique index if not exists hiring_applications_interview_slot_idx
  on public.hiring_applications (vacancy_id, interview_slot)
  where interview_slot is not null;
