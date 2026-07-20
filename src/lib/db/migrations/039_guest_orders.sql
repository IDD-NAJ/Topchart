-- Migration: Guest Orders (checkout without login)
-- Created: 2026-07-20

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS guest_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Public tracking number shown to customer (e.g. TCG-20260720-ABCD)
  tracking_number TEXT NOT NULL UNIQUE,

  -- Paystack payment
  paystack_reference TEXT UNIQUE,
  paystack_webhook_data JSONB,

  -- Customer info
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,

  -- Product details
  product_type TEXT NOT NULL,           -- data_bundle | airtime | bill_payment | esim | foreign_number
  product_details JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Pricing
  amount_ghs NUMERIC(12,4) NOT NULL,

  -- Statuses
  payment_status TEXT NOT NULL DEFAULT 'pending',        -- pending | success | failed | abandoned
  fulfillment_status TEXT NOT NULL DEFAULT 'pending',    -- pending | processing | completed | failed

  -- DataMart fulfillment (for data bundles)
  datamart_order_reference TEXT,
  datamart_purchase_id TEXT,
  datamart_order_status TEXT,

  -- Admin notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guest_orders_tracking ON guest_orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_guest_orders_paystack_ref ON guest_orders(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_guest_orders_email ON guest_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_guest_orders_payment_status ON guest_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_guest_orders_fulfillment_status ON guest_orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_guest_orders_product_type ON guest_orders(product_type);
CREATE INDEX IF NOT EXISTS idx_guest_orders_created_at ON guest_orders(created_at DESC);
