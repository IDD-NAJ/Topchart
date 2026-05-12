import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const params = await context.params;
    const { code } = params;

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Reseller code is required" },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT
        r.id,
        r.business_name,
        r.business_address,
        r.business_phone,
        r.reseller_code,
        COALESCE(rt.name, 'BRONZE') as tier_name,
        r.status,
        r.total_sales::numeric,
        r.commission_rate::numeric,
        r.total_referrals::int,
        u.email as business_email
      FROM reseller_profiles r
      LEFT JOIN reseller_tiers rt ON rt.name = (
        SELECT CASE
          WHEN COALESCE(r.total_sales, 0) >= 100000 THEN 'PLATINUM'
          WHEN COALESCE(r.total_sales, 0) >= 20000 THEN 'GOLD'
          WHEN COALESCE(r.total_sales, 0) >= 5000 THEN 'SILVER'
          ELSE 'BRONZE'
        END
      )
      LEFT JOIN users u ON u.id = r.user_id
      WHERE r.reseller_code = ${code}
        AND r.status = 'active'
      LIMIT 1
    `;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Reseller not found" },
        { status: 404 }
      );
    }

    // Return limited public info
    const reseller = rows[0];
    const publicProfile = {
      id: reseller.id,
      business_name: reseller.business_name,
      business_address: reseller.business_address,
      business_phone: reseller.business_phone,
      reseller_code: reseller.reseller_code,
      tier_name: reseller.tier_name,
      status: reseller.status,
      total_sales: reseller.total_sales,
      commission_rate: reseller.commission_rate,
      total_referrals: reseller.total_referrals,
    };

    return NextResponse.json(
      { success: true, profile: publicProfile },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Public reseller API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
