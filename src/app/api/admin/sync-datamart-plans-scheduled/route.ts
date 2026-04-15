import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getNetworks, getDataPlans } from "@/lib/datamart";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get("x-cron-secret");
  
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    let syncedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    const networksResult = await getNetworks();
    if (!networksResult.success || !networksResult.data) {
      return NextResponse.json(
        { success: false, error: networksResult.error || "Failed to fetch networks from DataMart" },
        { status: 502 }
      );
    }

    const networks = networksResult.data;
    
    for (const network of networks) {
      try {
        const plansResult = await getDataPlans(network.id);
        if (!plansResult.success || !plansResult.data) {
          errorCount++;
          errors.push(`Failed to fetch plans for network ${network.name}: ${plansResult.error}`);
          continue;
        }

        const plans = plansResult.data;

        for (const plan of plans) {
          try {
            const planName = plan.data_plan || "Unknown Plan";
            const planAmount = parseFloat(plan.plan_amount || "0");
            const monthValidate = plan.month_validate || "";
            
            let validityHours: number | null = null;
            let validityDays: number | null = null;
            let validity = monthValidate;

            if (monthValidate) {
              const match = monthValidate.match(/(\d+)\s*(hour|hr|day|week|month)/i);
              if (match) {
                const value = parseInt(match[1]);
                const unit = match[2].toLowerCase();
                if (unit.includes("hour")) validityHours = value;
                else if (unit.includes("day")) validityDays = value;
                else if (unit.includes("week")) validityDays = value * 7;
                else if (unit.includes("month")) validityDays = value * 30;
              }
            }

            const existingBundle = await sql`
              SELECT id FROM data_bundles 
              WHERE datamart_plan_id = ${plan.id}
              LIMIT 1
            `;

            if (existingBundle.length > 0) {
              await sql`
                UPDATE data_bundles
                SET 
                  name = ${planName},
                  validity = ${validity},
                  validity_hours = ${validityHours},
                  validity_days = ${validityDays},
                  price = ${planAmount},
                  original_price = ${planAmount},
                  datamart_plan_type = ${plan.plan_type || null},
                  metadata = ${JSON.stringify(plan)},
                  synced_at = NOW(),
                  updated_at = NOW()
                WHERE id = ${existingBundle[0].id}
              `;
            } else {
              await sql`
                INSERT INTO data_bundles (
                  network_id,
                  network,
                  name,
                  validity,
                  validity_hours,
                  validity_days,
                  price,
                  original_price,
                  datamart_plan_id,
                  datamart_plan_type,
                  metadata,
                  synced_at
                ) VALUES (
                  ${network.id},
                  ${network.name},
                  ${planName},
                  ${validity},
                  ${validityHours},
                  ${validityDays},
                  ${planAmount},
                  ${planAmount},
                  ${plan.id},
                  ${plan.plan_type || null},
                  ${JSON.stringify(plan)},
                  NOW()
                )
              `;
            }
            syncedCount++;
          } catch (planError) {
            errorCount++;
            errors.push(`Failed to sync plan ${plan.id}: ${planError instanceof Error ? planError.message : String(planError)}`);
          }
        }
      } catch (networkError) {
        errorCount++;
        errors.push(`Failed to process network ${network.name}: ${networkError instanceof Error ? networkError.message : String(networkError)}`);
      }
    }

    await sql`
      UPDATE data_bundles
      SET is_active = FALSE
      WHERE synced_at < NOW() - INTERVAL '7 days'
    `;

    return NextResponse.json({
      success: true,
      message: `Scheduled sync completed. Synced ${syncedCount} plans, ${errorCount} errors.`,
      syncedCount,
      errorCount,
      errors: errors.slice(0, 10)
    });
  } catch (error) {
    console.error("Scheduled sync error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
