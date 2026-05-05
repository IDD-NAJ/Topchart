import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  try {
    const testimonials = await sql`
      SELECT 
        id, brand, quote, name, role, priority, is_active, created_at, updated_at
      FROM homepage_testimonials
      WHERE is_active = TRUE
      ORDER BY priority ASC, created_at ASC
    `;
    return NextResponse.json({ success: true, testimonials });
  } catch (error) {
    console.error("[TESTIMONIALS_GET] Failed to load testimonials:", error);
    return NextResponse.json({ success: false, error: "Failed to load testimonials" }, { status: 500 });
  }
}
