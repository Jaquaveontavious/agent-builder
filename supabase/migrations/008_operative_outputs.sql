create table if not exists operative_outputs (
  id uuid primary key default gen_random_uuid(),
  operative_id uuid not null references operatives(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Output',
  content text not null,
  prompt text,
  created_at timestamptz not null default now()
);

alter table operative_outputs enable row level security;

create policy "Users own their outputs"
  on operative_outputs for all
  using (auth.uid() = user_id);

create index operative_outputs_operative_id_idx on operative_outputs(operative_id);
create index operative_outputs_user_id_idx on operative_outputs(user_id);
