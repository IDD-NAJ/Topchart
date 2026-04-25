-- Migration: Add description column to esim_phone_plans table
-- Created: 2026-04-22

ALTER TABLE esim_phone_plans 
ADD COLUMN IF NOT EXISTS description TEXT;
