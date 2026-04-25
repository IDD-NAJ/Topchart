-- Reseller Applications Table
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
    application_status VARCHAR(20) DEFAULT 'pending',
    application_fee DECIMAL(10, 2) DEFAULT 100.00,
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_reference VARCHAR(100),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reseller Profiles Table
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
);

-- Reseller Sales Table
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
);

-- Reseller Commission Table
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
);

-- Result Checker Cards Table
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

-- Result Checker Purchases
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

-- Reseller Inventory
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reseller_applications_user ON reseller_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_reseller_applications_status ON reseller_applications(application_status);
CREATE INDEX IF NOT EXISTS idx_reseller_profiles_user ON reseller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_reseller_profiles_code ON reseller_profiles(reseller_code);
CREATE INDEX IF NOT EXISTS idx_reseller_sales_reseller ON reseller_sales(reseller_id);
CREATE INDEX IF NOT EXISTS idx_result_cards_status ON result_checker_cards(status);
CREATE INDEX IF NOT EXISTS idx_result_cards_exam ON result_checker_cards(exam_type);
CREATE INDEX IF NOT EXISTS idx_reseller_inventory_reseller ON reseller_inventory(reseller_id);
