-- Free trial: track PropIQ searches used before paywall
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS trial_searches_used INTEGER DEFAULT 0;
