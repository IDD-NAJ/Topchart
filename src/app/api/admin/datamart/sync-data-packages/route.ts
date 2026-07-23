export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { sql, sqlUnsafe } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { getDataPackages, resolveNetworkCode } from "@/lib/datamart";

const NETWORK_DISPLAY_MAP: Record<string, string> = {
  YELLO: "MTN",
  TELECEL: "Telecel",
  AT_PREMIUM: "AirtelTigo",
};

function displayName(code: string): string {
  return NETWORK_DISPLAY_MAP[code] || code;
}

function parseMb(capacity: string): number | null {
  if (!capacity) return null;
  const num = parseFloat(capacity);
  if (isNaN(num)) return null;
  const lower = capacity.toLowerCase();
  if (lower.includes("gb")) return Math.round(num * 1024);
  if (lower.includes("mb")) return Math.round(num);
  return Math.round(num); // Assume MB if no unit
}

function parsePrice(priceStr: string): number {
  const n = parseFloat(priceStr);
  return isNaN(n) ? 0 : n;
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json(
      { success: false, error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  const networks = ["YELLO", "TELECEL", "AT_PREMIUM"] as const;
  let totalInserted = 0;
  let totalUpdated = 0;
  const errors: string[] = [];

  for (const networkCode of networks) {
    try {
      const result = await getDataPackages(networkCode);
      if (!result.success || !result.data) {
        errors.push(`Failed to fetch packages for ${networkCode}: ${result.error}`);
        continue;
      }

      const packages = Array.isArray(result.data)
        ? result.data
        : Object.values(result.data as Record<string, unknown[]>).flat();

      for (const pkg of packages as any[]) {
        const capacity = String(pkg.capacity || pkg.mb || "");
        const priceStr = String(pkg.price || "0");
        const price = parsePrice(priceStr);
        const sizeMb = parseMb(capacity);
        const networkDisplay = displayName(networkCode);
        const planId = `${networkCode}_${capacity}`.replace(/\s+/g, "_").toLowerCase();
        const name = `${networkDisplay} ${capacity}`;

        try {
          // Try update first
          const existing = await sqlUnsafe(
            `SELECT id FROM data_bundles WHERE datamart_plan_id = $1 LIMIT 1`,
            [planId]
          );

          if ((existing as any[]).length > 0) {
            await sqlUnsafe(
              `UPDATE data_bundles SET
                price       = $1,
                size_mb     = $2,
                network     = $3,
                is_active   = $4,
                synced_at   = NOW(),
                updated_at  = NOW()
              WHERE datamart_plan_id = $5`,
              [price, sizeMb, networkDisplay, pkg.inStock !== false, planId]
            );
            totalUpdated++;
          } else {
            await sqlUnsafe(
              `INSERT INTO data_bundles (
                network, name, size_mb, price, original_price,
                is_active, is_popular,
                datamart_plan_id, datamart_plan_type,
                synced_at, created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5,
                true, false,
                $6, 'data_package',
                NOW(), NOW(), NOW()
              )`,
              [
                networkDisplay,
                name,
                sizeMb,
                price,
                price,
                planId,
              ]
            );
            totalInserted++;
          }
        } catch (err: any) {
          errors.push(`Error syncing ${planId}: ${err?.message}`);
        }
      }
    } catch (networkErr: any) {
      // Catch missing env var errors or any other issues from getDataPackages
      if (networkErr?.message?.includes("Missing required environment variables")) {
        return NextResponse.json({
          success: false,
          warning: "Datamart API not configured. Set required environment variables.",
        }, { status: 200 });
      }
      errors.push(`Network error for ${networkCode}: ${networkErr?.message}`);
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      inserted: totalInserted,
      updated: totalUpdated,
      errors: errors.length,
      errorMessages: errors.slice(0, 10),
    },
  });
}
