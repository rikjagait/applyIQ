alter table public.job_requirements
  add column if not exists category text,
  add column if not exists source_quote text,
  add column if not exists evidence text,
  add column if not exists strength text,
  add column if not exists gap text;

alter table public.job_requirements
  drop constraint if exists job_requirements_strength_check;

alter table public.job_requirements
  add constraint job_requirements_strength_check
  check (strength is null or strength in ('Strong', 'Moderate', 'None'));
