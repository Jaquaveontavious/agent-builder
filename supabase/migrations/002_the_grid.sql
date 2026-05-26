-- The Grid: multi-agent orchestration tables
-- Apply in Supabase SQL editor after 001_initial.sql

-- ─── grids ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grids (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          TEXT        NOT NULL,
  description   TEXT,
  member_agents JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE grids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grids: owner full access"
  ON grids FOR ALL
  USING (auth.uid() = user_id);

-- ─── grid_runs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grid_runs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  grid_id     UUID        REFERENCES grids(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  input       TEXT        NOT NULL,
  output      TEXT,
  status      TEXT        DEFAULT 'running' CHECK (status IN ('running', 'complete', 'failed')),
  agent_logs  JSONB       NOT NULL DEFAULT '[]'::jsonb,
  tokens_used INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE grid_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grid_runs: owner full access"
  ON grid_runs FOR ALL
  USING (auth.uid() = user_id);
