-- ============================================================
-- 001_missing_tables.sql
-- Creates all tables referenced in the app that may not exist.
-- Safe to run multiple times (CREATE TABLE IF NOT EXISTS).
-- ============================================================

-- system_config: global key-value settings
CREATE TABLE IF NOT EXISTS system_config (
  config_key   TEXT PRIMARY KEY,
  config_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by   TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default reseller form config
INSERT INTO system_config (config_key, config_value)
VALUES (
  'reseller_form_config',
  '{
    "business_name":    {"enabled": true, "required": true},
    "business_address": {"enabled": true, "required": false},
    "business_phone":   {"enabled": true, "required": false},
    "business_email":   {"enabled": true, "required": false},
    "business_type":    {"enabled": true, "required": false},
    "application_fee":  100.00,
    "currency":         "GHS",
    "require_payment_before_approval": true
  }'::jsonb
)
ON CONFLICT (config_key) DO NOTHING;

-- custom_form_fields: admin-configurable extra fields on reseller application
CREATE TABLE IF NOT EXISTS custom_form_fields (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name   TEXT NOT NULL UNIQUE,
  field_label  TEXT NOT NULL,
  field_type   TEXT NOT NULL DEFAULT 'text',
  field_options JSONB DEFAULT '[]'::jsonb,
  is_required  BOOLEAN NOT NULL DEFAULT false,
  is_enabled   BOOLEAN NOT NULL DEFAULT true,
  placeholder  TEXT,
  help_text    TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- reseller_applications: applications to become a reseller
CREATE TABLE IF NOT EXISTS reseller_applications (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              TEXT NOT NULL,
  business_name        TEXT NOT NULL,
  business_address     TEXT,
  business_phone       TEXT,
  business_email       TEXT,
  business_type        TEXT,
  custom_fields        JSONB DEFAULT '{}'::jsonb,
  application_status   TEXT NOT NULL DEFAULT 'pending',
  payment_status       TEXT NOT NULL DEFAULT 'pending',
  application_fee      NUMERIC(10,2) NOT NULL DEFAULT 100.00,
  rejection_reason     TEXT,
  reviewed_by          TEXT,
  reviewed_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reseller_applications_user_id ON reseller_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_reseller_applications_status ON reseller_applications(application_status);

-- reseller_tiers: tier levels with commission rates
CREATE TABLE IF NOT EXISTS reseller_tiers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL UNIQUE,
  display_name       TEXT NOT NULL,
  min_sales_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_referrals      INTEGER NOT NULL DEFAULT 0,
  commission_rate    NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  discount_rate      NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  bonus_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  perks              JSONB DEFAULT '[]'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default tiers
INSERT INTO reseller_tiers (name, display_name, min_sales_amount, min_referrals, commission_rate, discount_rate, bonus_amount, perks) VALUES
  ('BRONZE',   'Bronze',   0,      0,  5.00,  10.00, 0,      '["Priority support", "Basic marketing kit"]'::jsonb),
  ('SILVER',   'Silver',   5000,   5,  7.00,  12.00, 50,     '["Priority support", "Extended marketing kit", "Monthly bonus"]'::jsonb),
  ('GOLD',     'Gold',     20000,  20, 10.00, 15.00, 200,    '["24/7 support", "Full marketing kit", "Quarterly bonus", "Dedicated account manager"]'::jsonb),
  ('PLATINUM', 'Platinum', 100000, 50, 15.00, 20.00, 500,    '["24/7 VIP support", "Premium marketing kit", "Monthly bonus", "Dedicated account manager", "Custom pricing"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- reseller_profiles: approved reseller details
CREATE TABLE IF NOT EXISTS reseller_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 TEXT NOT NULL UNIQUE,
  business_name           TEXT NOT NULL,
  business_address        TEXT,
  business_phone          TEXT,
  reseller_code           TEXT NOT NULL UNIQUE,
  commission_rate         NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  discount_rate           NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  wallet_balance          NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_sales             NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_commission_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_referrals         INTEGER NOT NULL DEFAULT 0,
  status                  TEXT NOT NULL DEFAULT 'active',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reseller_profiles_user_id ON reseller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_reseller_profiles_code   ON reseller_profiles(reseller_code);

-- reseller_sales
CREATE TABLE IF NOT EXISTS reseller_sales (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL,
  user_id     TEXT NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  profit      NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_type   TEXT NOT NULL DEFAULT 'airtime',
  status      TEXT NOT NULL DEFAULT 'completed',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reseller_sales_reseller_id ON reseller_sales(reseller_id);

-- reseller_commissions
CREATE TABLE IF NOT EXISTS reseller_commissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id       UUID NOT NULL,
  sale_id           UUID,
  commission_amount NUMERIC(10,2) NOT NULL,
  commission_type   TEXT NOT NULL DEFAULT 'sale',
  status            TEXT NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reseller_commissions_reseller_id ON reseller_commissions(reseller_id);

-- reseller_inventory
CREATE TABLE IF NOT EXISTS reseller_inventory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL,
  product_id  TEXT NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'airtime',
  quantity    INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'available',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reseller_inventory_reseller_id ON reseller_inventory(reseller_id);

-- reseller_daily_stats
CREATE TABLE IF NOT EXISTS reseller_daily_stats (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id        UUID NOT NULL,
  date               DATE NOT NULL,
  sales_count        INTEGER NOT NULL DEFAULT 0,
  sales_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_earned  NUMERIC(12,2) NOT NULL DEFAULT 0,
  new_referrals      INTEGER NOT NULL DEFAULT 0,
  UNIQUE (reseller_id, date)
);
CREATE INDEX IF NOT EXISTS idx_reseller_daily_stats_reseller_id ON reseller_daily_stats(reseller_id);

-- reseller_geographic_stats
CREATE TABLE IF NOT EXISTS reseller_geographic_stats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL,
  region      TEXT NOT NULL DEFAULT '',
  city        TEXT NOT NULL DEFAULT '',
  sales_count INTEGER NOT NULL DEFAULT 0,
  sales_amount NUMERIC(12,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_reseller_geographic_stats_reseller_id ON reseller_geographic_stats(reseller_id);

-- reseller_referral_links
CREATE TABLE IF NOT EXISTS reseller_referral_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id   UUID NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  landing_page  TEXT NOT NULL DEFAULT '/register',
  utm_source    TEXT,
  utm_medium    TEXT,
  clicks        INTEGER NOT NULL DEFAULT 0,
  conversions   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reseller_referral_links_reseller_id ON reseller_referral_links(reseller_id);

-- reseller_audit_logs
CREATE TABLE IF NOT EXISTS reseller_audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL,
  action      TEXT NOT NULL,
  details     JSONB DEFAULT '{}'::jsonb,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reseller_audit_logs_reseller_id ON reseller_audit_logs(reseller_id);

-- marketing_assets
CREATE TABLE IF NOT EXISTS marketing_assets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'image',
  category       TEXT NOT NULL DEFAULT 'banner',
  file_url       TEXT NOT NULL DEFAULT '',
  thumbnail_url  TEXT,
  dimensions     TEXT,
  file_size      INTEGER NOT NULL DEFAULT 0,
  download_count INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- fraud_alerts
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID,
  user_id     TEXT,
  alert_type  TEXT NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'low',
  description TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'open',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_reseller_id ON fraud_alerts(reseller_id);

-- rate_limit_violations
CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID,
  user_id     TEXT,
  endpoint    TEXT NOT NULL,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- suspicious_transactions
CREATE TABLE IF NOT EXISTS suspicious_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id    UUID,
  transaction_id TEXT,
  reason         TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'open',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- result_checker_cards: inventory of WAEC/NECO/etc. cards
CREATE TABLE IF NOT EXISTS result_checker_cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type       TEXT NOT NULL,
  card_pin        TEXT NOT NULL,
  serial_number   TEXT NOT NULL,
  selling_price   NUMERIC(10,2) NOT NULL,
  wholesale_price NUMERIC(10,2) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'available',
  purchased_by    TEXT,
  purchased_at    TIMESTAMPTZ,
  expiry_date     DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_result_checker_cards_exam_type ON result_checker_cards(exam_type);
CREATE INDEX IF NOT EXISTS idx_result_checker_cards_status    ON result_checker_cards(status);

-- result_checker_purchases: purchase records
CREATE TABLE IF NOT EXISTS result_checker_purchases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL,
  card_id           UUID NOT NULL,
  exam_type         TEXT NOT NULL,
  card_pin          TEXT,
  serial_number     TEXT,
  amount_paid       NUMERIC(10,2) NOT NULL,
  payment_reference TEXT,
  status            TEXT NOT NULL DEFAULT 'completed',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_result_checker_purchases_user_id ON result_checker_purchases(user_id);

-- verification_services: virtual number services
CREATE TABLE IF NOT EXISTS verification_services (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  category             TEXT NOT NULL,
  description          TEXT,
  icon_url             TEXT,
  onetime_price        NUMERIC(10,2) NOT NULL DEFAULT 0,
  rental_price_per_day NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- verification_numbers: provisioned virtual numbers
CREATE TABLE IF NOT EXISTS verification_numbers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  UUID NOT NULL,
  user_id     TEXT NOT NULL,
  number      TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'onetime',
  status      TEXT NOT NULL DEFAULT 'active',
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_verification_numbers_user_id ON verification_numbers(user_id);

-- verification_sms: incoming SMS for virtual numbers
CREATE TABLE IF NOT EXISTS verification_sms (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number_id  UUID NOT NULL,
  from_num   TEXT NOT NULL,
  message    TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_verification_sms_number_id ON verification_sms(number_id);

-- homepage_media: stores metadata for homepage visual assets
CREATE TABLE IF NOT EXISTS homepage_media (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section        TEXT NOT NULL,
  slot_key       TEXT NOT NULL,
  media_type     TEXT NOT NULL, -- 'image' or 'video'
  file_url       TEXT NOT NULL,
  storage_source TEXT NOT NULL DEFAULT 'supabase', -- 'local' or 'supabase'
  file_name      TEXT,
  mime_type      TEXT,
  file_size      BIGINT,
  storage_path   TEXT,
  public_url     TEXT,
  section_key    TEXT, -- Legacy compatibility
  asset_type     TEXT, -- Legacy compatibility
  alt_text       TEXT,
  priority       INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'archived'
  is_active      BOOLEAN NOT NULL DEFAULT true, -- Legacy compatibility
  version        INTEGER NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_homepage_media_section ON homepage_media(section);
CREATE INDEX IF NOT EXISTS idx_homepage_media_slot_key ON homepage_media(slot_key);
CREATE INDEX IF NOT EXISTS idx_homepage_media_status ON homepage_media(status);
CREATE INDEX IF NOT EXISTS idx_homepage_media_active ON homepage_media(is_active);
CREATE INDEX IF NOT EXISTS idx_homepage_media_priority ON homepage_media(priority);

