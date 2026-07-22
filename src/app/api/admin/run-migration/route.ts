export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { sql, sqlUnsafe } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const MIGRATION_KEY = "039-ensure-data-bundles-columns";

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json(
      { success: false, error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  const results: { statement: string; status: "ok" | "error"; error?: string }[] = [];

  async function exec(label: string, stmt: string) {
    try {
      await sqlUnsafe(stmt, []);
      results.push({ statement: label, status: "ok" });
    } catch (err: any) {
      results.push({ statement: label, status: "error", error: err?.message });
    }
  }

  // Ensure data_bundles camelCase columns exist
  await exec('add isActive column', `ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT TRUE`);
  await exec('add isPopular column', `ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "isPopular" BOOLEAN DEFAULT FALSE`);
  await exec('add sizeMb column', `ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "sizeMb" VARCHAR(50)`);
  await exec('add validityHours column', `ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "validityHours" INTEGER`);
  await exec('add updatedAt column', `ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
  await exec('add priceOverride column', `ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "priceOverride" DECIMAL(10,2)`);
  await exec('add markupPercent column', `ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "markupPercent" DECIMAL(5,2)`);
  await exec('add isFeatured column', `ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN DEFAULT FALSE`);
  await exec('add networkId FK column', `ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS "networkId" UUID REFERENCES networks(id) ON DELETE SET NULL`);
  await exec('add stock column', `ALTER TABLE data_bundles ADD COLUMN IF NOT EXISTS stock INTEGER`);

  // Sync snake_case -> camelCase
  await exec('sync isActive from is_active', `UPDATE data_bundles SET "isActive" = is_active WHERE "isActive" IS NULL AND is_active IS NOT NULL`);
  await exec('sync isPopular from is_popular', `UPDATE data_bundles SET "isPopular" = is_popular WHERE "isPopular" IS NULL AND is_popular IS NOT NULL`);
  await exec('sync sizeMb from size_mb', `UPDATE data_bundles SET "sizeMb" = size_mb WHERE "sizeMb" IS NULL AND size_mb IS NOT NULL`);
  await exec('sync validityHours from validity_hours', `UPDATE data_bundles SET "validityHours" = validity_hours WHERE "validityHours" IS NULL AND validity_hours IS NOT NULL`);
  await exec('sync updatedAt from updated_at', `UPDATE data_bundles SET "updatedAt" = updated_at WHERE "updatedAt" IS NULL AND updated_at IS NOT NULL`);

  // Create indexes
  await exec('create networkId index', `CREATE INDEX IF NOT EXISTS idx_data_bundles_network_id_uuid ON data_bundles("networkId")`);
  await exec('create isActive index', `CREATE INDEX IF NOT EXISTS idx_data_bundles_is_active_camel ON data_bundles("isActive")`);

  // Ensure verification_pricing_settings row exists
  try {
    await sql`
      INSERT INTO system_config (config_key, config_value, updated_at)
      VALUES (
        'verification_pricing_settings',
        '{"exchangeRate": 15.5, "defaultMarkup": 40, "minMarkup": null, "maxMarkup": null, "categoryDefaults": {"social_media": 40, "ecommerce_financial": 40, "professional_tools": 40, "streaming_entertainment": 40}, "pvadealsApiKey": ""}'::jsonb,
        NOW()
      )
      ON CONFLICT (config_key) DO NOTHING
    `;
    results.push({ statement: "seed verification_pricing_settings", status: "ok" });
  } catch (err: any) {
    results.push({ statement: "seed verification_pricing_settings", status: "error", error: err?.message });
  }

  // Ensure datamart_settings row exists
  try {
    await sql`
      INSERT INTO system_config (config_key, config_value, updated_at)
      VALUES (
        'datamart_settings',
        '{"apiKey": "", "baseUrl": "https://api.datamartgh.shop", "webhookUrl": "", "syncEnabled": false}'::jsonb,
        NOW()
      )
      ON CONFLICT (config_key) DO NOTHING
    `;
    results.push({ statement: "seed datamart_settings", status: "ok" });
  } catch (err: any) {
    results.push({ statement: "seed datamart_settings", status: "error", error: err?.message });
  }

  const errors = results.filter((r) => r.status === "error");
  const oks = results.filter((r) => r.status === "ok");

  return NextResponse.json({
    success: true,
    migration: MIGRATION_KEY,
    summary: { total: results.length, ok: oks.length, errors: errors.length },
    results,
  });
}
