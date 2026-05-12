import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE - Remove custom field
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }

    const { id } = await context.params;

    await sql`
      DELETE FROM custom_form_fields
      WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      message: "Field deleted successfully"
    });
  } catch (error) {
    console.error("Custom field DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update custom field
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }
    const { id } = await context.params;
    const body = await request.json();
    const { is_enabled, is_required, sort_order } = body;

    const updated = await sql`
      UPDATE custom_form_fields
      SET 
        is_enabled = ${is_enabled !== undefined ? is_enabled : undefined},
        is_required = ${is_required !== undefined ? is_required : undefined},
        sort_order = ${sort_order !== undefined ? sort_order : undefined},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      field: updated[0]
    });
  } catch (error) {
    console.error("Custom field PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
