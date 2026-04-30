import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    // First, check what needs to be updated
    const checkResult = await sql`
      SELECT 
        t.id,
        t.amount as current_amount,
        t.reference,
        t.metadata->>'capacity' as capacity,
        db.price as provider_price,
        db.price_override,
        db.markup_percent,
        CASE 
          WHEN db.price_override IS NOT NULL AND db.price_override > 0 THEN db.price_override
          WHEN db.markup_percent IS NOT NULL AND db.markup_percent > 0 
            THEN ROUND(db.price + (db.price * db.markup_percent / 100), 2)
          ELSE db.price
        END as effective_price
      FROM transactions t
      LEFT JOIN data_bundles db ON t.metadata->>'capacity' = db.datamart_plan_id
      WHERE t.type = 'data'
        AND t.status = 'success'
        AND t.metadata->>'capacity' IS NOT NULL
      LIMIT 10
    `;

    // Update transactions with effective prices
    const updateResult = await sql`
      UPDATE transactions t
      SET 
        amount = CASE 
          WHEN db.price_override IS NOT NULL AND db.price_override > 0 THEN db.price_override
          WHEN db.markup_percent IS NOT NULL AND db.markup_percent > 0 
            THEN ROUND(db.price + (db.price * db.markup_percent / 100), 2)
          ELSE db.price
        END,
        updated_at = NOW()
      FROM data_bundles db
      WHERE t.type = 'data'
        AND t.status = 'success'
        AND t.metadata->>'capacity' IS NOT NULL
        AND t.metadata->>'capacity' = db.datamart_plan_id
        AND t.amount != CASE 
          WHEN db.price_override IS NOT NULL AND db.price_override > 0 THEN db.price_override
          WHEN db.markup_percent IS NOT NULL AND db.markup_percent > 0 
            THEN ROUND(db.price + (db.price * db.markup_percent / 100), 2)
          ELSE db.price
        END
      RETURNING t.id, t.amount
    `;

    // Verify the update
    const verifyResult = await sql`
      SELECT 
        COUNT(*) as total_data_transactions,
        AVG(amount) as avg_amount
      FROM transactions t
      WHERE t.type = 'data'
        AND t.status = 'success'
        AND t.metadata->>'capacity' IS NOT NULL
    `;

    return NextResponse.json({
      success: true,
      message: `Updated ${updateResult.length} transactions to effective prices`,
      updated: updateResult.length,
      sample: checkResult,
      verification: verifyResult[0],
    });
  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Migration failed" },
      { status: 500 }
    );
  }
}
