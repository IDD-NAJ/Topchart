import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const body = await request.json();
    const { question, answer, priority, is_active } = body;
    const { id } = await context.params;

    const updated = await sql`
      UPDATE homepage_faqs
      SET 
        question = COALESCE(${question}, question),
        answer = COALESCE(${answer}, answer),
        priority = COALESCE(${priority}, priority),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updated.length) {
      return NextResponse.json({ success: false, error: "FAQ not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, faq: updated[0] });
  } catch (error) {
    console.error("[ADMIN_FAQS_PATCH] Failed to update FAQ:", error);
    return NextResponse.json({ success: false, error: "Failed to update FAQ" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const { id } = await context.params;

    const deleted = await sql`
      DELETE FROM homepage_faqs WHERE id = ${id} RETURNING *
    `;

    if (!deleted.length) {
      return NextResponse.json({ success: false, error: "FAQ not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, faq: deleted[0] });
  } catch (error) {
    console.error("[ADMIN_FAQS_DELETE] Failed to delete FAQ:", error);
    return NextResponse.json({ success: false, error: "Failed to delete FAQ" }, { status: 500 });
  }
}
