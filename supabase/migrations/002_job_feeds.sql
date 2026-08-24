create table if not exists job_feeds (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  board_url text not null,
  provider text not null check (provider in ('Greenhouse','Lever','Ashby')),
  active boolean not null default true,
  last_checked_at timestamptz,
  last_job_count integer not null default 0,
  last_snapshot jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique(profile_id, board_url)
);
alter table job_feeds enable row level security;
create policy "job feed owner" on job_feeds for all
  using (profile_id in (select id from profiles where auth_user_id=auth.uid()))
  with check (profile_id in (select id from profiles where auth_user_id=auth.uid()));
create index if not exists job_feeds_active_idx on job_feeds(profile_id,active);
