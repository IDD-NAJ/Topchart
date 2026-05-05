import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const body = await request.json();
    const { brand, quote, name, role, priority, is_active } = body;
    const { id } = params;

    const updated = await sql`
      UPDATE homepage_testimonials
      SET 
        brand = COALESCE(${brand}, brand),
        quote = COALESCE(${quote}, quote),
        name = COALESCE(${name}, name),
        role = COALESCE(${role}, role),
        priority = COALESCE(${priority}, priority),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updated.length) {
      return NextResponse.json({ success: false, error: "Testimonial not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, testimonial: updated[0] });
  } catch (error) {
    console.error("[ADMIN_TESTIMONIALS_PATCH] Failed to update testimonial:", error);
    return NextResponse.json({ success: false, error: "Failed to update testimonial" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const { id } = params;

    const deleted = await sql`
      DELETE FROM homepage_testimonials WHERE id = ${id} RETURNING *
    `;

    if (!deleted.length) {
      return NextResponse.json({ success: false, error: "Testimonial not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, testimonial: deleted[0] });
  } catch (error) {
    console.error("[ADMIN_TESTIMONIALS_DELETE] Failed to delete testimonial:", error);
    return NextResponse.json({ success: false, error: "Failed to delete testimonial" }, { status: 500 });
  }
}
