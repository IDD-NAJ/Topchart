import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TableResult {
  table_name: string;
  status: "created" | "existed" | "failed";
  message: string;
}

export async function POST() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  const results: TableResult[] = [];
  let successCount = 0;
  let failedCount = 0;

  try {
    // Create audit_logs table
    try {
      const exists = await sql`SELECT to_regclass('public.audit_logs')`;
      if (exists[0].to_regclass) {
        results.push({
          table_name: "audit_logs",
          status: "existed",
          message: "Table already exists",
        });
      } else {
        await sql`
          CREATE TABLE audit_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id),
            action VARCHAR(255) NOT NULL,
            resource_type VARCHAR(255),
            resource_id UUID,
            details JSONB,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `;
        await sql`CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id)`;
        await sql`CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at)`;
        results.push({
          table_name: "audit_logs",
          status: "created",
          message: "Table created successfully",
        });
        successCount++;
      }
    } catch (err) {
      results.push({
        table_name: "audit_logs",
        status: "failed",
        message: String(err).substring(0, 100),
      });
      failedCount++;
    }

    // Create service_status table
    try {
      const exists = await sql`SELECT to_regclass('public.service_status')`;
      if (exists[0].to_regclass) {
        results.push({
          table_name: "service_status",
          status: "existed",
          message: "Table already exists",
        });
      } else {
        await sql`
          CREATE TABLE service_status (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            service_key VARCHAR(100) UNIQUE NOT NULL,
            service_name VARCHAR(255) NOT NULL,
            description TEXT,
            is_coming_soon BOOLEAN DEFAULT FALSE,
            coming_soon_message TEXT,
            expected_launch_date DATE,
            is_enabled BOOLEAN DEFAULT TRUE,
            is_maintenance BOOLEAN DEFAULT FALSE,
            maintenance_message TEXT,
            display_order INT DEFAULT 0,
            icon_name VARCHAR(50),
            maintenance_starts_at TIMESTAMP,
            maintenance_ends_at TIMESTAMP,
            maintenance_auto_resume BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            updated_by UUID
          )
        `;
        await sql`CREATE INDEX idx_service_status_key ON service_status(service_key)`;
        results.push({
          table_name: "service_status",
          status: "created",
          message: "Table created successfully",
        });
        successCount++;
      }
    } catch (err) {
      results.push({
        table_name: "service_status",
        status: "failed",
        message: String(err).substring(0, 100),
      });
      failedCount++;
    }

    // Create notifications table
    try {
      const exists = await sql`SELECT to_regclass('public.notifications')`;
      if (exists[0].to_regclass) {
        results.push({
          table_name: "notifications",
          status: "existed",
          message: "Table already exists",
        });
      } else {
        await sql`
          CREATE TABLE notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(50) DEFAULT 'info',
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            action_url TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `;
        await sql`CREATE INDEX idx_notifications_user_id ON notifications(user_id)`;
        await sql`CREATE INDEX idx_notifications_created_at ON notifications(created_at)`;
        results.push({
          table_name: "notifications",
          status: "created",
          message: "Table created successfully",
        });
        successCount++;
      }
    } catch (err) {
      results.push({
        table_name: "notifications",
        status: "failed",
        message: String(err).substring(0, 100),
      });
      failedCount++;
    }

    // Create referral_settings table (singleton settings)
    try {
      const exists = await sql`SELECT to_regclass('public.referral_settings')`;
      if (exists[0].to_regclass) {
        results.push({
          table_name: "referral_settings",
          status: "existed",
          message: "Table already exists",
        });
      } else {
        await sql`
          CREATE TABLE referral_settings (
            id SERIAL PRIMARY KEY,
            referral_reward_amount DECIMAL(10, 2) DEFAULT 5.00,
            min_referrals_required INT DEFAULT 10,
            min_deposit_amount DECIMAL(10, 2) DEFAULT 20.00,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `;
        await sql`
          INSERT INTO referral_settings (id, referral_reward_amount, min_referrals_required, min_deposit_amount)
          VALUES (1, 5.00, 10, 20.00)
          ON CONFLICT (id) DO NOTHING
        `;
        results.push({
          table_name: "referral_settings",
          status: "created",
          message: "Table created successfully with defaults",
        });
        successCount++;
      }
    } catch (err) {
      results.push({
        table_name: "referral_settings",
        status: "failed",
        message: String(err).substring(0, 100),
      });
      failedCount++;
    }

    // Create promo_codes table
    try {
      const exists = await sql`SELECT to_regclass('public.promo_codes')`;
      if (exists[0].to_regclass) {
        results.push({
          table_name: "promo_codes",
          status: "existed",
          message: "Table already exists",
        });
      } else {
        await sql`
          CREATE TABLE promo_codes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(50) UNIQUE NOT NULL,
            discount_type VARCHAR(20),
            discount_value DECIMAL(10, 2),
            usage_limit INT,
            usage_count INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `;
        await sql`CREATE INDEX idx_promo_codes_code ON promo_codes(code)`;
        results.push({
          table_name: "promo_codes",
          status: "created",
          message: "Table created successfully",
        });
        successCount++;
      }
    } catch (err) {
      results.push({
        table_name: "promo_codes",
        status: "failed",
        message: String(err).substring(0, 100),
      });
      failedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Database repair complete: ${successCount} tables created/verified, ${failedCount} failed`,
      results,
      summary: {
        created: results.filter((r) => r.status === "created").length,
        existed: results.filter((r) => r.status === "existed").length,
        failed: results.filter((r) => r.status === "failed").length,
      },
    });
  } catch (error) {
    console.error("[Repair Database] Fatal error:", error);
    return NextResponse.json(
      { success: false, error: "Database repair failed", results },
      { status: 500 }
    );
  }
}
