-- AgentForge initial schema
-- Run this in your Supabase SQL editor

-- ─── agents ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name                TEXT NOT NULL,
  description         TEXT NOT NULL,
  system_prompt       TEXT NOT NULL,
  tools               JSONB DEFAULT '[]'::jsonb,
  status              TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  suggested_use_cases JSONB DEFAULT '[]'::jsonb,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents: owner full access"
  ON agents FOR ALL
  USING (auth.uid() = user_id);

-- ─── runs ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS runs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id     UUID REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  input        TEXT NOT NULL,
  output       TEXT,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'complete', 'failed')),
  tokens_used  INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "runs: owner full access"
  ON runs FOR ALL
  USING (auth.uid() = user_id);

-- ─── user_subscriptions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  plan                   TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  runs_this_month        INTEGER DEFAULT 0,
  month_reset_at         TIMESTAMPTZ DEFAULT date_trunc('month', NOW() + INTERVAL '1 month'),
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions: owner read"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ─── trigger: create subscription row on signup ───────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── trigger: auto-reset monthly run counter ─────────────────────────────
CREATE OR REPLACE FUNCTION public.reset_monthly_runs()
RETURNS TRIGGER AS $$
BEGIN
  IF NOW() >= OLD.month_reset_at THEN
    NEW.runs_this_month := 0;
    NEW.month_reset_at := date_trunc('month', NOW() + INTERVAL '1 month');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reset_runs_on_update
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.reset_monthly_runs();
