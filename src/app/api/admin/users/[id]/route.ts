import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { isValidRole, ROLES } from "@/lib/roles";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * PATCH /api/admin/users/[id] – update user fields (admin only).
 */
export async function PATCH(
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
    const body = await request.json().catch(() => ({}));

    if (body.role !== undefined) {
      const role = String(body.role || "").toUpperCase();
      if (!isValidRole(role)) {
        return NextResponse.json(
          { success: false, error: "Invalid role. Use USER or ADMIN." },
          { status: 400 }
        );
      }
      if (id === admin.userId && role !== ROLES.ADMIN) {
        return NextResponse.json(
          { success: false, error: "You cannot remove your own admin role." },
          { status: 400 }
        );
      }
    }

    const updated = await sql`
      UPDATE users
      SET
        email = COALESCE(${body.email !== undefined ? body.email : null}, email),
        first_name = COALESCE(${body.first_name !== undefined ? body.first_name : null}, first_name),
        last_name = COALESCE(${body.last_name !== undefined ? body.last_name : null}, last_name),
        phone = COALESCE(${body.phone !== undefined ? body.phone : null}, phone),
        wallet_balance = COALESCE(${body.wallet_balance !== undefined ? Number(body.wallet_balance) : null}, wallet_balance),
        is_verified = COALESCE(${body.is_verified !== undefined ? body.is_verified : null}, is_verified),
        role = COALESCE(${body.role !== undefined ? String(body.role).toUpperCase() : null}, role)
      WHERE id::text = ${id}
      RETURNING id
    `;

    if (!Array.isArray(updated) || updated.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    if (id === admin.userId) {
      return NextResponse.json(
        { success: false, error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    try { await sql`DELETE FROM transactions WHERE user_id::text = ${id}`; } catch {}
    try { await sql`DELETE FROM wallets WHERE "userId"::text = ${id}`; } catch {}
    try { await sql`DELETE FROM auth_sessions WHERE user_id::text = ${id}`; } catch {}

    const deleted = await sql`
      DELETE FROM users WHERE id::text = ${id} RETURNING id
    `;

    return NextResponse.json({ success: true, deleted: Array.isArray(deleted) ? deleted.length : 0 }, { status: 200 });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
