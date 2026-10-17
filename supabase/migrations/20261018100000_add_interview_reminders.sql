-- Daily interview reminders: remember who was already reminded and the candidate's answer.

alter table public.hiring_applications
  add column if not exists interview_reminded_at timestamptz,
  add column if not exists interview_confirmed boolean;
