-- Migration: DataMart order tracking tables
-- Created: 2026-04-30

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS datamart_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  network TEXT NOT NULL,
  capacity TEXT NOT NULL,
  price NUMERIC(12,4),
  gateway TEXT NOT NULL DEFAULT 'wallet',
  status TEXT NOT NULL DEFAULT 'pending',
  order_reference TEXT UNIQUE,
  transaction_reference TEXT,
  purchase_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  balance_before NUMERIC(12,4),
  balance_after NUMERIC(12,4),
  processing_method TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  error_code TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_datamart_orders_status ON datamart_orders(status);
CREATE INDEX IF NOT EXISTS idx_datamart_orders_order_ref ON datamart_orders(order_reference);
CREATE INDEX IF NOT EXISTS idx_datamart_orders_created_at ON datamart_orders(created_at DESC);

CREATE TABLE IF NOT EXISTS datamart_bulk_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  total INTEGER NOT NULL DEFAULT 0,
  successful INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  total_charged NUMERIC(12,4),
  shortfall NUMERIC(12,4),
  wallet_balance NUMERIC(12,4),
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_datamart_bulk_batches_status ON datamart_bulk_batches(status);
CREATE INDEX IF NOT EXISTS idx_datamart_bulk_batches_created_at ON datamart_bulk_batches(created_at DESC);

CREATE TABLE IF NOT EXISTS datamart_bulk_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES datamart_bulk_batches(id) ON DELETE CASCADE,
  ref TEXT,
  phone_number TEXT NOT NULL,
  network TEXT NOT NULL,
  capacity TEXT NOT NULL,
  price NUMERIC(12,4),
  status TEXT NOT NULL DEFAULT 'pending',
  purchase_id TEXT,
  order_reference TEXT,
  transaction_reference TEXT,
  balance_before NUMERIC(12,4),
  balance_after NUMERIC(12,4),
  error_code TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_datamart_bulk_items_batch_id ON datamart_bulk_order_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_datamart_bulk_items_status ON datamart_bulk_order_items(status);
CREATE INDEX IF NOT EXISTS idx_datamart_bulk_items_order_ref ON datamart_bulk_order_items(order_reference);

CREATE TABLE IF NOT EXISTS datamart_webhook_logs (
  id BIGSERIAL PRIMARY KEY,
  event TEXT,
  order_reference TEXT,
  payload JSONB NOT NULL,
  signature TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_datamart_webhook_logs_order_ref ON datamart_webhook_logs(order_reference);
CREATE INDEX IF NOT EXISTS idx_datamart_webhook_logs_created_at ON datamart_webhook_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS datamart_data_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network TEXT NOT NULL,
  capacity TEXT NOT NULL,
  mb INTEGER NOT NULL,
  price NUMERIC(12,4) NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_datamart_data_packages_network_capacity
  ON datamart_data_packages(network, capacity);
CREATE INDEX IF NOT EXISTS idx_datamart_data_packages_fetched_at
  ON datamart_data_packages(fetched_at DESC);

GRANT ALL ON TABLE datamart_orders TO authenticator;
GRANT ALL ON TABLE datamart_bulk_batches TO authenticator;
GRANT ALL ON TABLE datamart_bulk_order_items TO authenticator;
GRANT ALL ON TABLE datamart_webhook_logs TO authenticator;
GRANT ALL ON TABLE datamart_data_packages TO authenticator;
