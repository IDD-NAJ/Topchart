import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { isPvadealsConfigured } from "@/lib/env";
import {
  getAllServices,
  getBalance,
  mapCategoryByName,
  DEFAULT_MARKUP_PERCENT,
} from "@/lib/pvadeals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  if (!isPvadealsConfigured()) {
    return NextResponse.json(
      { success: false, error: "PVAdeals API key is not configured. Set PVADEALS_API_KEY in your environment." },
      { status: 503 }
    );
  }

  try {
    const pvaResult = await getAllServices();

    if (!pvaResult.success || !pvaResult.data) {
      return NextResponse.json(
        { success: false, error: pvaResult.error || "Failed to fetch services from PVADeals" },
        { status: 502 }
      );
    }

    const services = pvaResult.data.services;
    let synced = 0;
    let skipped = 0;
    const skippedDetails: Array<{ name: string; error: string }> = [];

    for (const svc of services) {
      const category = mapCategoryByName(svc.name);
      try {
        await sql`
          INSERT INTO verification_services (
            pvadeals_service_id, name, category, picture_url, country,
            str_price, ltr3_price, ltr7_price, ltr14_price, ltr30_price,
            markup_percentage, is_active, created_at, updated_at
          ) VALUES (
            ${svc._id}, ${svc.name}, ${category},
            ${svc.picture}, ${svc.country},
            ${svc.STRprice}, ${svc.LTR3price}, ${svc.LTR7price},
            ${svc.LTR14price}, ${svc.LTR30price},
            ${DEFAULT_MARKUP_PERCENT}, true, NOW(), NOW()
          )
          ON CONFLICT (pvadeals_service_id) DO UPDATE SET
            name = EXCLUDED.name,
            picture_url = EXCLUDED.picture_url,
            country = EXCLUDED.country,
            str_price = EXCLUDED.str_price,
            ltr3_price = EXCLUDED.ltr3_price,
            ltr7_price = EXCLUDED.ltr7_price,
            ltr14_price = EXCLUDED.ltr14_price,
            ltr30_price = EXCLUDED.ltr30_price,
            updated_at = NOW()
        `;
        synced++;
      } catch (dbError) {
        skipped++;
        skippedDetails.push({
          name: svc.name,
          error: dbError instanceof Error ? dbError.message : String(dbError),
        });
      }
    }

    const syncedAt = new Date().toISOString();

    try {
      await sql`
        INSERT INTO system_config (config_key, config_value, updated_at)
        VALUES ('pvadeals_last_sync', ${JSON.stringify({ synced, skipped, syncedAt })}, NOW())
        ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value, updated_at = NOW()
      `;
    } catch {
      console.warn("[PVADeals Sync] Failed to update sync status in system_config");
    }

    return NextResponse.json({
      success: true,
      data: {
        total: services.length,
        synced,
        skipped,
        skippedDetails: skippedDetails.slice(0, 20),
        syncedAt,
        message: `Synced ${synced} services from PVADeals`,
      },
    });
  } catch (error) {
    console.error("PVADeals sync error:", error);
    return NextResponse.json({ success: false, error: "Sync failed" }, { status: 500 });
  }
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const [balanceResult, countResult, syncStatusResult] = await Promise.all([
      getBalance(),
      sql`SELECT COUNT(*) as count FROM verification_services WHERE is_active = true`.catch(() => [{ count: 0 }]),
      sql`SELECT value FROM system_config WHERE key = 'pvadeals_last_sync'`.catch(() => []),
    ]);

    let lastSync = null;
    if (syncStatusResult && syncStatusResult.length > 0) {
      try {
        lastSync = JSON.parse(syncStatusResult[0].value);
      } catch {
        lastSync = null;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        pvadeals_balance: balanceResult.success ? balanceResult.data?.credits ?? 0 : null,
        balance_error: balanceResult.success ? null : balanceResult.error,
        synced_services: Number((countResult as any[])[0]?.count ?? 0),
        last_sync: lastSync,
      },
    });
  } catch (error) {
    console.error("PVADeals status error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch status" }, { status: 500 });
  }
}
