create extension if not exists pgcrypto;
create extension if not exists citext;

create type work_arrangement as enum ('remote','hybrid','onsite');
create type application_status as enum ('discovered','shortlisted','preparing','ready','applied','recruiter_screen','interview','final_interview','offer','rejected','withdrawn','closed');
create type integrity_level as enum ('green','amber','red');

create table profiles (
  id uuid primary key default gen_random_uuid(), auth_user_id uuid unique references auth.users(id) on delete cascade,
  full_name text not null, location text, minimum_salary integer check (minimum_salary >= 0), work_authorization text[] not null default '{}',
  approved_career_break_language text, preferences jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table companies (id uuid primary key default gen_random_uuid(), profile_id uuid not null references profiles(id) on delete cascade, name text not null, industry text, website text, notes text, created_at timestamptz not null default now(), unique(profile_id,name));
create table career_positions (
  id uuid primary key default gen_random_uuid(), profile_id uuid not null references profiles(id) on delete cascade, employer text not null, title text not null,
  location text, start_date date, end_date date, description text, sort_order integer not null default 0, created_at timestamptz not null default now()
);
create table career_experiences (
  id uuid primary key default gen_random_uuid(), position_id uuid not null references career_positions(id) on delete cascade, experience_type text not null,
  content text not null, source_reference text, verified boolean not null default false, metadata jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table career_achievements (id uuid primary key default gen_random_uuid(), experience_id uuid not null references career_experiences(id) on delete cascade, metric_value text, metric_context text, created_at timestamptz not null default now());
create table skills (id uuid primary key default gen_random_uuid(), name citext not null unique, category text, created_at timestamptz not null default now());
create table experience_skills (experience_id uuid references career_experiences(id) on delete cascade, skill_id uuid references skills(id) on delete cascade, primary key (experience_id, skill_id));
create table resumes (id uuid primary key default gen_random_uuid(), profile_id uuid not null references profiles(id) on delete cascade, name text not null, is_master boolean not null default false, private_storage_path text, mime_type text, created_at timestamptz not null default now());
create unique index one_master_resume_per_profile on resumes(profile_id) where is_master;
create table resume_versions (
  id uuid primary key default gen_random_uuid(), resume_id uuid not null references resumes(id) on delete cascade, version integer not null,
  content jsonb not null, changes jsonb not null default '[]', reasoning_summary text, user_edits jsonb not null default '{}', created_at timestamptz not null default now(), unique(resume_id, version)
);
create table job_sources (id uuid primary key default gen_random_uuid(), profile_id uuid not null references profiles(id) on delete cascade, provider text not null, external_id text, source_url text, original_url text, discovered_at timestamptz not null default now(), raw_payload jsonb);
create table jobs (
  id uuid primary key default gen_random_uuid(), profile_id uuid not null references profiles(id) on delete cascade, company_id uuid references companies(id), source_id uuid references job_sources(id), title text not null, normalized_title text not null,
  location text, arrangement work_arrangement, salary_min integer, salary_max integer, employment_type text, description text not null, requirements_text text,
  role_family text, date_posted date, application_deadline date, is_demo boolean not null default false, dismissed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index jobs_title_idx on jobs(normalized_title); create index jobs_posted_idx on jobs(date_posted desc); create index jobs_company_idx on jobs(company_id);
create table job_requirements (id uuid primary key default gen_random_uuid(), job_id uuid not null references jobs(id) on delete cascade, requirement text not null, importance text not null check (importance in ('required','preferred')), sort_order integer not null default 0);
create table job_matches (
  id uuid primary key default gen_random_uuid(), job_id uuid not null references jobs(id) on delete cascade, profile_id uuid not null references profiles(id) on delete cascade,
  score numeric(5,2) not null check (score between 0 and 100), category text not null, interview_probability numeric(5,2) check (interview_probability between 0 and 100),
  factor_scores jsonb not null, strengths jsonb not null default '[]', gaps jsonb not null default '[]', explanation text, user_override numeric(5,2), created_at timestamptz not null default now(), unique(job_id, profile_id)
);
create table applications (
  id uuid primary key default gen_random_uuid(), profile_id uuid not null references profiles(id) on delete cascade, job_id uuid not null references jobs(id), status application_status not null default 'discovered',
  quality_score numeric(5,2) check (quality_score between 0 and 100), resume_version_id uuid references resume_versions(id), date_applied date, followup_date date, notes text,
  outcome text, rejection_stage text, offer_details jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(profile_id, job_id)
);
create index applications_status_idx on applications(profile_id,status);
create table application_stage_history (id uuid primary key default gen_random_uuid(), application_id uuid not null references applications(id) on delete cascade, from_status application_status, to_status application_status not null, changed_at timestamptz not null default now());
create table cover_letters (id uuid primary key default gen_random_uuid(), application_id uuid not null references applications(id) on delete cascade, version integer not null, content text not null, user_edits text, accepted_at timestamptz, created_at timestamptz not null default now());
create table application_answers (id uuid primary key default gen_random_uuid(), application_id uuid not null references applications(id) on delete cascade, question text not null, answer text not null, integrity integrity_level, user_edits text, created_at timestamptz not null default now());
create table contacts (id uuid primary key default gen_random_uuid(), profile_id uuid not null references profiles(id) on delete cascade, company_id uuid references companies(id), name text not null, title text, relationship text, source text, public_profile_url text, email text, notes text, contacted_at timestamptz, response text, followup_date date, created_at timestamptz not null default now());
create table outreach_messages (id uuid primary key default gen_random_uuid(), contact_id uuid not null references contacts(id) on delete cascade, application_id uuid references applications(id) on delete cascade, channel text not null, content text not null, approved_at timestamptz, sent_at timestamptz, created_at timestamptz not null default now());
create table followups (id uuid primary key default gen_random_uuid(), application_id uuid not null references applications(id) on delete cascade, contact_id uuid references contacts(id), due_date date not null, completed_at timestamptz, notes text, created_at timestamptz not null default now());
create table interviews (id uuid primary key default gen_random_uuid(), application_id uuid not null references applications(id) on delete cascade, interview_type text not null, starts_at timestamptz not null, interviewer text, interviewer_title text, stage text, notes text, outcome text, created_at timestamptz not null default now());
create table interview_prep (id uuid primary key default gen_random_uuid(), interview_id uuid not null references interviews(id) on delete cascade, content jsonb not null, created_at timestamptz not null default now());
create table user_feedback (id uuid primary key default gen_random_uuid(), profile_id uuid not null references profiles(id) on delete cascade, job_id uuid references jobs(id) on delete cascade, feedback_type text not null, reason text, notes text, created_at timestamptz not null default now());
create table weekly_targets (id uuid primary key default gen_random_uuid(), profile_id uuid not null references profiles(id) on delete cascade, week_start date not null, quality_applications integer not null default 12, outreach integer not null default 5, followups integer not null default 5, unique(profile_id,week_start));
create table strategy_insights (id uuid primary key default gen_random_uuid(), profile_id uuid not null references profiles(id) on delete cascade, insight_type text not null, content text not null, evidence jsonb not null, sample_size integer not null, created_at timestamptz not null default now());
create table ai_generations (id uuid primary key default gen_random_uuid(), profile_id uuid not null references profiles(id) on delete cascade, entity_type text not null, entity_id uuid, operation text not null, model text not null, prompt_version text not null, source_data jsonb not null, output jsonb not null, user_edits jsonb, accepted_at timestamptz, created_at timestamptz not null default now());

alter table profiles enable row level security; alter table career_positions enable row level security; alter table career_experiences enable row level security;
alter table resumes enable row level security; alter table resume_versions enable row level security; alter table applications enable row level security;
alter table companies enable row level security; alter table job_sources enable row level security; alter table jobs enable row level security;
alter table job_requirements enable row level security; alter table job_matches enable row level security; alter table application_stage_history enable row level security;
alter table cover_letters enable row level security; alter table application_answers enable row level security; alter table contacts enable row level security;
alter table outreach_messages enable row level security; alter table followups enable row level security; alter table interviews enable row level security;
alter table interview_prep enable row level security; alter table user_feedback enable row level security; alter table weekly_targets enable row level security;
alter table strategy_insights enable row level security; alter table ai_generations enable row level security;
create policy "profile owner" on profiles for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);
create policy "position owner" on career_positions for all using (profile_id in (select id from profiles where auth_user_id=auth.uid())) with check (profile_id in (select id from profiles where auth_user_id=auth.uid()));
create policy "experience owner" on career_experiences for all using (position_id in (select cp.id from career_positions cp join profiles p on p.id=cp.profile_id where p.auth_user_id=auth.uid()));
create policy "resume owner" on resumes for all using (profile_id in (select id from profiles where auth_user_id=auth.uid())) with check (profile_id in (select id from profiles where auth_user_id=auth.uid()));
create policy "resume version owner" on resume_versions for all using (resume_id in (select r.id from resumes r join profiles p on p.id=r.profile_id where p.auth_user_id=auth.uid()));
create policy "application owner" on applications for all using (profile_id in (select id from profiles where auth_user_id=auth.uid())) with check (profile_id in (select id from profiles where auth_user_id=auth.uid()));
create policy "job match owner" on job_matches for all using (profile_id in (select id from profiles where auth_user_id=auth.uid())) with check (profile_id in (select id from profiles where auth_user_id=auth.uid()));
create policy "job owner" on jobs for all using (profile_id in (select id from profiles where auth_user_id=auth.uid())) with check (profile_id in (select id from profiles where auth_user_id=auth.uid()));
create policy "job requirement owner" on job_requirements for all using (job_id in (select id from jobs where profile_id in (select id from profiles where auth_user_id=auth.uid()))) with check (job_id in (select id from jobs where profile_id in (select id from profiles where auth_user_id=auth.uid())));
create policy "job source owner" on job_sources for all using (profile_id in (select id from profiles where auth_user_id=auth.uid())) with check (profile_id in (select id from profiles where auth_user_id=auth.uid()));
create policy "company owner" on companies for all using (profile_id in (select id from profiles where auth_user_id=auth.uid())) with check (profile_id in (select id from profiles where auth_user_id=auth.uid()));
create policy "stage history owner" on application_stage_history for all using (application_id in (select id from applications where profile_id in (select id from profiles where auth_user_id=auth.uid()))) with check (application_id in (select id from applications where profile_id in (select id from profiles where auth_user_id=auth.uid())));
create policy "cover letter owner" on cover_letters for all using (application_id in (select id from applications where profile_id in (select id from profiles where auth_user_id=auth.uid()))) with check (application_id in (select id from applications where profile_id in (select id from profiles where auth_user_id=auth.uid())));
create policy "answer owner" on application_answers for all using (application_id in (select id from applications where profile_id in (select id from profiles where auth_user_id=auth.uid()))) with check (application_id in (select id from applications where profile_id in (select id from profiles where auth_user_id=auth.uid())));
create policy "contact owner" on contacts for all using (profile_id in (select id from profiles where auth_user_id=auth.uid())) with check (profile_id in (select id from profiles where auth_user_id=auth.uid()));
create policy "feedback owner" on user_feedback for all using (profile_id in (select id from profiles where auth_user_id=auth.uid())) with check (profile_id in (select id from profiles where auth_user_id=auth.uid()));
create policy "target owner" on weekly_targets for all using (profile_id in (select id from profiles where auth_user_id=auth.uid())) with check (profile_id in (select id from profiles where auth_user_id=auth.uid()));
create policy "insight owner" on strategy_insights for all using (profile_id in (select id from profiles where auth_user_id=auth.uid())) with check (profile_id in (select id from profiles where auth_user_id=auth.uid()));
create policy "generation owner" on ai_generations for all using (profile_id in (select id from profiles where auth_user_id=auth.uid())) with check (profile_id in (select id from profiles where auth_user_id=auth.uid()));
create policy "outreach owner" on outreach_messages for all using (contact_id in (select id from contacts where profile_id in (select id from profiles where auth_user_id=auth.uid()))) with check (contact_id in (select id from contacts where profile_id in (select id from profiles where auth_user_id=auth.uid())));
create policy "followup owner" on followups for all using (application_id in (select id from applications where profile_id in (select id from profiles where auth_user_id=auth.uid()))) with check (application_id in (select id from applications where profile_id in (select id from profiles where auth_user_id=auth.uid())));
create policy "interview owner" on interviews for all using (application_id in (select id from applications where profile_id in (select id from profiles where auth_user_id=auth.uid()))) with check (application_id in (select id from applications where profile_id in (select id from profiles where auth_user_id=auth.uid())));
create policy "prep owner" on interview_prep for all using (interview_id in (select i.id from interviews i join applications a on a.id=i.application_id where a.profile_id in (select id from profiles where auth_user_id=auth.uid()))) with check (interview_id in (select i.id from interviews i join applications a on a.id=i.application_id where a.profile_id in (select id from profiles where auth_user_id=auth.uid())));

-- The project is configured not to expose new tables automatically. Grant only
-- the authenticated role access; RLS policies above still govern every row.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;

-- Résumés are private and organized under the authenticated user's UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 10485760, array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "resume object owner read" on storage.objects for select to authenticated
using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "resume object owner insert" on storage.objects for insert to authenticated
with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "resume object owner update" on storage.objects for update to authenticated
using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "resume object owner delete" on storage.objects for delete to authenticated
using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
