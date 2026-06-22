require('dotenv').config({ path: '.env' });
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

require('@neondatabase/serverless').neonConfig.webSocketConstructor = ws;

async function runMigration() {
  let connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  // Convert pooler URL to direct URL for schema changes (pooler has limited permissions)
  connectionString = connectionString.replace(/-pooler/g, '');

  const pool = new Pool({ connectionString });
  
  try {
    const migrationSQL = `
-- Migration 018: Create tables for homepage content (services, FAQs, testimonials, navigation)
-- This migration addresses hardcoded content in home-client.tsx and header.tsx

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

-- Seed initial data (from hardcoded values in home-client.tsx)

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

-- Seed navigation_links (from header.tsx serviceLinks)
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

-- Add updated_at trigger function (if not exists)
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
`;

    console.log('Running migration: 018_homepage_content_tables.sql...');
    await pool.query(migrationSQL);
    console.log('✅ Migration completed successfully!');
    
    // Verify tables were created
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('homepage_services', 'homepage_faqs', 'homepage_testimonials', 'navigation_links')
    `);
    
    console.log('\n📊 Created tables:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Count records
    const counts = await pool.query(`
      SELECT 'homepage_services' as table_name, COUNT(*) as count FROM homepage_services
      UNION ALL
      SELECT 'homepage_faqs', COUNT(*) FROM homepage_faqs
      UNION ALL
      SELECT 'homepage_testimonials', COUNT(*) FROM homepage_testimonials
      UNION ALL
      SELECT 'navigation_links', COUNT(*) FROM navigation_links
    `);
    
    console.log('\n📈 Seed data counts:');
    counts.rows.forEach(row => {
      console.log(`  - ${row.table_name}: ${row.count} records`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
