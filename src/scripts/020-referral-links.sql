-- Referral Links Table
CREATE TABLE IF NOT EXISTS referral_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES reseller_profiles(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    landing_page VARCHAR(255) DEFAULT '/register',
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_links_reseller ON referral_links(reseller_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(code);
CREATE INDEX IF NOT EXISTS idx_referral_links_active ON referral_links(is_active);

-- Add new fields to reseller_profiles for enhanced features
ALTER TABLE reseller_profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE reseller_profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE reseller_profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE reseller_profiles ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE reseller_profiles ADD COLUMN IF NOT EXISTS security_score INTEGER DEFAULT 0;
ALTER TABLE reseller_profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- User Security Table
CREATE TABLE IF NOT EXISTS user_security (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    two_factor_enabled BOOLEAN DEFAULT false,
    password_strength VARCHAR(20),
    last_password_change TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP
);

-- Index for user_security
CREATE INDEX IF NOT EXISTS idx_user_security_locked ON user_security(locked_until) WHERE locked_until IS NOT NULL;
