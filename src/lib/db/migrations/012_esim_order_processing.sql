-- Migration: Add fields for manual eSIM order processing
-- Created: 2026-04-22

-- Add fields for manual order processing to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS delivery_details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES users(id);

-- Create indexes for order processing
CREATE INDEX IF NOT EXISTS idx_transactions_processing_status ON transactions(processing_status);
CREATE INDEX IF NOT EXISTS idx_transactions_processed_by ON transactions(processed_by);
