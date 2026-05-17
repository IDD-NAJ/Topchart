import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
    }

    const steps: string[] = [];

    // ── Ticket enums ──────────────────────────────────────────
    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketStatus') THEN
        CREATE TYPE "TicketStatus" AS ENUM ('OPEN','IN_PROGRESS','RESOLVED','CLOSED');
      END IF;
    END $$`;
    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketPriority') THEN
        CREATE TYPE "TicketPriority" AS ENUM ('LOW','MEDIUM','HIGH','URGENT');
      END IF;
    END $$`;
    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketChannel') THEN
        CREATE TYPE "TicketChannel" AS ENUM ('EMAIL','CHAT','IN_APP');
      END IF;
    END $$`;
    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketSenderType') THEN
        CREATE TYPE "TicketSenderType" AS ENUM ('USER','ADMIN','SYSTEM');
      END IF;
    END $$`;

    await sql`
      CREATE TABLE IF NOT EXISTS tickets (
        id            TEXT PRIMARY KEY,
        "userId"      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject       TEXT NOT NULL,
        category      TEXT NOT NULL DEFAULT 'General',
        status        "TicketStatus"   NOT NULL DEFAULT 'OPEN',
        priority      "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
        channel       "TicketChannel"  NOT NULL DEFAULT 'IN_APP',
        "externalRef" TEXT,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_tickets_userId    ON tickets("userId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tickets_status    ON tickets(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tickets_createdAt ON tickets("createdAt" DESC)`;
    await sql`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'General'`;

    await sql`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id           TEXT PRIMARY KEY,
        "ticketId"   TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        "senderType" "TicketSenderType" NOT NULL DEFAULT 'USER',
        body         TEXT NOT NULL,
        attachments  JSONB NOT NULL DEFAULT '[]'::jsonb,
        "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticketId  ON ticket_messages("ticketId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ticket_messages_createdAt ON ticket_messages("createdAt" ASC)`;
    steps.push("tickets + ticket_messages tables ensured");

    // ── DisputeStatus enum + disputes table ───────────────────────────
    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DisputeStatus') THEN
        CREATE TYPE "DisputeStatus" AS ENUM ('OPEN','IN_PROGRESS','RESOLVED','CLOSED');
      END IF;
    END $$`;

    await sql`
      CREATE TABLE IF NOT EXISTS disputes (
        id              TEXT PRIMARY KEY,
        "transactionId" UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
        "userId"        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status          "DisputeStatus" NOT NULL DEFAULT 'OPEN',
        reason          TEXT,
        resolution      TEXT,
        "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "resolvedAt"    TIMESTAMPTZ
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_disputes_userId        ON disputes("userId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_disputes_transactionId ON disputes("transactionId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_disputes_status        ON disputes(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_disputes_createdAt     ON disputes("createdAt" DESC)`;
    steps.push("disputes table ensured");

    // ── faqs table (content API) ───────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS faqs (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question   TEXT NOT NULL,
        answer     TEXT NOT NULL,
        category   TEXT NOT NULL DEFAULT 'General',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active  BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active, sort_order ASC)`;
    steps.push("faqs table ensured");

    // ── smspva_availability cache table ───────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS smspva_availability (
        country_code TEXT NOT NULL,
        service_code TEXT NOT NULL,
        count        INTEGER NOT NULL DEFAULT 0,
        cost_usd     NUMERIC(10,4),
        cached_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (country_code, service_code)
      )
    `;
    steps.push("smspva_availability table ensured");

    // ── smspva_services (international services with admin overrides) ─
    await sql`
      CREATE TABLE IF NOT EXISTS smspva_services (
        service_code      TEXT PRIMARY KEY,
        name              TEXT NOT NULL,
        category          TEXT NOT NULL DEFAULT 'professional_tools',
        base_usd_price    NUMERIC(10,4) NOT NULL DEFAULT 0.10,
        is_active         BOOLEAN NOT NULL DEFAULT TRUE,
        markup_percentage NUMERIC(6,2) NOT NULL DEFAULT 40,
        picture_url       TEXT,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_smspva_services_active   ON smspva_services(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_smspva_services_category ON smspva_services(category)`;
    steps.push("smspva_services table ensured");

    await sql`
      CREATE TABLE IF NOT EXISTS reseller_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        business_name VARCHAR(255) NOT NULL,
        business_address TEXT,
        business_phone VARCHAR(20),
        business_email VARCHAR(255),
        business_type VARCHAR(50),
        id_type VARCHAR(50),
        id_number VARCHAR(100),
        id_document_url TEXT,
        custom_fields JSONB DEFAULT '{}'::jsonb,
        application_status VARCHAR(20) DEFAULT 'pending',
        application_fee DECIMAL(10, 2) DEFAULT 100.00,
        payment_status VARCHAR(20) DEFAULT 'pending',
        payment_reference VARCHAR(100),
        transaction_id UUID,
        reviewed_by UUID REFERENCES users(id),
        reviewed_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    steps.push("reseller_applications table ensured");

    await sql`ALTER TABLE reseller_applications ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb`;
    await sql`ALTER TABLE reseller_applications ADD COLUMN IF NOT EXISTS transaction_id UUID`;
    steps.push("reseller_applications columns patched");

    await sql`
      CREATE TABLE IF NOT EXISTS reseller_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        business_name VARCHAR(255) NOT NULL,
        business_address TEXT,
        business_phone VARCHAR(20),
        reseller_code VARCHAR(20) UNIQUE,
        commission_rate DECIMAL(5, 2) DEFAULT 5.00,
        discount_rate DECIMAL(5, 2) DEFAULT 10.00,
        wallet_balance DECIMAL(12, 2) DEFAULT 0.00,
        total_sales DECIMAL(12, 2) DEFAULT 0.00,
        total_commission_earned DECIMAL(12, 2) DEFAULT 0.00,
        total_referrals INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    steps.push("reseller_profiles table ensured");

    await sql`
      CREATE TABLE IF NOT EXISTS reseller_sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
        customer_phone VARCHAR(20),
        product_type VARCHAR(50),
        network VARCHAR(50),
        bundle_id UUID,
        amount DECIMAL(10, 2),
        cost_price DECIMAL(10, 2),
        selling_price DECIMAL(10, 2),
        profit DECIMAL(10, 2),
        status VARCHAR(20) DEFAULT 'pending',
        reference VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    steps.push("reseller_sales table ensured");

    await sql`
      CREATE TABLE IF NOT EXISTS reseller_commissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
        referred_user_id UUID REFERENCES users(id),
        transaction_id UUID,
        transaction_amount DECIMAL(10, 2),
        commission_amount DECIMAL(10, 2),
        commission_rate DECIMAL(5, 2),
        status VARCHAR(20) DEFAULT 'pending',
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    steps.push("reseller_commissions table ensured");

    await sql`
      CREATE TABLE IF NOT EXISTS system_config (
        id SERIAL PRIMARY KEY,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value JSONB NOT NULL,
        description TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_by UUID REFERENCES users(id)
      )
    `;
    steps.push("system_config table ensured");

    await sql`
      CREATE TABLE IF NOT EXISTS custom_form_fields (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        field_name VARCHAR(100) NOT NULL,
        field_label VARCHAR(200) NOT NULL,
        field_type VARCHAR(50) NOT NULL,
        field_options JSONB,
        is_required BOOLEAN DEFAULT false,
        is_enabled BOOLEAN DEFAULT true,
        placeholder TEXT,
        help_text TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    steps.push("custom_form_fields table ensured");

    await sql`
      INSERT INTO system_config (config_key, config_value, description) VALUES
      ('reseller_form_config', '{"business_name":{"enabled":true,"required":true},"business_address":{"enabled":true,"required":false},"business_phone":{"enabled":true,"required":false},"business_email":{"enabled":true,"required":false},"business_type":{"enabled":true,"required":false},"application_fee":100.00,"currency":"GHS","require_payment_before_approval":true}'::jsonb, 'Reseller application form configuration'),
      ('reseller_form_custom_fields', '[]'::jsonb, 'Custom fields for reseller application form')
      ON CONFLICT (config_key) DO NOTHING
    `;
    steps.push("system_config default rows seeded");

    await sql`
      CREATE TABLE IF NOT EXISTS homepage_media (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        section_key VARCHAR(120) NOT NULL,
        asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('image', 'video')),
        storage_path TEXT NOT NULL,
        public_url TEXT NOT NULL,
        alt_text TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_homepage_media_section_active_sort
      ON homepage_media(section_key, is_active, sort_order)
    `;
    await sql`
      INSERT INTO homepage_media (section_key, asset_type, storage_path, public_url, alt_text, sort_order, is_active, section, slot_key, media_type, file_url, priority) VALUES
      ('mtn_logo', 'image', 'seed/mtn-logo.svg', '/images/mtn-logo.svg', 'MTN logo', 1, TRUE, 'logo', 'mtn_logo', 'image', '/images/mtn-logo.svg', 1),
      ('telecel_logo', 'image', 'seed/telecel-logo.svg', '/images/telecel-logo.svg', 'Telecel logo', 2, TRUE, 'logo', 'telecel_logo', 'image', '/images/telecel-logo.svg', 2),
      ('airteltigo_logo', 'image', 'seed/airteltigo-logo.svg', '/images/airteltigo-logo.svg', 'AirtelTigo logo', 3, TRUE, 'logo', 'airteltigo_logo', 'image', '/images/airteltigo-logo.svg', 3),
      ('developer_community_image', 'image', 'seed/technical-partnership.jpg', '/images/technical-partnership.jpg', 'A user looking at code metrics', 4, TRUE, 'banner', 'developer_community_image', 'image', '/images/technical-partnership.jpg', 4),
      ('hero_background_video', 'image', 'seed/technical-partnership.jpg', '/images/technical-partnership.jpg', 'Hero section background image', 5, TRUE, 'hero', 'hero_background_video', 'image', '/images/technical-partnership.jpg', 5),
      ('scale_background_video', 'image', 'seed/topchart-way.jpg', '/images/topchart-way.jpg', 'Scale section background image', 6, TRUE, 'background', 'scale_background_video', 'image', '/images/topchart-way.jpg', 6),
      ('faq_hero_background', 'image', 'seed/topchart-way.jpg', '/images/topchart-way.jpg', 'FAQ hero background image', 7, TRUE, 'hero', 'faq_hero_background', 'image', '/images/topchart-way.jpg', 7),
      ('about_hero_background', 'image', 'seed/topchart-way.jpg', '/images/topchart-way.jpg', 'About hero background image', 8, TRUE, 'hero', 'about_hero_background', 'image', '/images/topchart-way.jpg', 8)
      ON CONFLICT DO NOTHING
    `;
    steps.push("homepage_media table created and seeded");

    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'homepage_media_section') THEN
        CREATE TYPE homepage_media_section AS ENUM ('hero', 'header', 'logo', 'banner', 'background', 'footer');
      END IF;
    END $$`;
    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'homepage_media_type') THEN
        CREATE TYPE homepage_media_type AS ENUM ('image', 'video');
      END IF;
    END $$`;
    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'homepage_media_storage_source') THEN
        CREATE TYPE homepage_media_storage_source AS ENUM ('local', 'supabase');
      END IF;
    END $$`;
    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'homepage_media_status') THEN
        CREATE TYPE homepage_media_status AS ENUM ('active', 'inactive', 'archived');
      END IF;
    END $$`;

    await sql`ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS section homepage_media_section`;
    await sql`ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS slot_key TEXT`;
    await sql`ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS media_type homepage_media_type`;
    await sql`ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS file_url TEXT`;
    await sql`ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS storage_source homepage_media_storage_source`;
    await sql`ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS file_name TEXT`;
    await sql`ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS mime_type TEXT`;
    await sql`ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS file_size INTEGER`;
    await sql`ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0`;
    await sql`ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS status homepage_media_status DEFAULT 'active'`;
    await sql`ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1`;
    await sql`ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS width INTEGER`;
    await sql`ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS height INTEGER`;
    await sql`ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS duration_seconds NUMERIC(10,2)`;
    await sql`ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS thumbnail_url TEXT`;

    await sql`UPDATE homepage_media SET slot_key = COALESCE(slot_key, section_key) WHERE slot_key IS NULL`;
    await sql`UPDATE homepage_media SET media_type = CASE WHEN asset_type IN ('image', 'video') THEN asset_type::homepage_media_type ELSE 'image'::homepage_media_type END WHERE media_type IS NULL`;
    await sql`UPDATE homepage_media SET file_url = COALESCE(file_url, public_url) WHERE file_url IS NULL`;
    await sql`UPDATE homepage_media SET priority = COALESCE(priority, sort_order, 0) WHERE priority IS NULL OR priority = 0`;
    await sql`UPDATE homepage_media SET status = CASE WHEN is_active = true THEN 'active'::homepage_media_status ELSE 'inactive'::homepage_media_status END WHERE status IS NULL`;
    await sql`UPDATE homepage_media SET section = CASE
      WHEN COALESCE(slot_key, section_key) IN ('hero_background_video', 'hero_background', 'hero_overlay_video', 'faq_hero_background', 'about_hero_background') THEN 'hero'::homepage_media_section
      WHEN COALESCE(slot_key, section_key) IN ('header_logo', 'header_background') THEN 'header'::homepage_media_section
      WHEN COALESCE(slot_key, section_key) IN ('mtn_logo', 'telecel_logo', 'airteltigo_logo', 'network_mtn_logo', 'network_telecel_logo', 'network_airteltigo_logo', 'main_logo', 'partner_logos') THEN 'logo'::homepage_media_section
      WHEN COALESCE(slot_key, section_key) IN ('developer_community_image', 'promo_banner_1', 'promo_banner_2') THEN 'banner'::homepage_media_section
      WHEN COALESCE(slot_key, section_key) IN ('scale_background_video', 'section_bg_1', 'section_bg_2') THEN 'background'::homepage_media_section
      ELSE 'footer'::homepage_media_section
    END WHERE section IS NULL`;

    await sql`DO $$ BEGIN
      ALTER TABLE homepage_media ALTER COLUMN section SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      UPDATE homepage_media SET section = 'footer'::homepage_media_section WHERE section IS NULL;
      ALTER TABLE homepage_media ALTER COLUMN section SET NOT NULL;
    END $$`;
    await sql`DO $$ BEGIN
      ALTER TABLE homepage_media ALTER COLUMN slot_key SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      UPDATE homepage_media SET slot_key = section_key WHERE slot_key IS NULL;
      ALTER TABLE homepage_media ALTER COLUMN slot_key SET NOT NULL;
    END $$`;
    await sql`DO $$ BEGIN
      ALTER TABLE homepage_media ALTER COLUMN media_type SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      UPDATE homepage_media SET media_type = 'image'::homepage_media_type WHERE media_type IS NULL;
      ALTER TABLE homepage_media ALTER COLUMN media_type SET NOT NULL;
    END $$`;
    await sql`DO $$ BEGIN
      ALTER TABLE homepage_media ALTER COLUMN file_url SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      UPDATE homepage_media SET file_url = public_url WHERE file_url IS NULL;
      ALTER TABLE homepage_media ALTER COLUMN file_url SET NOT NULL;
    END $$`;

    await sql`CREATE INDEX IF NOT EXISTS idx_homepage_media_section ON homepage_media(section)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_homepage_media_is_active ON homepage_media(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_homepage_media_section_active_priority ON homepage_media(section, is_active, priority)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_homepage_media_status ON homepage_media(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_homepage_media_section_slot_status ON homepage_media(section, slot_key, status)`;

    steps.push("homepage_media columns migrated (section, slot_key, media_type, file_url, status, version, etc.)");

    await sql`CREATE INDEX IF NOT EXISTS idx_reseller_applications_user ON reseller_applications(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reseller_applications_status ON reseller_applications(application_status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reseller_profiles_user ON reseller_profiles(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reseller_profiles_code ON reseller_profiles(reseller_code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key)`;
    steps.push("indexes created");

    await sql`
      CREATE TABLE IF NOT EXISTS reseller_tiers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        min_sales_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        min_referrals INTEGER NOT NULL DEFAULT 0,
        commission_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
        discount_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
        bonus_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        perks JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`
      INSERT INTO reseller_tiers (name, display_name, min_sales_amount, min_referrals, commission_rate, discount_rate, bonus_amount, perks) VALUES
        ('BRONZE',   'Bronze',   0,      0,  5.00,  10.00, 0,   '["Priority support","Basic marketing kit"]'::jsonb),
        ('SILVER',   'Silver',   5000,   5,  7.00,  12.00, 50,  '["Priority support","Extended marketing kit","Monthly bonus"]'::jsonb),
        ('GOLD',     'Gold',     20000,  20, 10.00, 15.00, 200, '["24/7 support","Full marketing kit","Quarterly bonus","Dedicated account manager"]'::jsonb),
        ('PLATINUM', 'Platinum', 100000, 50, 15.00, 20.00, 500, '["24/7 VIP support","Premium marketing kit","Monthly bonus","Dedicated account manager","Custom pricing"]'::jsonb)
      ON CONFLICT (name) DO NOTHING
    `;
    steps.push("reseller_tiers table seeded");

    await sql`
      CREATE TABLE IF NOT EXISTS marketing_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'image',
        category TEXT NOT NULL DEFAULT 'banner',
        file_url TEXT NOT NULL DEFAULT '',
        thumbnail_url TEXT,
        dimensions TEXT,
        file_size INTEGER NOT NULL DEFAULT 0,
        download_count INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    steps.push("marketing_assets table ensured");

    await sql`
      CREATE TABLE IF NOT EXISTS fraud_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID,
        user_id TEXT,
        alert_type TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'low',
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS rate_limit_violations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID,
        user_id TEXT,
        endpoint TEXT NOT NULL,
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS suspicious_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID,
        transaction_id TEXT,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    steps.push("fraud / security tables ensured");

    await sql`
      CREATE TABLE IF NOT EXISTS reseller_daily_stats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID NOT NULL,
        date DATE NOT NULL,
        sales_count INTEGER NOT NULL DEFAULT 0,
        sales_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        commission_earned DECIMAL(12,2) NOT NULL DEFAULT 0,
        new_referrals INTEGER NOT NULL DEFAULT 0,
        UNIQUE (reseller_id, date)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS reseller_geographic_stats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID NOT NULL,
        region TEXT NOT NULL DEFAULT '',
        city TEXT NOT NULL DEFAULT '',
        sales_count INTEGER NOT NULL DEFAULT 0,
        sales_amount DECIMAL(12,2) NOT NULL DEFAULT 0
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS reseller_referral_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID NOT NULL,
        referral_code TEXT NOT NULL UNIQUE,
        landing_page TEXT NOT NULL DEFAULT '/register',
        utm_source TEXT,
        utm_medium TEXT,
        clicks INTEGER NOT NULL DEFAULT 0,
        conversions INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS reseller_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID NOT NULL,
        action TEXT NOT NULL,
        details JSONB DEFAULT '{}'::jsonb,
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS reseller_inventory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reseller_id UUID NOT NULL,
        product_id TEXT NOT NULL,
        product_type TEXT NOT NULL DEFAULT 'airtime',
        quantity INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'available',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    steps.push("reseller analytics/inventory tables ensured");

    await sql`
      CREATE TABLE IF NOT EXISTS result_checker_cards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        exam_type TEXT NOT NULL,
        card_pin TEXT NOT NULL,
        serial_number TEXT NOT NULL,
        selling_price DECIMAL(10,2) NOT NULL,
        wholesale_price DECIMAL(10,2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'available',
        purchased_by TEXT,
        purchased_at TIMESTAMP,
        expiry_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS result_checker_purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        card_id UUID NOT NULL,
        exam_type TEXT NOT NULL,
        card_pin TEXT,
        serial_number TEXT,
        amount_paid DECIMAL(10,2) NOT NULL,
        payment_reference TEXT,
        status TEXT NOT NULL DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    steps.push("result checker tables ensured");

    await sql`
      CREATE TABLE IF NOT EXISTS verification_services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pvadeals_service_id VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        picture_url VARCHAR(500),
        country VARCHAR(10) DEFAULT 'US',
        is_active BOOLEAN DEFAULT TRUE,
        markup_percentage DECIMAL(5,2) DEFAULT 40.00,
        str_price DECIMAL(10,4) DEFAULT 0,
        ltr3_price DECIMAL(10,4) DEFAULT 0,
        ltr7_price DECIMAL(10,4) DEFAULT 0,
        ltr14_price DECIMAL(10,4) DEFAULT 0,
        ltr30_price DECIMAL(10,4) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS pvadeals_service_id VARCHAR(100)`;
    await sql`ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS picture_url VARCHAR(500)`;
    await sql`ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS country VARCHAR(10) DEFAULT 'US'`;
    await sql`ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS markup_percentage DECIMAL(5,2) DEFAULT 40.00`;
    await sql`ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS str_price DECIMAL(10,4) DEFAULT 0`;
    await sql`ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS ltr3_price DECIMAL(10,4) DEFAULT 0`;
    await sql`ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS ltr7_price DECIMAL(10,4) DEFAULT 0`;
    await sql`ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS ltr14_price DECIMAL(10,4) DEFAULT 0`;
    await sql`ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS ltr30_price DECIMAL(10,4) DEFAULT 0`;
    await sql`ALTER TABLE verification_services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;
    steps.push("verification_services table ensured");

    await sql`
      CREATE TABLE IF NOT EXISTS verification_numbers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        service_id UUID,
        number VARCHAR(20) NOT NULL,
        type VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        pvadeals_request_id VARCHAR(100) UNIQUE,
        ltr_duration_days INTEGER,
        allow_flag BOOLEAN DEFAULT TRUE,
        allow_reuse BOOLEAN DEFAULT FALSE,
        auto_renew BOOLEAN DEFAULT FALSE,
        purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        rental_duration_hours INTEGER DEFAULT 0,
        expires_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS pvadeals_request_id VARCHAR(100)`;
    await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2) DEFAULT 0`;
    await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS ltr_duration_days INTEGER`;
    await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS rental_duration_hours INTEGER DEFAULT 0`;
    await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS allow_flag BOOLEAN DEFAULT TRUE`;
    await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS allow_reuse BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE`;
    await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;
    await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb`;
    steps.push("verification_numbers table ensured");

    await sql`
      CREATE TABLE IF NOT EXISTS verification_sms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        number_id UUID NOT NULL,
        from_number VARCHAR(20),
        message TEXT NOT NULL,
        pvadeals_sms_id VARCHAR(100) UNIQUE,
        received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_read BOOLEAN DEFAULT FALSE
      )
    `;
    await sql`ALTER TABLE verification_sms ADD COLUMN IF NOT EXISTS from_number VARCHAR(20)`;
    await sql`ALTER TABLE verification_sms ADD COLUMN IF NOT EXISTS pvadeals_sms_id VARCHAR(100)`;
    await sql`ALTER TABLE verification_sms ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE`;
    steps.push("verification_sms table ensured");

    await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS verification_number_id UUID`;
    await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;
    await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'GHS'`;
    await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fees DECIMAL(12,2) DEFAULT 0`;
    await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS metadata JSONB`;
    await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)`;
    await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paystack_access_code VARCHAR(100)`;
    await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paystack_authorization_url TEXT`;
    await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_channel VARCHAR(50)`;
    await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE`;
    await sql`
      DO $$ BEGIN
        ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
      EXCEPTION WHEN others THEN NULL; END $$
    `;
    steps.push("transactions table patched for verification types");

    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL DEFAULT 'info',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT false,
        action_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false`;
    steps.push("notifications table ensured");

    await sql`
      CREATE TABLE IF NOT EXISTS seo_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        page_key VARCHAR(100) NOT NULL UNIQUE,
        title VARCHAR(255),
        meta_description TEXT,
        keywords TEXT,
        og_image_url TEXT,
        favicon_url TEXT,
        canonical_url TEXT,
        no_index BOOLEAN DEFAULT false,
        updated_by UUID,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    steps.push("seo_settings table ensured");

    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id UUID,
        details JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC)`;
    steps.push("audit_logs table ensured");

    // Networks table
    await sql`
      CREATE TABLE IF NOT EXISTS networks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL UNIQUE,
        prefixes JSONB NOT NULL DEFAULT '[]'::jsonb,
        min_amount NUMERIC(12,4) DEFAULT 0,
        max_amount NUMERIC(12,4) DEFAULT 10000,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_networks_code ON networks(code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_networks_active ON networks(is_active)`;
    steps.push("networks table ensured");

    // Referrals table
    await sql`
      CREATE TABLE IF NOT EXISTS referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referred_id UUID REFERENCES users(id) ON DELETE SET NULL,
        code TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status)`;
    steps.push("referrals table ensured");

    // Data bundle purchases table
    await sql`
      CREATE TABLE IF NOT EXISTS data_bundle_purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bundle_id TEXT NOT NULL,
        bundle_name TEXT,
        recipient_phone TEXT NOT NULL,
        network TEXT NOT NULL,
        amount NUMERIC(12,4) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded')),
        transaction_reference TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_data_bundle_purchases_user_id ON data_bundle_purchases(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_data_bundle_purchases_status ON data_bundle_purchases(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_data_bundle_purchases_created_at ON data_bundle_purchases(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_data_bundle_purchases_recipient_phone ON data_bundle_purchases(recipient_phone)`;
    steps.push("data_bundle_purchases table ensured");

    // Insert default networks
    const networksExist = await sql`SELECT COUNT(*) as count FROM networks`;
    if (networksExist[0].count === 0) {
      await sql`
        INSERT INTO networks (name, code, prefixes, min_amount, max_amount) VALUES
        ('MTN Ghana', 'mtn', '["024", "054", "055", "059", "020"]'::jsonb, 0.50, 1000),
        ('Vodafone/Telecel', 'vodafone', '["020", "050", "026"]'::jsonb, 0.50, 1000),
        ('AirtelTigo', 'airteltigo', '["026", "027", "028", "056", "057"]'::jsonb, 0.50, 1000),
        ('Glo Ghana', 'glo', '["023", "024", "025", "055", "056"]'::jsonb, 0.50, 1000)
        ON CONFLICT (code) DO NOTHING
      `;
      steps.push("default networks inserted");
    }

    return NextResponse.json({ success: true, steps });
  } catch (error) {
    console.error("Migration error:", error);
    const message = error instanceof Error ? error.message : "Migration failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
