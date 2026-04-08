import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clampInt(value: string | null, def: number, min: number, max: number) {
  const n = value == null ? def : Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
    }

    const url = new URL(request.url);
    const search = (url.searchParams.get("search") || "").trim().toLowerCase();
    const page = clampInt(url.searchParams.get("page"), 1, 1, 10000);
    const limit = clampInt(url.searchParams.get("limit"), 20, 1, 200);
    const offset = (page - 1) * limit;

    const searchPattern = search ? `%${search}%` : null;

    const countRows = await sql`
      SELECT COUNT(*)::int AS count
      FROM users u
      WHERE (${searchPattern}::text IS NULL OR (
        LOWER(u.email) LIKE ${searchPattern} OR
        LOWER(u.first_name) LIKE ${searchPattern} OR
        LOWER(u.last_name) LIKE ${searchPattern} OR
        u.phone LIKE ${searchPattern}
      ))
    `;

    const rows = await sql`
      SELECT id, email, first_name, last_name, phone, wallet_balance, is_verified, role, created_at
      FROM users u
      WHERE (${searchPattern}::text IS NULL OR (
        LOWER(u.email) LIKE ${searchPattern} OR
        LOWER(u.first_name) LIKE ${searchPattern} OR
        LOWER(u.last_name) LIKE ${searchPattern} OR
        u.phone LIKE ${searchPattern}
      ))
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total = Array.isArray(countRows) && countRows.length > 0 ? Number(countRows[0]?.count ?? 0) : 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      users: Array.isArray(rows) ? rows : [],
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error("Admin management GET error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
    }

    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === "promoteToAdmin") {
      const { userId } = body;
      if (!userId) return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });

      await sql`UPDATE users SET role = 'ADMIN' WHERE id::text = ${userId}`;
      return NextResponse.json({ success: true });
    }

    if (action === "demoteToUser") {
      const { userId } = body;
      if (!userId) return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
      if (userId === admin.userId) {
        return NextResponse.json({ success: false, error: "Cannot demote yourself" }, { status: 400 });
      }

      await sql`UPDATE users SET role = 'USER' WHERE id::text = ${userId}`;
      return NextResponse.json({ success: true });
    }

    if (action === "createAdmin") {
      const { email, firstName, lastName, phone } = body;
      if (!email || !firstName || !lastName) {
        return NextResponse.json({ success: false, error: "email, firstName, lastName required" }, { status: 400 });
      }

      const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
      if (existing.length > 0) {
        return NextResponse.json({ success: false, error: "User with this email already exists" }, { status: 409 });
      }

      const tempPassword = uuidv4().slice(0, 12);
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      const userId = uuidv4();
      const referralCode = userId.slice(0, 8).toUpperCase();
      const now = new Date().toISOString();

      await sql`
        INSERT INTO users (id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, role, referral_code, referral_earnings, referred_by, total_deposits, created_at)
        VALUES (${userId}, ${email.toLowerCase()}, ${phone || ""}, ${passwordHash}, ${firstName}, ${lastName}, 0.00, true, 'ADMIN', ${referralCode}, 0.00, ${null}, 0.00, ${now})
      `;

      return NextResponse.json({ success: true, tempPassword });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin management POST error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
