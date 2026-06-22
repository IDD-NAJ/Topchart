-- Complete Database Fix for Topchart
-- Run this in Neon SQL Editor: https://console.neon.tech/app/projects/broad-star-48304937

-- =====================================================
-- PART 1: Create homepage content tables (if not exist)
-- =====================================================

-- 1. homepage_services table
CREATE TABLE IF NOT EXISTS homepage_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  href VARCHAR(500) NOT NULL,
  label VARCHAR(100) NOT NULL,
  icon VARCHAR(100) NOT NULL DEFAULT 'Wifi',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homepage_services_priority ON homepage_services(priority DESC);
CREATE INDEX IF NOT EXISTS idx_homepage_services_active ON homepage_services(is_active, priority DESC);

-- 2. homepage_faqs table
CREATE TABLE IF NOT EXISTS homepage_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homepage_faqs_priority ON homepage_faqs(priority DESC);
CREATE INDEX IF NOT EXISTS idx_homepage_faqs_active ON homepage_faqs(is_active, priority DESC);

-- 3. homepage_testimonials table
CREATE TABLE IF NOT EXISTS homepage_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand VARCHAR(255) NOT NULL,
  quote TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homepage_testimonials_priority ON homepage_testimonials(priority DESC);
CREATE INDEX IF NOT EXISTS idx_homepage_testimonials_active ON homepage_testimonials(is_active, priority DESC);

