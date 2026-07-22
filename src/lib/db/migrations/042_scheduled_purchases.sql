-- Scheduled / recurring data bundle purchases
CREATE TABLE IF NOT EXISTS scheduled_purchases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  network      TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  plan_id      TEXT NOT NULL,
  plan_name    TEXT NOT NULL,
  amount       NUMERIC(12, 2) NOT NULL,
  frequency    TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly')),
  next_run_at  TIMESTAMPTZ NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at  TIMESTAMPTZ,
  run_count    INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_purchases_user_id  ON scheduled_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_purchases_next_run ON scheduled_purchases(next_run_at) WHERE is_active = TRUE;
