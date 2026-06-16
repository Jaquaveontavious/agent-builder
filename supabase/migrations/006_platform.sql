-- Operative suites catalog (pre-seeded, not per-user)
create table if not exists suites (
  id text primary key,
  name text not null,
  description text,
  category text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- User operative instances (one row per user per deployed suite)
create table if not exists operatives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  suite_id text references suites not null,
  agent_id text not null,
  name text not null,
  config jsonb default '{}',
  status text default 'active',
  last_run_at timestamptz,
  created_at timestamptz default now()
);

-- Run history for operatives
create table if not exists operative_runs (
  id uuid primary key default gen_random_uuid(),
  operative_id uuid references operatives not null,
  user_id uuid references auth.users not null,
  input jsonb,
  output jsonb,
  status text default 'pending',
  tokens_used integer,
  error_message text,
  created_at timestamptz default now()
);

-- Media storage metadata (Content Suite)
create table if not exists job_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  operative_id uuid references operatives,
  job_id text,
  file_path text not null,
  file_url text not null,
  caption_generated text,
  platform_captions jsonb,
  tags text[],
  posted_at jsonb,
  created_at timestamptz default now()
);

-- Seed suites
insert into suites (id, name, description, category) values
  ('propiq', 'PropIQ', 'AI agents for real estate wholesalers and investors — deal finding, comp pulling, underwriting, and lead nurture.', 'real_estate'),
  ('content', 'Content Suite', 'Upload job photos and get AI-generated captions for Instagram, Facebook, TikTok, and Google Business instantly.', 'content')
on conflict (id) do nothing;

-- RLS
alter table suites enable row level security;
alter table operatives enable row level security;
alter table operative_runs enable row level security;
alter table job_media enable row level security;

-- Suites are readable by everyone (catalog)
create policy "suites_public_read" on suites for select using (true);

-- Operatives: user owns their rows
create policy "operatives_select" on operatives for select using (auth.uid() = user_id);
create policy "operatives_insert" on operatives for insert with check (auth.uid() = user_id);
create policy "operatives_update" on operatives for update using (auth.uid() = user_id);
create policy "operatives_delete" on operatives for delete using (auth.uid() = user_id);

-- Operative runs: user owns their rows
create policy "operative_runs_select" on operative_runs for select using (auth.uid() = user_id);
create policy "operative_runs_insert" on operative_runs for insert with check (auth.uid() = user_id);

-- Job media: user owns their rows
create policy "job_media_select" on job_media for select using (auth.uid() = user_id);
create policy "job_media_insert" on job_media for insert with check (auth.uid() = user_id);
create policy "job_media_update" on job_media for update using (auth.uid() = user_id);
create policy "job_media_delete" on job_media for delete using (auth.uid() = user_id);
