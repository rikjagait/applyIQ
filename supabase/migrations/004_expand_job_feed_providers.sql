alter table public.job_feeds drop constraint if exists job_feeds_provider_check;
alter table public.job_feeds add constraint job_feeds_provider_check
  check (provider in ('Greenhouse','Lever','Ashby','SmartRecruiters','Workday'));
