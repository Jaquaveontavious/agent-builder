-- Add memory and run tracking to operatives
alter table operatives add column if not exists memory text default '';
alter table operatives add column if not exists run_count integer default 0;

-- Add conversation tracking for usage history
create table if not exists operative_conversations (
  id uuid primary key default gen_random_uuid(),
  operative_id uuid references operatives not null,
  user_id uuid references auth.users not null,
  message_count integer default 0,
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table operative_conversations enable row level security;
create policy "operative_conversations_select" on operative_conversations for select using (auth.uid() = user_id);
create policy "operative_conversations_insert" on operative_conversations for insert with check (auth.uid() = user_id);
create policy "operative_conversations_update" on operative_conversations for update using (auth.uid() = user_id);