-- 4. navigation_links table
CREATE TABLE IF NOT EXISTS navigation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label VARCHAR(100) NOT NULL,
  href VARCHAR(500) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  parent_id UUID REFERENCES navigation_links(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_navigation_links_priority ON navigation_links(priority ASC);
CREATE INDEX IF NOT EXISTS idx_navigation_links_parent ON navigation_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_navigation_links_active ON navigation_links(is_active, priority ASC);

-- =====================================================
-- PART 2: Add missing columns to existing tables
-- =====================================================

-- Add sort_order to homepage_media
ALTER TABLE homepage_media ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add missing columns to service_status
ALTER TABLE service_status ADD COLUMN IF NOT EXISTS service_key VARCHAR(50);
ALTER TABLE service_status ADD COLUMN IF NOT EXISTS service_name VARCHAR(100);
ALTER TABLE service_status ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE service_status ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN DEFAULT FALSE;
ALTER TABLE service_status ADD COLUMN IF NOT EXISTS coming_soon_message TEXT;
ALTER TABLE service_status ADD COLUMN IF NOT EXISTS expected_launch_date DATE;
ALTER TABLE service_status ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE service_status ADD COLUMN IF NOT EXISTS is_maintenance BOOLEAN DEFAULT FALSE;
ALTER TABLE service_status ADD COLUMN IF NOT EXISTS maintenance_message TEXT;

-- =====================================================
-- PART 3: Grant permissions to authenticator role
-- =====================================================

GRANT SELECT ON homepage_services TO authenticator;
GRANT SELECT ON homepage_faqs TO authenticator;
GRANT SELECT ON homepage_testimonials TO authenticator;
GRANT SELECT ON navigation_links TO authenticator;
GRANT SELECT ON homepage_media TO authenticator;
GRANT SELECT ON service_status TO authenticator;

-- =====================================================
-- PART 4: Seed default data
-- =====================================================

-- Seed homepage_services
INSERT INTO homepage_services (title, description, href, label, icon, priority, is_active) VALUES
  ('Data Bundles', 'Affordable daily, weekly and monthly data packages for every network.', '/dashboard/data', 'Browse bundles', 'Wifi', 1, TRUE),
  ('Foreign Numbers', 'Temporary virtual numbers for OTP verification on any platform.', '/dashboard/verification', 'Get a number', 'PhoneCall', 2, TRUE),
  ('Result Checkers', 'WAEC, BECE, and NOVDEC results with your index number.', '/dashboard/result-checkers', 'Check results', 'GraduationCap', 3, TRUE),
  ('eSIM', 'Get a US phone number or travel data eSIM for 50+ countries.', '/dashboard/esim', 'Get eSIM', 'Smartphone', 4, TRUE),
  ('Proxies', 'Residential, mobile & datacenter proxies via 9Proxy.', '/dashboard/proxies', 'Get proxies', 'Shield', 5, TRUE),
  ('Gift Cards', 'Digital gift cards for Netflix, Amazon, Steam & more — delivered instantly.', '/dashboard/giftcards', 'Buy gift cards', 'Gift', 6, TRUE),
  ('Pay Bills', 'Electricity, TV, water & internet bill payments in Ghana.', '/dashboard/bills', 'Pay now', 'CreditCard', 7, TRUE),
  ('Reseller Program', 'Earn commissions reselling our services under your own brand.', '/dashboard/reseller', 'Become a reseller', 'Store', 8, TRUE)
ON CONFLICT DO NOTHING;

-- Seed homepage_faqs
INSERT INTO homepage_faqs (question, answer, priority, is_active) VALUES
  ('How fast is airtime and data delivery?', 'Most orders complete within seconds. Network congestion may occasionally add a short delay.', 1, TRUE),
  ('What payment methods are supported?', 'MTN MoMo, Telecel Cash, AirtelTigo Money, Visa, Mastercard, and wallet balance via Paystack.', 2, TRUE),
  ('How do Foreign Numbers work?', 'You rent a temporary number; OTP SMS appears in your dashboard in real time.', 3, TRUE)
ON CONFLICT DO NOTHING;

-- Seed homepage_testimonials
INSERT INTO homepage_testimonials (brand, quote, name, role, priority, is_active) VALUES
  ('North Ridge Fintech', 'Topchart cut our recharge turnaround to seconds. Wallet funding and reporting are exactly what we needed for ops.', 'Kwame A.', 'Head of Operations', 1, TRUE),
  ('Campus Hub GH', 'We sell data and airtime to students daily. Reliability and the reseller tools have been excellent.', 'Ama O.', 'Product Lead', 2, TRUE),
  ('VerifyPro Labs', 'Foreign Numbers for QA saved us from juggling personal SIMs. Support is responsive.', 'Kofi M.', 'Engineering Manager', 3, TRUE),
  ('Retail Collective', 'Airtime and data in one dashboard simplified payouts for our field teams.', 'Esi T.', 'Finance Director', 4, TRUE)
ON CONFLICT DO NOTHING;

-- Seed navigation_links
INSERT INTO navigation_links (label, href, description, icon, priority, is_active) VALUES
  ('Overview', '/dashboard', 'Balances, referrals, and activity', 'LayoutDashboard', 1, TRUE),
  ('Data bundles', '/dashboard/data', 'Plans for every need', 'Wifi', 2, TRUE),
  ('Foreign Numbers', '/dashboard/verification', 'Temporary numbers for SMS codes', 'PhoneCall', 3, TRUE),
  ('Result checkers', '/dashboard/result-checkers', 'Exam results and PINs', 'GraduationCap', 4, TRUE),
  ('eSIM', '/dashboard/esim', 'US phone numbers & travel data eSIMs', 'Smartphone', 5, TRUE),
  ('Proxies', '/dashboard/proxies', 'Residential, mobile & datacenter proxies', 'Shield', 6, TRUE),
  ('Gift Cards', '/dashboard/giftcards', 'Digital gift cards delivered instantly', 'Gift', 7, TRUE),
  ('Pay Bills', '/dashboard/bills', 'Electricity, TV, water & internet', 'CreditCard', 8, TRUE),
  ('Reseller', '/dashboard/reseller', 'Reseller program and tools', 'Store', 9, TRUE)
ON CONFLICT DO NOTHING;

-- =====================================================
-- PART 5: Add updated_at trigger function
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_homepage_services_updated_at ON homepage_services;
CREATE TRIGGER update_homepage_services_updated_at
    BEFORE UPDATE ON homepage_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_homepage_faqs_updated_at ON homepage_faqs;
CREATE TRIGGER update_homepage_faqs_updated_at
    BEFORE UPDATE ON homepage_faqs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_homepage_testimonials_updated_at ON homepage_testimonials;
CREATE TRIGGER update_homepage_testimonials_updated_at
    BEFORE UPDATE ON homepage_testimonials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_navigation_links_updated_at ON navigation_links;
CREATE TRIGGER update_navigation_links_updated_at
    BEFORE UPDATE ON navigation_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DONE! Verify with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'homepage_%' OR table_name = 'navigation_links';
-- =====================================================
