export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { sqlUnsafe } from "@/lib/db";

export async function GET(_request: NextRequest) {
  try {
    // Join data_bundle_categories (display names) with networks,
    // then count active bundles per network via the UUID foreign key.
    const rows = (await sqlUnsafe(
      `SELECT
         n.id,
         n.name,
         n.code,
         dbc.name  AS category_name,
         COUNT(b.id)::int AS bundle_count
       FROM data_bundle_categories dbc
       JOIN networks n ON dbc."networkId" = n.id
       LEFT JOIN data_bundles b
              ON b."networkId" = n.id
             AND b."isActive" = true
       WHERE dbc.is_active = true
       GROUP BY n.id, n.name, n.code, dbc.name
       ORDER BY n.name ASC`
    )) as Array<{
      id: string;
      name: string;
      code: string;
      category_name: string;
      bundle_count: number;
    }>;

    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        category_name: r.category_name,
        bundle_count: r.bundle_count,
      })),
    });
  } catch (error) {
    console.error("[purchases/networks] error:", error);
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch networks" },
      { status: 500 }
    );
  }
}
