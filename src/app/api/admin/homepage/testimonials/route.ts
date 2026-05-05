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
    const testimonials = await sql`
      SELECT 
        id, brand, quote, name, role, priority, is_active, created_at, updated_at
      FROM homepage_testimonials
      ORDER BY priority ASC, created_at ASC
    `;
    return NextResponse.json({ success: true, testimonials });
  } catch (error) {
    console.error("[ADMIN_TESTIMONIALS_GET] Failed to load testimonials:", error);
    return NextResponse.json({ success: false, error: "Failed to load testimonials" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const body = await request.json();
    const { brand, quote, name, role, priority, is_active } = body;

    if (!brand || !quote || !name || !role) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const inserted = await sql`
      INSERT INTO homepage_testimonials (brand, quote, name, role, priority, is_active)
      VALUES (${brand}, ${quote}, ${name}, ${role}, ${priority || 0}, ${is_active !== false})
      RETURNING *
    `;

    return NextResponse.json({ success: true, testimonial: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_TESTIMONIALS_POST] Failed to create testimonial:", error);
    return NextResponse.json({ success: false, error: "Failed to create testimonial" }, { status: 500 });
  }
}
