-- Update existing transaction amounts to use effective prices from database
-- This migration updates data transaction amounts to use effective prices
-- calculated from price_override and markup_percent fields

-- First, let's see what needs to be updated
SELECT 
  t.id,
  t.amount as current_amount,
  t.reference,
  t.metadata->>'capacity' as capacity,
  db.price as provider_price,
  db.price_override,
  db.markup_percent,
  CASE 
    WHEN db.price_override IS NOT NULL AND db.price_override > 0 THEN db.price_override
    WHEN db.markup_percent IS NOT NULL AND db.markup_percent > 0 
      THEN ROUND(db.price + (db.price * db.markup_percent / 100), 2)
    ELSE db.price
  END as effective_price
FROM transactions t
LEFT JOIN data_bundles db ON t.metadata->>'capacity' = db.datamart_plan_id
WHERE t.type = 'data'
  AND t.status = 'success'
  AND t.metadata->>'capacity' IS NOT NULL
LIMIT 10;

-- Update transactions with effective prices
UPDATE transactions t
SET 
  amount = CASE 
    WHEN db.price_override IS NOT NULL AND db.price_override > 0 THEN db.price_override
    WHEN db.markup_percent IS NOT NULL AND db.markup_percent > 0 
      THEN ROUND(db.price + (db.price * db.markup_percent / 100), 2)
    ELSE db.price
  END,
  updated_at = NOW()
FROM data_bundles db
WHERE t.type = 'data'
  AND t.status = 'success'
  AND t.metadata->>'capacity' IS NOT NULL
  AND t.metadata->>'capacity' = db.datamart_plan_id
  AND t.amount != CASE 
    WHEN db.price_override IS NOT NULL AND db.price_override > 0 THEN db.price_override
    WHEN db.markup_percent IS NOT NULL AND db.markup_percent > 0 
      THEN ROUND(db.price + (db.price * db.markup_percent / 100), 2)
    ELSE db.price
  END;

-- Verify the update
SELECT 
  COUNT(*) as updated_transactions,
  AVG(amount) as avg_amount
FROM transactions t
WHERE t.type = 'data'
  AND t.status = 'success'
  AND t.metadata->>'capacity' IS NOT NULL;
