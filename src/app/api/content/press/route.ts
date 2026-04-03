import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const stats = await sql`
      SELECT id, value, label, color_gradient, sort_order
      FROM press_stats
      WHERE is_active = TRUE
      ORDER BY sort_order ASC
    `;

    const assets = await sql`
      SELECT id, name, asset_type, description, download_url, file_size, version
      FROM press_assets
      WHERE is_active = TRUE
      ORDER BY created_at ASC
    `;

    return NextResponse.json(
      {
        success: true,
        stats: stats || [],
        assets: assets || [],
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Press fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load press kit data" },
      { status: 500 }
    );
  }
}
