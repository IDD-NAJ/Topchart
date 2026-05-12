import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  try {
    const links = await sql`
      SELECT 
        id, label, href, description, icon, parent_id, 
        priority, is_active, created_at, updated_at
      FROM navigation_links
      WHERE is_active = TRUE
      ORDER BY priority ASC, created_at ASC
    `;
    return NextResponse.json({ success: true, links });
  } catch (error) {
    console.error("[NAVIGATION_GET] Failed to load navigation:", error);
    return NextResponse.json({ success: false, error: "Failed to load navigation" }, { status: 500 });
  }
}
