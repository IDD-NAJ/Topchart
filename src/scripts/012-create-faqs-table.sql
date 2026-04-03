-- Migration 012: Create FAQs table for FAQ page
-- Table: faqs

-- FAQs table for frequently asked questions
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'General',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_sort_order ON faqs(sort_order);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);

-- Trigger for updated_at on faqs
CREATE OR REPLACE FUNCTION update_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_faqs_updated_at ON faqs;
CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON faqs
    FOR EACH ROW
    EXECUTE FUNCTION update_faqs_updated_at();

-- Seed default FAQs (matching current hardcoded values)
INSERT INTO faqs (question, answer, category, sort_order, is_active) VALUES
('How fast is the delivery?', 'Most transactions are completed within 5 seconds. In rare cases of network delays, it may take up to 5 minutes.', 'Delivery', 1, TRUE),

('What payment methods do you accept?', 'We accept Mobile Money (MTN MoMo, Vodafone Cash, AirtelTigo Money), debit cards (Mastercard, Visa), and wallet balance.', 'Payments', 2, TRUE),

('Is my payment information secure?', 'Yes! We use bank-grade encryption and are PCI DSS compliant. We never store your card details.', 'Security', 3, TRUE),

('Can I get a refund?', 'If a transaction fails, your money is automatically refunded to your wallet within minutes.', 'Refunds', 4, TRUE),

('Which networks are supported?', 'We support all major Ghanaian networks: MTN, Telecel (formerly Vodafone), and AirtelTigo.', 'General', 5, TRUE),

('Is there a minimum recharge amount?', 'The minimum recharge amount is GHS 1 for airtime and data bundles.', 'General', 6, TRUE),

('Can I schedule recurring top-ups?', 'Yes! You can set up automatic recurring top-ups for airtime and data bundles in your dashboard.', 'General', 7, TRUE),

('What if I enter the wrong phone number?', 'Unfortunately, once a transaction is processed, we cannot reverse it. Please double-check the number before confirming.', 'General', 8, TRUE)
ON CONFLICT DO NOTHING;
