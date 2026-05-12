ALTER TABLE datamart_orders ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_datamart_orders_user_id ON datamart_orders(user_id);
GRANT ALL ON TABLE datamart_orders TO authenticator;
