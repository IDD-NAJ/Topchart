-- ============================================================
-- 003_core_missing_tables.sql
-- Creates every table that the application code references but
-- that has no prior CREATE TABLE migration.  All statements use
-- IF NOT EXISTS / DO $$ guards so this file is idempotent and
-- safe to re-run against an already-partially-migrated database.
-- Run BEFORE 004_seed_data.sql.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- SECTION 1: PostgreSQL enum types required by tickets/disputes
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketStatus') THEN
    CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketPriority') THEN
    CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketChannel') THEN
    CREATE TYPE "TicketChannel" AS ENUM ('EMAIL', 'CHAT', 'IN_APP');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketSenderType') THEN
    CREATE TYPE "TicketSenderType" AS ENUM ('USER', 'ADMIN', 'SYSTEM');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DisputeStatus') THEN
    CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
  END IF;
END $$;

-- ============================================================
-- SECTION 2: wallets  (camelCase schema used by transactions.ts
--             and 010_sync_wallets.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS wallets (
  id            TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'GHS',
  status        TEXT NOT NULL DEFAULT 'ACTIVE',
  "availableBalance" NUMERIC(12,4) NOT NULL DEFAULT 0,
  "pendingBalance"   NUMERIC(12,4) NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallets_userId   ON wallets("userId");
CREATE INDEX IF NOT EXISTS idx_wallets_status   ON wallets(status);

-- ============================================================
-- SECTION 3: Support – tickets, ticket_messages, disputes
-- (camelCase columns to match tickets.ts / disputes.ts)
-- ============================================================

CREATE TABLE IF NOT EXISTS tickets (
  id           TEXT PRIMARY KEY,
  "userId"     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject      TEXT NOT NULL,
  status       "TicketStatus"  NOT NULL DEFAULT 'OPEN',
  priority     "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
  channel      "TicketChannel"  NOT NULL DEFAULT 'IN_APP',
  "externalRef" TEXT,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tickets_userId    ON tickets("userId");
CREATE INDEX IF NOT EXISTS idx_tickets_status    ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_createdAt ON tickets("createdAt" DESC);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id           TEXT PRIMARY KEY,
  "ticketId"   TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  "senderType" "TicketSenderType" NOT NULL DEFAULT 'USER',
  body         TEXT NOT NULL,
  attachments  JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticketId   ON ticket_messages("ticketId");
CREATE INDEX IF NOT EXISTS idx_ticket_messages_createdAt  ON ticket_messages("createdAt" ASC);

CREATE TABLE IF NOT EXISTS disputes (
  id              TEXT PRIMARY KEY,
  "transactionId" UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  "userId"        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          "DisputeStatus" NOT NULL DEFAULT 'OPEN',
  reason          TEXT,
  resolution      TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "resolvedAt"    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_disputes_userId        ON disputes("userId");
CREATE INDEX IF NOT EXISTS idx_disputes_transactionId ON disputes("transactionId");
CREATE INDEX IF NOT EXISTS idx_disputes_status        ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_createdAt     ON disputes("createdAt" DESC);

-- ============================================================
-- SECTION 4: KYC
-- ============================================================

CREATE TABLE IF NOT EXISTS kyc_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','submitted','under_review','approved','rejected')),
  first_name       TEXT,
  last_name        TEXT,
  date_of_birth    DATE,
  country          TEXT,
  phone_number     TEXT,
  address          TEXT,
  id_type          TEXT,
  id_number        TEXT,
  reviewed_by      UUID,
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kyc_profiles_user_id ON kyc_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_profiles_status  ON kyc_profiles(status);

CREATE TABLE IF NOT EXISTS kyc_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       UUID NOT NULL REFERENCES kyc_profiles(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type    TEXT NOT NULL,
  file_url         TEXT NOT NULL,
  file_name        TEXT,
  mime_type        TEXT,
  file_size        INTEGER,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected')),
  reviewed_by      UUID,
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_profile_id ON kyc_documents(profile_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id    ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status     ON kyc_documents(status);

CREATE TABLE IF NOT EXISTS kyc_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES kyc_profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL CHECK (action IN ('approve','reject','request_info')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kyc_reviews_profile_id  ON kyc_reviews(profile_id);
CREATE INDEX IF NOT EXISTS idx_kyc_reviews_reviewer_id ON kyc_reviews(reviewer_id);

-- ============================================================
-- SECTION 5: Payment infrastructure
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_intents (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES users(id) ON DELETE SET NULL,
  paystack_reference TEXT UNIQUE,
  amount             NUMERIC(12,4) NOT NULL,
  currency           TEXT NOT NULL DEFAULT 'GHS',
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','processing','success','failed','cancelled')),
  provider           TEXT,
  metadata           JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_intents_user_id   ON payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status    ON payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_reference ON payment_intents(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_payment_intents_created   ON payment_intents(created_at DESC);

CREATE TABLE IF NOT EXISTS payment_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id         UUID REFERENCES payment_intents(id) ON DELETE CASCADE,
  event_type        TEXT NOT NULL,
  provider          TEXT,
  provider_event_id TEXT,
  payload           JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed         BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_events_intent_id ON payment_events(intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_type      ON payment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_events_created   ON payment_events(created_at DESC);

-- payment_provider_events alias expected by ALLOWED_TABLES
CREATE TABLE IF NOT EXISTS payment_provider_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id         UUID REFERENCES payment_intents(id) ON DELETE CASCADE,
  event_type        TEXT NOT NULL,
  provider          TEXT,
  provider_event_id TEXT,
  payload           JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed         BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ppe_intent_id ON payment_provider_events(intent_id);
CREATE INDEX IF NOT EXISTS idx_ppe_created   ON payment_provider_events(created_at DESC);

-- ============================================================
-- SECTION 6: Ledger
-- ============================================================

CREATE TABLE IF NOT EXISTS ledger_accounts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  type       TEXT NOT NULL CHECK (type IN ('asset','liability','revenue','expense')),
  currency   TEXT NOT NULL DEFAULT 'GHS',
  balance    NUMERIC(12,4) NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  metadata   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ledger_accounts_type ON ledger_accounts(type);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      UUID NOT NULL REFERENCES ledger_accounts(id),
  transaction_id  UUID,
  amount          NUMERIC(12,4) NOT NULL,
  balance_after   NUMERIC(12,4) NOT NULL,
  entry_type      TEXT NOT NULL CHECK (entry_type IN ('debit','credit')),
  description     TEXT,
  reference_type  TEXT,
  reference_id    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_id     ON ledger_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction_id ON ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_created_at     ON ledger_entries(created_at DESC);

-- ============================================================
-- SECTION 7: Referrals – visits & rewards
-- (referral_visits must support both the stats route which uses
--  referral_code, and the track route which uses referrer_id)
-- ============================================================

CREATE TABLE IF NOT EXISTS referral_visits (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code       TEXT,
  referrer_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  visitor_ip          TEXT,
  visitor_fingerprint TEXT,
  visitor_user_agent  TEXT,
  user_agent          TEXT,
  converted           BOOLEAN NOT NULL DEFAULT false,
  converted_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  credited            BOOLEAN NOT NULL DEFAULT false,
  amount_credited     NUMERIC(12,4) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_referral_visits_code       ON referral_visits(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_visits_referrer   ON referral_visits(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_visits_created_at ON referral_visits(created_at DESC);

CREATE TABLE IF NOT EXISTS referral_rewards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  reward_type   TEXT NOT NULL DEFAULT 'credit',
  reward_amount NUMERIC(12,4) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','paid','cancelled')),
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status   ON referral_rewards(status);

-- ============================================================
-- SECTION 8: Promo codes
-- ============================================================

CREATE TABLE IF NOT EXISTS promo_codes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code               TEXT NOT NULL UNIQUE,
  description        TEXT,
  discount_type      TEXT NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value     NUMERIC(12,4) NOT NULL,
  min_purchase       NUMERIC(12,4) DEFAULT 0,
  max_uses           INTEGER,
  current_uses       INTEGER NOT NULL DEFAULT 0,
  max_uses_per_user  INTEGER DEFAULT 1,
  starts_at          TIMESTAMPTZ,
  expires_at         TIMESTAMPTZ,
  is_active          BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code   ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);

CREATE TABLE IF NOT EXISTS promo_redemptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id         UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id         TEXT,
  discount_applied NUMERIC(12,4) NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_promo_id   ON promo_redemptions(promo_id);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user_id    ON promo_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_created_at ON promo_redemptions(created_at DESC);

-- ============================================================
-- SECTION 9: Admin / RBAC
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'admin',
  permissions TEXT[] DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

CREATE TABLE IF NOT EXISTS action_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   TEXT,
  details       JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_action_logs_user_id   ON action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_action    ON action_logs(action);
CREATE INDEX IF NOT EXISTS idx_action_logs_resource  ON action_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_created_at ON action_logs(created_at DESC);

-- admin_action_logs alias (referenced in ALLOWED_TABLES list)
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   TEXT,
  details       JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_user_id    ON admin_action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_action     ON admin_action_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created_at ON admin_action_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_system   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  resource    TEXT NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('read','write','delete','*')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_assignments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id    UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role_id)
);
CREATE INDEX IF NOT EXISTS idx_role_assignments_user_id ON role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_role_id ON role_assignments(role_id);

CREATE TABLE IF NOT EXISTS role_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (role_id, permission_id)
);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);

-- ============================================================
-- SECTION 10: Extended user data
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  avatar_url  TEXT,
  phone_number TEXT,
  country     TEXT,
  city        TEXT,
  bio         TEXT,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

CREATE TABLE IF NOT EXISTS user_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash     TEXT NOT NULL,
  ip_address     TEXT,
  user_agent     TEXT,
  device_type    TEXT,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id    ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- ============================================================
-- SECTION 11: Commerce tables (stubs for admin DB viewer)
-- ============================================================

CREATE TABLE IF NOT EXISTS airtime_purchases (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_number     TEXT NOT NULL,
  network          TEXT NOT NULL,
  amount           NUMERIC(12,4) NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  transaction_ref  TEXT,
  provider_ref     TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_airtime_purchases_user_id    ON airtime_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_airtime_purchases_created_at ON airtime_purchases(created_at DESC);

CREATE TABLE IF NOT EXISTS data_bundle_purchases (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_number     TEXT NOT NULL,
  network          TEXT NOT NULL,
  bundle_name      TEXT,
  amount           NUMERIC(12,4) NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  transaction_ref  TEXT,
  provider_ref     TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_data_bundle_purchases_user_id    ON data_bundle_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_data_bundle_purchases_created_at ON data_bundle_purchases(created_at DESC);

-- ============================================================
-- SECTION 12: service_status + service_status_audit
-- (includes all columns from 031, 032 scripts + admin PATCH route)
-- ============================================================

CREATE TABLE IF NOT EXISTS service_status (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key             VARCHAR(50) UNIQUE NOT NULL,
  service_name            VARCHAR(100) NOT NULL,
  description             TEXT,
  is_coming_soon          BOOLEAN NOT NULL DEFAULT false,
  coming_soon_message     TEXT DEFAULT 'This service is coming soon. Stay tuned!',
  expected_launch_date    DATE,
  is_enabled              BOOLEAN NOT NULL DEFAULT true,
  is_maintenance          BOOLEAN NOT NULL DEFAULT false,
  maintenance_message     TEXT DEFAULT 'This service is temporarily under maintenance. Please check back shortly.',
  maintenance_starts_at   TIMESTAMPTZ,
  maintenance_ends_at     TIMESTAMPTZ,
  maintenance_auto_resume BOOLEAN NOT NULL DEFAULT false,
  display_order           INTEGER NOT NULL DEFAULT 0,
  icon_name               VARCHAR(50),
  updated_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_service_status_service_key    ON service_status(service_key);
CREATE INDEX IF NOT EXISTS idx_service_status_is_enabled     ON service_status(is_enabled);
CREATE INDEX IF NOT EXISTS idx_service_status_is_coming_soon ON service_status(is_coming_soon);
CREATE INDEX IF NOT EXISTS idx_service_status_is_maintenance ON service_status(is_maintenance);
CREATE INDEX IF NOT EXISTS idx_service_status_display_order  ON service_status(display_order ASC);

CREATE TABLE IF NOT EXISTS service_status_audit (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_status_id  UUID REFERENCES service_status(id) ON DELETE CASCADE,
  service_key        VARCHAR(50) NOT NULL,
  action             VARCHAR(50) NOT NULL,
  old_values         JSONB,
  new_values         JSONB,
  changed_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address         VARCHAR(45),
  user_agent         TEXT
);
CREATE INDEX IF NOT EXISTS idx_service_status_audit_service_id  ON service_status_audit(service_status_id);
CREATE INDEX IF NOT EXISTS idx_service_status_audit_service_key ON service_status_audit(service_key);
CREATE INDEX IF NOT EXISTS idx_service_status_audit_changed_at  ON service_status_audit(changed_at DESC);

-- trigger to keep updated_at current
CREATE OR REPLACE FUNCTION update_service_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_service_status_updated_at ON service_status;
CREATE TRIGGER trigger_service_status_updated_at
  BEFORE UPDATE ON service_status
  FOR EACH ROW
  EXECUTE FUNCTION update_service_status_updated_at();

-- ============================================================
-- SECTION 13: Homepage content tables
-- (homepage_services, homepage_faqs, homepage_testimonials,
--  navigation_links)
-- ============================================================

CREATE TABLE IF NOT EXISTS homepage_services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  href        VARCHAR(500) NOT NULL,
  label       VARCHAR(100) NOT NULL,
  icon        VARCHAR(100) NOT NULL DEFAULT 'Wifi',
  priority    INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_homepage_services_active   ON homepage_services(is_active, priority DESC);

CREATE TABLE IF NOT EXISTS homepage_faqs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  priority    INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_homepage_faqs_active ON homepage_faqs(is_active, priority ASC);

CREATE TABLE IF NOT EXISTS homepage_testimonials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand       VARCHAR(255) NOT NULL,
  quote       TEXT NOT NULL,
  name        VARCHAR(255) NOT NULL,
  role        VARCHAR(255) NOT NULL,
  priority    INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_homepage_testimonials_active ON homepage_testimonials(is_active, priority ASC);

CREATE TABLE IF NOT EXISTS navigation_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label       VARCHAR(100) NOT NULL,
  href        VARCHAR(500) NOT NULL,
  description TEXT,
  icon        VARCHAR(100),
  parent_id   UUID REFERENCES navigation_links(id) ON DELETE CASCADE,
  priority    INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_navigation_links_active ON navigation_links(is_active, priority ASC);
CREATE INDEX IF NOT EXISTS idx_navigation_links_parent ON navigation_links(parent_id);
