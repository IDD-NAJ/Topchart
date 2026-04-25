import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const perks = await sql`
      SELECT id, title, description, icon_name, color_gradient, sort_order
      FROM perks
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, created_at ASC
    `;

    return NextResponse.json(
      {
        success: true,
        perks: perks || [],
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Perks fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load perks" },
      { status: 500 }
    );
  }
}
