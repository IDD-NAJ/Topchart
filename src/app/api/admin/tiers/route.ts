import { NextRequest, NextResponse } from "next/server";
import { sql, sqlUnsafe } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - List all tiers
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }

    const tiers = await sql`
      SELECT * FROM reseller_tiers
      ORDER BY min_sales_amount ASC
    `;

    return NextResponse.json({
      success: true,
      tiers
    });
  } catch (error) {
    console.error("Admin tiers GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update a tier
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }

    const body = await request.json();
    const { id, min_sales_amount, min_referrals, commission_rate, discount_rate, bonus_amount, perks } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Tier ID is required" },
        { status: 400 }
      );
    }

    const updated = await sql`
      UPDATE reseller_tiers
      SET 
        min_sales_amount = ${min_sales_amount},
        min_referrals = ${min_referrals},
        commission_rate = ${commission_rate},
        discount_rate = ${discount_rate},
        bonus_amount = ${bonus_amount},
        perks = ${JSON.stringify(perks)}
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      tier: updated[0]
    });
  } catch (error) {
    console.error("Admin tiers PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
