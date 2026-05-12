import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  try {
    const services = await sql`
      SELECT 
        id, title, description, href, label, icon, 
        priority, is_active, created_at, updated_at
      FROM homepage_services
      WHERE is_active = TRUE
      ORDER BY priority ASC, created_at ASC
    `;
    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error("[SERVICES_GET] Failed to load services:", error);
    return NextResponse.json({ success: false, error: "Failed to load services" }, { status: 500 });
  }
}
