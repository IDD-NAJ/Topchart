import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [syncStatus] = await sql`
      SELECT config_value FROM system_config WHERE config_key = 'datamart_last_sync'
    ` as Array<{ config_value: string }>;

    if (!syncStatus) {
      return NextResponse.json({
        success: true,
        data: { lastSyncAt: null, isStale: true, staleWarning: true },
      });
    }

    const parsed = JSON.parse(syncStatus.config_value || "{}");
    const lastSyncAt = parsed.syncedAt || null;
    const hoursSinceSync = lastSyncAt ? (Date.now() - new Date(lastSyncAt).getTime()) / (1000 * 60 * 60) : null;

    return NextResponse.json({
      success: true,
      data: {
        lastSyncAt,
        lastSuccessfulSyncAt: parsed.success ? lastSyncAt : null,
        isStale: hoursSinceSync === null || hoursSinceSync > 48,
        staleWarning: hoursSinceSync !== null && hoursSinceSync > 24 && hoursSinceSync <= 48,
        hoursSinceSync: hoursSinceSync !== null ? Math.round(hoursSinceSync * 10) / 10 : null,
        syncedCount: parsed.syncedCount || 0,
        errorCount: parsed.errorCount || 0,
      },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: { lastSyncAt: null, isStale: true, staleWarning: true },
    });
  }
}
