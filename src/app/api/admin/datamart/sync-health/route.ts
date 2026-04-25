import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql, sqlUnsafe } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const [syncStatus] = await sql`
      SELECT config_value, updated_at FROM system_config WHERE config_key = 'datamart_last_sync'
    ` as Array<{ config_value: string; updated_at: string }>;

    if (!syncStatus) {
      return NextResponse.json({
        success: true,
        data: {
          status: "never_synced",
          message: "No sync has been performed yet",
          lastSyncAt: null,
          lastSuccessfulSyncAt: null,
          totalActivePlans: 0,
          totalCategories: 0,
        },
      });
    }

    const parsed = JSON.parse(syncStatus.config_value || "{}");
    const lastSyncAt = parsed.syncedAt ? new Date(parsed.syncedAt) : null;
    const lastSuccessfulSyncAt = parsed.success ? lastSyncAt : null;
    const hoursSinceSync = lastSyncAt ? (Date.now() - lastSyncAt.getTime()) / (1000 * 60 * 60) : null;

    let totalActivePlans = 0;
    let totalCategories = 0;
    try {
      const [planCount] = await sqlUnsafe(
        `SELECT COUNT(*) as cnt FROM data_bundles WHERE COALESCE("isActive", is_active, true) = true`
      ) as Array<{ cnt: string }>;
      totalActivePlans = parseInt(planCount?.cnt || "0", 10);
    } catch {}

    try {
      const [catCount] = await sqlUnsafe(
        `SELECT COUNT(*) as cnt FROM data_bundle_categories`
      ) as Array<{ cnt: string }>;
      totalCategories = parseInt(catCount?.cnt || "0", 10);
    } catch {}

    let status: string;
    let message: string;
    if (!lastSyncAt) {
      status = "never_synced";
      message = "No sync has been performed yet";
    } else if (hoursSinceSync !== null && hoursSinceSync < 2) {
      status = "healthy";
      message = "Sync is recent and operational";
    } else if (hoursSinceSync !== null && hoursSinceSync < 24) {
      status = "degraded";
      message = `Last sync was ${Math.round(hoursSinceSync)}h ago — provider may be intermittent`;
    } else if (hoursSinceSync !== null && hoursSinceSync < 48) {
      status = "stale";
      message = `Last sync was ${Math.round(hoursSinceSync)}h ago — data may be outdated`;
    } else {
      status = "critical";
      message = hoursSinceSync !== null
        ? `Last sync was ${Math.round(hoursSinceSync!)}h ago — data is very stale, purchases may be restricted`
        : "Sync status unknown";
    }

    return NextResponse.json({
      success: true,
      data: {
        status,
        message,
        lastSyncAt: lastSyncAt?.toISOString() || null,
        lastSuccessfulSyncAt: lastSuccessfulSyncAt?.toISOString() || null,
        hoursSinceSync,
        lastSyncResult: {
          syncedCount: parsed.syncedCount || 0,
          errorCount: parsed.errorCount || 0,
          deactivatedCount: parsed.deactivatedCount || 0,
          priceChanges: parsed.priceChanges || 0,
          duration: parsed.duration || 0,
          success: parsed.success || false,
        },
        totalActivePlans,
        totalCategories,
        configUpdatedAt: syncStatus.updated_at,
      },
    });
  } catch (error) {
    console.error("[Sync Health] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sync health" },
      { status: 500 }
    );
  }
}
