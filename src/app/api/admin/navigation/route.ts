import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const links = await sql`
      SELECT 
        id, label, href, description, icon, parent_id, 
        priority, is_active, created_at, updated_at
      FROM navigation_links
      ORDER BY priority ASC, created_at ASC
    `;
    return NextResponse.json({ success: true, links });
  } catch (error) {
    console.error("[ADMIN_NAVIGATION_GET] Failed to load navigation:", error);
    return NextResponse.json({ success: false, error: "Failed to load navigation" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const body = await request.json();
    const { label, href, description, icon, parent_id, priority, is_active } = body;

    if (!label || !href) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const inserted = await sql`
      INSERT INTO navigation_links (label, href, description, icon, parent_id, priority, is_active)
      VALUES (${label}, ${href}, ${description}, ${icon}, ${parent_id}, ${priority || 0}, ${is_active !== false})
      RETURNING *
    `;

    return NextResponse.json({ success: true, link: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_NAVIGATION_POST] Failed to create navigation link:", error);
    return NextResponse.json({ success: false, error: "Failed to create navigation link" }, { status: 500 });
  }
}
