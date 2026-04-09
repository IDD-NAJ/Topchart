-- Complete Reseller Functionality Migration
-- Creates all missing tables for full reseller functionality

-- 1. Fraud Alerts Table
CREATE TABLE IF NOT EXISTS fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES reseller_profiles(id),
    user_id UUID REFERENCES users(id),
    alert_type VARCHAR(50),
    severity VARCHAR(20),
    description TEXT,
    evidence JSONB,
    status VARCHAR(20) DEFAULT 'open',
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Audit Logs Table
CREATE TABLE IF NOT EXISTS reseller_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES reseller_profiles(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Rate Limiting Table
CREATE TABLE IF NOT EXISTS rate_limit_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES reseller_profiles(id),
    action_type VARCHAR(50),
    violation_count INTEGER,
    time_window VARCHAR(20),
    blocked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Suspicious Transactions
CREATE TABLE IF NOT EXISTS suspicious_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID,
    reseller_id UUID REFERENCES reseller_profiles(id),
    reason VARCHAR(100),
    confidence_score DECIMAL(3,2),
    auto_blocked BOOLEAN DEFAULT false,
    admin_reviewed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Result Checker Cards Table
CREATE TABLE IF NOT EXISTS result_checker_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_type VARCHAR(50) NOT NULL,
    card_pin VARCHAR(100) NOT NULL UNIQUE,
    serial_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'available',
    purchase_price DECIMAL(10, 2),
    selling_price DECIMAL(10, 2) NOT NULL,
    wholesale_price DECIMAL(10, 2),
    expiry_date DATE,
    purchased_by UUID REFERENCES users(id),
    purchased_at TIMESTAMP,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Result Checker Purchases
CREATE TABLE IF NOT EXISTS result_checker_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    card_id UUID REFERENCES result_checker_cards(id),
    exam_type VARCHAR(50),
    amount_paid DECIMAL(10, 2),
    payment_reference VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Reseller Inventory
CREATE TABLE IF NOT EXISTS reseller_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
    card_id UUID REFERENCES result_checker_cards(id),
    cost_price DECIMAL(10, 2),
    selling_price DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'available',
    sold_to VARCHAR(100),
    sold_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Reseller Geographic Stats
CREATE TABLE IF NOT EXISTS reseller_geographic_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
    region VARCHAR(100),
    city VARCHAR(100),
    customer_count INTEGER DEFAULT 0,
    total_sales DECIMAL(12, 2) DEFAULT 0.00,
    last_sale_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. Add referred_by column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by VARCHAR(50);

-- 10. Create indexes
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_reseller ON fraud_alerts(reseller_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_reseller ON reseller_audit_logs(reseller_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_reseller ON suspicious_transactions(reseller_id);
CREATE INDEX IF NOT EXISTS idx_result_cards_status ON result_checker_cards(status);
CREATE INDEX IF NOT EXISTS idx_result_cards_exam ON result_checker_cards(exam_type);
CREATE INDEX IF NOT EXISTS idx_reseller_inventory_reseller ON reseller_inventory(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_inventory_status ON reseller_inventory(status);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

-- 11. Seed default result checker cards (10 cards each type)
INSERT INTO result_checker_cards (exam_type, card_pin, serial_number, selling_price, wholesale_price, status)
SELECT 
    'WAEC',
    'WAEC' || LPAD(i::text, 8, '0'),
    'SN-WAEC-' || LPAD(i::text, 6, '0'),
    50.00,
    35.00,
    'available'
FROM generate_series(1, 10) i
WHERE NOT EXISTS (SELECT 1 FROM result_checker_cards WHERE exam_type = 'WAEC' LIMIT 1);

INSERT INTO result_checker_cards (exam_type, card_pin, serial_number, selling_price, wholesale_price, status)
SELECT 
    'BECE',
    'BECE' || LPAD(i::text, 8, '0'),
    'SN-BECE-' || LPAD(i::text, 6, '0'),
    40.00,
    28.00,
    'available'
FROM generate_series(1, 10) i
WHERE NOT EXISTS (SELECT 1 FROM result_checker_cards WHERE exam_type = 'BECE' LIMIT 1);

INSERT INTO result_checker_cards (exam_type, card_pin, serial_number, selling_price, wholesale_price, status)
SELECT 
    'NOVDEC',
    'NOVD' || LPAD(i::text, 8, '0'),
    'SN-NOVD-' || LPAD(i::text, 6, '0'),
    55.00,
    40.00,
    'available'
FROM generate_series(1, 10) i
WHERE NOT EXISTS (SELECT 1 FROM result_checker_cards WHERE exam_type = 'NOVDEC' LIMIT 1);

-- 12. Seed marketing assets if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketing_assets') THEN
        INSERT INTO marketing_assets (name, type, url, is_active)
        SELECT * FROM (VALUES
            ('Reseller Banner 1', 'banner', 'https://placehold.co/800x400/006994/white?text=Topchart+Reseller', true),
            ('Reseller Banner 2', 'banner', 'https://placehold.co/800x400/00a67e/white?text=Earn+Commission', true),
            ('Reseller Flyer 1', 'flyer', 'https://placehold.co/400x600/006994/white?text=Join+Now', true),
            ('Reseller Flyer 2', 'flyer', 'https://placehold.co/400x600/00a67e/white?text=Start+Earning', true)
        ) AS v(name, type, url, is_active)
        WHERE NOT EXISTS (SELECT 1 FROM marketing_assets LIMIT 1);
    END IF;
END $$;

-- 13. Reseller Referral Links table (ensure exists with clicks/conversions)
CREATE TABLE IF NOT EXISTS reseller_referral_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),
    landing_page VARCHAR(255) DEFAULT '/register',
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_links_reseller ON reseller_referral_links(reseller_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON reseller_referral_links(referral_code);
