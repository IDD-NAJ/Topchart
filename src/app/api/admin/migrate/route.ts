import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
    }

    const steps: string[] = [];

    await sql`
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
        custom_fields JSONB DEFAULT '{}'::jsonb,
        application_status VARCHAR(20) DEFAULT 'pending',
        application_fee DECIMAL(10, 2) DEFAULT 100.00,
        payment_status VARCHAR(20) DEFAULT 'pending',
        payment_reference VARCHAR(100),
        transaction_id UUID,
        reviewed_by UUID REFERENCES users(id),
        reviewed_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    steps.push("reseller_applications table ensured");

    await sql`ALTER TABLE reseller_applications ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb`;
    await sql`ALTER TABLE reseller_applications ADD COLUMN IF NOT EXISTS transaction_id UUID`;
    steps.push("reseller_applications columns patched");

    await sql`
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
      )
    `;
    steps.push("reseller_profiles table ensured");

    await sql`
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
      )
    `;
    steps.push("reseller_sales table ensured");

    await sql`
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
      )
    `;
    steps.push("reseller_commissions table ensured");

    await sql`
      CREATE TABLE IF NOT EXISTS system_config (
        id SERIAL PRIMARY KEY,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value JSONB NOT NULL,
        description TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_by UUID REFERENCES users(id)
      )
    `;
    steps.push("system_config table ensured");

    await sql`
      CREATE TABLE IF NOT EXISTS custom_form_fields (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        field_name VARCHAR(100) NOT NULL,
        field_label VARCHAR(200) NOT NULL,
        field_type VARCHAR(50) NOT NULL,
        field_options JSONB,
        is_required BOOLEAN DEFAULT false,
        is_enabled BOOLEAN DEFAULT true,
        placeholder TEXT,
        help_text TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    steps.push("custom_form_fields table ensured");

    await sql`
      INSERT INTO system_config (config_key, config_value, description) VALUES
      ('reseller_form_config', '{"business_name":{"enabled":true,"required":true},"business_address":{"enabled":true,"required":false},"business_phone":{"enabled":true,"required":false},"business_email":{"enabled":true,"required":false},"business_type":{"enabled":true,"required":false},"application_fee":100.00,"currency":"GHS","require_payment_before_approval":true}'::jsonb, 'Reseller application form configuration'),
      ('reseller_form_custom_fields', '[]'::jsonb, 'Custom fields for reseller application form')
      ON CONFLICT (config_key) DO NOTHING
    `;
    steps.push("system_config default rows seeded");

    await sql`CREATE INDEX IF NOT EXISTS idx_reseller_applications_user ON reseller_applications(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reseller_applications_status ON reseller_applications(application_status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reseller_profiles_user ON reseller_profiles(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reseller_profiles_code ON reseller_profiles(reseller_code)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key)`;
    steps.push("indexes created");

    return NextResponse.json({ success: true, steps });
  } catch (error) {
    console.error("Migration error:", error);
    const message = error instanceof Error ? error.message : "Migration failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
