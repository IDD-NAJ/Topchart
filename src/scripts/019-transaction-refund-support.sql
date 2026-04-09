-- Migration: Add Refund Support for Transactions
-- This migration adds 'refunded' status to the transactions table

-- 1. Update the status check constraint to include 'refunded'
-- First, we need to drop the existing constraint and recreate it

-- Check if the constraint exists and update it
DO $$
BEGIN
    -- For newer tables that might already have this
    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
    
    -- Add the updated constraint with 'refunded' included
    ALTER TABLE transactions 
    ADD CONSTRAINT transactions_status_check 
    CHECK (status IN ('pending', 'success', 'failed', 'refunded'));
    
    -- Also update reseller_applications payment_status to include 'refunded'
    ALTER TABLE reseller_applications 
    DROP CONSTRAINT IF EXISTS reseller_applications_payment_status_check;
    
    ALTER TABLE reseller_applications 
    ADD CONSTRAINT reseller_applications_payment_status_check 
    CHECK (payment_status IN ('pending', 'paid', 'refunded', 'waived'));
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint update skipped: %', SQLERRM;
END $$;

-- 2. Add refund metadata columns to transactions if not exists
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- 3. Create index for refunded status queries
CREATE INDEX IF NOT EXISTS idx_transactions_refunded 
ON transactions(status) 
WHERE status = 'refunded';

-- 4. Create index for transaction type and status combination
CREATE INDEX IF NOT EXISTS idx_transactions_type_status 
ON transactions(type, status);

-- 5. Create a view for refunded transactions summary
CREATE OR REPLACE VIEW refunded_transactions_summary AS
SELECT 
    t.id,
    t.user_id,
    t.amount,
    t.refund_amount,
    t.refunded_at,
    t.refund_reason,
    t.reference,
    t.metadata,
    u.email as user_email,
    u.first_name,
    u.last_name,
    ra.id as application_id,
    ra.business_name
FROM transactions t
LEFT JOIN users u ON u.id = t.user_id
LEFT JOIN reseller_applications ra ON ra.id::text = (t.metadata->>'application_id')::text
WHERE t.status = 'refunded';

-- 6. Create function to handle refund and update wallet
CREATE OR REPLACE FUNCTION process_refund(
    p_transaction_id UUID,
    p_admin_id UUID,
    p_reason TEXT DEFAULT 'Admin initiated refund'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_transaction RECORD;
    v_user_id UUID;
    v_amount DECIMAL(12, 2);
BEGIN
    -- Get transaction details
    SELECT * INTO v_transaction 
    FROM transactions 
    WHERE id = p_transaction_id AND status = 'success';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction not found or not eligible for refund';
    END IF;
    
    v_user_id := v_transaction.user_id;
    v_amount := v_transaction.amount;
    
    -- Update transaction status
    UPDATE transactions
    SET status = 'refunded',
        refunded_at = NOW(),
        refund_amount = v_amount,
        refund_reason = p_reason,
        metadata = metadata || jsonb_build_object(
            'refunded_by', p_admin_id,
            'refund_processed_at', NOW()
        ),
        updated_at = NOW()
    WHERE id = p_transaction_id;
    
    -- Create audit log entry
    INSERT INTO reseller_audit_logs (
        user_id,
        action,
        details,
        created_at
    ) VALUES (
        p_admin_id,
        'transaction_refund',
        jsonb_build_object(
            'transaction_id', p_transaction_id,
            'user_id', v_user_id,
            'amount', v_amount,
            'reason', p_reason
        ),
        NOW()
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Refund failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to confirm payment and auto-approve
CREATE OR REPLACE FUNCTION confirm_reseller_payment(
    p_transaction_id UUID,
    p_admin_id UUID,
    p_reason TEXT DEFAULT 'Manual payment confirmation'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_transaction RECORD;
    v_application_id UUID;
    v_user_id UUID;
BEGIN
    -- Get transaction details
    SELECT * INTO v_transaction 
    FROM transactions 
    WHERE id = p_transaction_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction not found or not pending';
    END IF;
    
    v_user_id := v_transaction.user_id;
    v_application_id := (v_transaction.metadata->>'application_id')::UUID;
    
    -- Update transaction status
    UPDATE transactions
    SET status = 'success',
        metadata = metadata || jsonb_build_object(
            'confirmed_by', p_admin_id,
            'confirmed_at', NOW(),
            'confirmation_reason', p_reason
        ),
        updated_at = NOW()
    WHERE id = p_transaction_id;
    
    -- Update application if exists
    IF v_application_id IS NOT NULL THEN
        UPDATE reseller_applications
        SET payment_status = 'paid',
            application_status = 'approved',
            paid_at = NOW(),
            updated_at = NOW()
        WHERE id = v_application_id;
        
        -- Upgrade user role
        UPDATE users
        SET role = 'RESELLER',
            updated_at = NOW()
        WHERE id = v_user_id;
        
        -- Create reseller profile if not exists
        INSERT INTO resellers (
            user_id,
            reseller_code,
            tier_id,
            status,
            total_sales,
            total_referrals,
            total_commission_earned,
            commission_balance,
            created_at,
            updated_at
        )
        SELECT 
            v_user_id,
            'RSL' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 8),
            (SELECT id FROM reseller_tiers WHERE name = 'BRONZE' LIMIT 1),
            'active',
            0, 0, 0, 0,
            NOW(), NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM resellers WHERE user_id = v_user_id
        );
    END IF;
    
    -- Create audit log entry
    INSERT INTO reseller_audit_logs (
        user_id,
        action,
        details,
        created_at
    ) VALUES (
        p_admin_id,
        'payment_confirmation',
        jsonb_build_object(
            'transaction_id', p_transaction_id,
            'user_id', v_user_id,
            'application_id', v_application_id,
            'amount', v_transaction.amount,
            'reason', p_reason
        ),
        NOW()
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Payment confirmation failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

SELECT 'Transaction refund support migration completed' as status;
