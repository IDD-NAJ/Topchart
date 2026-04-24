import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getDataPackages, getNetworkDisplayName, type DatamartNetworkCode } from "@/lib/datamart";

export const runtime = "nodejs";

const NETWORK_CODES: DatamartNetworkCode[] = ["YELLO", "TELECEL", "AT_PREMIUM"];

const DATAMART_TO_DB_NETWORK: Record<string, string> = {
  YELLO: "MTN",
  TELECEL: "VODAFONE",
  AT_PREMIUM: "AIRTELTIGO",
  at: "AIRTELTIGO",
};

export async function GET(request: NextRequest) {
  // Support both Vercel Cron (Authorization: Bearer) and custom header (x-cron-secret)
  const authHeader = request.headers.get("authorization");
  const cronSecretHeader = request.headers.get("x-cron-secret");
  const cronSecret = process.env.CRON_SECRET;
  
  // Validate: either Authorization: Bearer <secret> or x-cron-secret: <secret>
  const isValidAuth = 
    (authHeader && cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (cronSecretHeader && cronSecret && cronSecretHeader === cronSecret);
  
  if (!cronSecret || !isValidAuth) {
    console.error("[Datamart Sync] Unauthorized cron request");
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  console.log("[Datamart Sync] Starting scheduled sync...");

  try {
    let syncedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    const networkRows = await sql`SELECT id, code FROM networks`;
    const networkIdMap: Record<string, string> = {};
    for (const row of networkRows) {
      networkIdMap[row.code] = row.id;
    }

    const categoryRows = await sql`SELECT id, "networkId", name FROM data_bundle_categories`;
    const categoryMap: Record<string, string> = {};
    for (const row of categoryRows) {
      categoryMap[row.networkId] = row.id;
    }

    for (const code of NETWORK_CODES) {
      try {
        const plansResult = await getDataPackages(code);
        if (!plansResult.success || !plansResult.data) {
          errorCount++;
          errors.push(`Failed to fetch packages for ${code}: ${plansResult.error}`);
          continue;
        }

        const packages_ = plansResult.data;
        const displayName = getNetworkDisplayName(code);
        const dbNetworkCode = DATAMART_TO_DB_NETWORK[code];
        const dbNetworkId = networkIdMap[dbNetworkCode];

        if (!dbNetworkId) {
          errorCount++;
          errors.push(`No DB network for ${code} (mapped to ${dbNetworkCode})`);
          continue;
        }

        let categoryId = categoryMap[dbNetworkId];
        if (!categoryId) {
          const catResult = await sql`
            INSERT INTO data_bundle_categories (id, "networkId", name, "updatedAt")
            VALUES (${crypto.randomUUID()}, ${dbNetworkId}, ${'Data Bundles'}, NOW())
            RETURNING id
          `;
          categoryId = catResult[0]?.id;
          if (categoryId) categoryMap[dbNetworkId] = categoryId;
        }

        for (const pkg of packages_) {
          try {
            const mb = parseInt(pkg.mb, 10);
            const providerPrice = parseFloat(pkg.price);
            const planName = `${pkg.capacity}GB ${displayName}`;
            const bundleId = `dm_${code}_${pkg.capacity}gb`;
            const validityHours = 90 * 24;

            await sql`
              INSERT INTO data_bundles (id, "networkId", "categoryId", name, "sizeMb", "validityHours", price, "isPopular", "isActive", "updatedAt")
              VALUES (${bundleId}, ${dbNetworkId}, ${categoryId}, ${planName}, ${mb}, ${validityHours}, ${providerPrice}, false, ${pkg.inStock}, NOW())
              ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                "sizeMb" = EXCLUDED."sizeMb",
                "validityHours" = EXCLUDED."validityHours",
                price = EXCLUDED.price,
                "isActive" = EXCLUDED."isActive",
                "updatedAt" = NOW()
            `;

            syncedCount++;
          } catch (planError) {
            errorCount++;
            errors.push(`Failed to sync ${code}_${pkg.capacity}GB: ${planError instanceof Error ? planError.message : String(planError)}`);
          }
        }
      } catch (networkError) {
        errorCount++;
        errors.push(`Failed to process ${code}: ${networkError instanceof Error ? networkError.message : String(networkError)}`);
      }
    }

    console.log(`[Datamart Sync] Completed. Synced: ${syncedCount}, Errors: ${errorCount}`);
    
    return NextResponse.json({
      success: true,
      message: `Scheduled sync completed. Synced ${syncedCount} plans, ${errorCount} errors.`,
      syncedCount,
      errorCount,
      errors: errors.slice(0, 10),
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Scheduled sync error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
