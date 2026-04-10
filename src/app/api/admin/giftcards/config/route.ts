import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    const configs = await sql`
      SELECT id, reloadly_product_id, is_enabled, custom_markup_percentage,
             min_denomination, max_denomination, restricted_to_resellers, notes, created_at, updated_at
      FROM giftcard_product_configs
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      success: true,
      data: {
        configs: configs.map((config: any) => ({
          id: config.id,
          reloadlyProductId: config.reloadly_product_id,
          isEnabled: config.is_enabled,
          customMarkupPercentage: config.custom_markup_percentage,
          minDenomination: config.min_denomination,
          maxDenomination: config.max_denomination,
          restrictedToResellers: config.restricted_to_resellers,
          notes: config.notes,
          createdAt: config.created_at,
          updatedAt: config.updated_at,
        })),
      },
    });
  } catch (error) {
    console.error("Admin giftcard config GET error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    const body = await request.json();
    const {
      reloadlyProductId,
      isEnabled = true,
      customMarkupPercentage,
      minDenomination,
      maxDenomination,
      restrictedToResellers = false,
      notes,
    } = body;

    if (!reloadlyProductId) {
      return NextResponse.json({ success: false, error: "Missing reloadlyProductId" }, { status: 400 });
    }

    const existing = await sql`
      SELECT id FROM giftcard_product_configs WHERE reloadly_product_id = ${reloadlyProductId}
    `;

    let result;
    if (existing.length > 0) {
      result = await sql`
        UPDATE giftcard_product_configs
        SET is_enabled = ${isEnabled},
            custom_markup_percentage = ${customMarkupPercentage || null},
            min_denomination = ${minDenomination || null},
            max_denomination = ${maxDenomination || null},
            restricted_to_resellers = ${restrictedToResellers},
            notes = ${notes || null},
            updated_at = NOW()
        WHERE reloadly_product_id = ${reloadlyProductId}
        RETURNING id
      `;
    } else {
      result = await sql`
        INSERT INTO giftcard_product_configs (
          reloadly_product_id, is_enabled, custom_markup_percentage,
          min_denomination, max_denomination, restricted_to_resellers, notes
        ) VALUES (
          ${reloadlyProductId}, ${isEnabled}, ${customMarkupPercentage || null},
          ${minDenomination || null}, ${maxDenomination || null}, ${restrictedToResellers}, ${notes || null}
        ) RETURNING id
      `;
    }

    return NextResponse.json({
      success: true,
      data: { id: result[0].id },
    });
  } catch (error) {
    console.error("Admin giftcard config POST error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
