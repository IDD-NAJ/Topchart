-- Migration: Add bill_providers table for dynamic bill payment catalog
-- Created: 2026-04-20

CREATE TABLE IF NOT EXISTS bill_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Receipt',
  color TEXT,
  account_label TEXT NOT NULL,
  account_placeholder TEXT,
  min_amount DECIMAL(10,2) NOT NULL DEFAULT 1,
  max_amount DECIMAL(10,2) NOT NULL DEFAULT 5000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bill_providers_active ON bill_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_bill_providers_category ON bill_providers(category);

INSERT INTO bill_providers (id, name, category, icon, color, account_label, account_placeholder, min_amount, max_amount, is_active, sort_order) VALUES
('ecg-prepaid', 'ECG Prepaid', 'electricity', 'Zap', 'text-yellow-600 bg-yellow-50', 'Meter Number', 'e.g., 1234567890', 10, 500, true, 1),
('ecg-postpaid', 'ECG Postpaid', 'electricity', 'Zap', 'text-yellow-600 bg-yellow-50', 'Account Number', 'e.g., 9876543210', 10, 5000, true, 2),
('dstv', 'DSTV', 'tv', 'Tv', 'text-blue-600 bg-blue-50', 'Smart Card Number', 'e.g., 2012345678', 25, 500, true, 3),
('gotv', 'GOtv', 'tv', 'Tv', 'text-orange-600 bg-orange-50', 'ICU Number', 'e.g., 2012345678', 20, 300, true, 4),
('gwcl', 'Ghana Water (GWCL)', 'water', 'Droplets', 'text-cyan-600 bg-cyan-50', 'Account Number', 'e.g., 1234567', 10, 1000, true, 5),
('mtn-fibre', 'MTN Fibre', 'internet', 'Wifi', 'text-[#FFC300] bg-yellow-50', 'Account Number', 'e.g., 024XXXXXXX', 50, 500, true, 6),
('vodafone-broadband', 'Telecel Broadband', 'internet', 'Wifi', 'text-red-600 bg-red-50', 'Account Number', 'e.g., 020XXXXXXX', 50, 500, true, 7)
ON CONFLICT (id) DO NOTHING;
