-- PropIQ: real estate AI back office
-- Apply in Supabase SQL editor after 003_workspaces.sql

-- ─── conversations ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations: owner full access"
  ON conversations FOR ALL
  USING (auth.uid() = user_id);

-- ─── messages ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID        REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role            TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages: owner full access"
  ON messages FOR ALL
  USING (auth.uid() = user_id);

-- ─── saved_deals ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_deals (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_data JSONB       NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE saved_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_deals: owner full access"
  ON saved_deals FOR ALL
  USING (auth.uid() = user_id);

-- ─── propiq_setup ───────────────────────────────────────────────────────────
-- Tracks whether PropIQ agents/grid have been seeded for a user
CREATE TABLE IF NOT EXISTS propiq_setup (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_finder_id   UUID,
  comp_puller_id   UUID,
  grid_id          UUID,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE propiq_setup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "propiq_setup: owner full access"
  ON propiq_setup FOR ALL
  USING (auth.uid() = user_id);

-- ─── grants ─────────────────────────────────────────────────────────────────
GRANT ALL ON TABLE conversations  TO anon, authenticated, service_role;
GRANT ALL ON TABLE messages       TO anon, authenticated, service_role;
GRANT ALL ON TABLE saved_deals    TO anon, authenticated, service_role;
GRANT ALL ON TABLE propiq_setup   TO anon, authenticated, service_role;
