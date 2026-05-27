-- Workspaces: user-built AI dashboards
-- Apply in Supabase SQL editor after 002_the_grid.sql

-- ─── workspaces ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT        NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspaces: owner full access"
  ON workspaces FOR ALL
  USING (auth.uid() = user_id);

-- ─── panels ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS panels (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID        REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_id     UUID        REFERENCES agents(id) ON DELETE SET NULL,
  title        TEXT        NOT NULL,
  panel_type   TEXT        NOT NULL DEFAULT 'text'
                             CHECK (panel_type IN ('stat','list','table','text','query')),
  size         TEXT        NOT NULL DEFAULT 'medium'
                             CHECK (size IN ('small','medium','large')),
  position     INTEGER     NOT NULL DEFAULT 0,
  auto_prompt  TEXT,
  last_output  JSONB,
  last_run_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE panels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "panels: owner full access"
  ON panels FOR ALL
  USING (auth.uid() = user_id);

-- ─── grants ────────────────────────────────────────────────────────────────
GRANT ALL ON TABLE workspaces TO anon, authenticated, service_role;
GRANT ALL ON TABLE panels TO anon, authenticated, service_role;

-- While we're here, fix the grids tables if not already granted
GRANT ALL ON TABLE grids TO anon, authenticated, service_role;
GRANT ALL ON TABLE grid_runs TO anon, authenticated, service_role;
