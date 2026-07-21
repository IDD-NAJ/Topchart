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

    let tiers: any[] = [];
    try {
      tiers = await sql`
        SELECT * FROM reseller_tiers
        ORDER BY min_sales_amount ASC
      `;
    } catch (dbError: any) {
      const msg = String(dbError?.message || "");
      if (msg.includes("does not exist") || msg.includes("relation") || msg.includes("undefined_table")) {
        return NextResponse.json({ success: true, tiers: [] });
      }
      throw dbError;
    }

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

// POST - Create a new tier
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }

    const body = await request.json();
    const { name, display_name, min_sales_amount, min_referrals, commission_rate, discount_rate, bonus_amount, perks } = body;

    if (!name || !display_name) {
      return NextResponse.json(
        { success: false, error: "Name and display_name are required" },
        { status: 400 }
      );
    }

    const newTier = await sql`
      INSERT INTO reseller_tiers (
        name, display_name, min_sales_amount, min_referrals, 
        commission_rate, discount_rate, bonus_amount, perks
      ) VALUES (
        ${name}, ${display_name}, ${min_sales_amount || 0}, ${min_referrals || 0},
        ${commission_rate || 0}, ${discount_rate || 0}, ${bonus_amount || 0}, 
        ${JSON.stringify(perks || [])}
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      tier: newTier[0]
    });
  } catch (error) {
    console.error("Admin tiers POST error:", error);
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
