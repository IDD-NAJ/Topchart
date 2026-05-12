-- Reseller Tiers Table
CREATE TABLE IF NOT EXISTS reseller_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    min_sales_amount DECIMAL(12, 2),
    min_referrals INTEGER,
    commission_rate DECIMAL(5, 2),
    discount_rate DECIMAL(5, 2),
    bonus_amount DECIMAL(10, 2),
    perks JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO reseller_tiers (name, display_name, min_sales_amount, min_referrals, commission_rate, discount_rate, bonus_amount, perks)
VALUES 
    ('BRONZE', 'Bronze Reseller', 0, 0, 5.00, 5.00, 0, '["basic_support"]'),
    ('SILVER', 'Silver Reseller', 5000, 10, 7.00, 8.00, 100, '["priority_support", "monthly_bonus"]'),
    ('GOLD', 'Gold Reseller', 20000, 50, 10.00, 12.00, 500, '["priority_support", "dedicated_manager", "early_access"]'),
    ('PLATINUM', 'Platinum Reseller', 100000, 200, 15.00, 15.00, 2000, '["all_perks", "custom_branding", "api_access", "wholesale_partnership"]')
ON CONFLICT (name) DO NOTHING;

-- Marketing Assets Table
CREATE TABLE IF NOT EXISTS marketing_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    category VARCHAR(50),
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    dimensions VARCHAR(50),
    file_size INTEGER,
    download_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reseller Referral Links Table
CREATE TABLE IF NOT EXISTS reseller_referral_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    landing_page VARCHAR(100) DEFAULT '/register',
    utm_source VARCHAR(50),
    utm_medium VARCHAR(50),
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Daily Reseller Stats
CREATE TABLE IF NOT EXISTS reseller_daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sales_count INTEGER DEFAULT 0,
    sales_amount DECIMAL(12, 2) DEFAULT 0,
    commission_earned DECIMAL(12, 2) DEFAULT 0,
    new_referrals INTEGER DEFAULT 0,
    inventory_sold INTEGER DEFAULT 0,
    UNIQUE(reseller_id, date)
);

-- Geographic Sales Data
CREATE TABLE IF NOT EXISTS reseller_geographic_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
    region VARCHAR(100),
    city VARCHAR(100),
    sales_count INTEGER DEFAULT 0,
    sales_amount DECIMAL(12, 2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tiers_name ON reseller_tiers(name);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON reseller_referral_links(referral_code);
CREATE INDEX IF NOT EXISTS idx_daily_stats_reseller ON reseller_daily_stats(reseller_id);
CREATE INDEX IF NOT EXISTS idx_geo_stats_reseller ON reseller_geographic_stats(reseller_id);
