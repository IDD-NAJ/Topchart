import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    const q = (url.searchParams.get("q") || "").trim();
    const limit = clampInt(url.searchParams.get("limit"), 50, 1, 200);
    const offset = clampInt(url.searchParams.get("offset"), 0, 0, 1_000_000);

    const searchPattern = q ? `%${q.toLowerCase()}%` : null;

    const countRows = await sql`
      SELECT COUNT(DISTINCT u.id)::int AS count
      FROM auth_sessions s
      JOIN users u ON u.id::text = s.user_id::text
      WHERE s.expires_at > NOW()
      AND (${searchPattern}::text IS NULL OR (
        LOWER(u.email) LIKE ${searchPattern} OR
        LOWER(u.first_name) LIKE ${searchPattern} OR
        LOWER(u.last_name) LIKE ${searchPattern} OR
        u.phone LIKE ${searchPattern}
      ))
    `;

    const rows = await sql`
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        COUNT(*)::int AS active_sessions,
        MAX(s.expires_at) AS session_expires_at
      FROM auth_sessions s
      JOIN users u ON u.id::text = s.user_id::text
      WHERE s.expires_at > NOW()
      AND (${searchPattern}::text IS NULL OR (
        LOWER(u.email) LIKE ${searchPattern} OR
        LOWER(u.first_name) LIKE ${searchPattern} OR
        LOWER(u.last_name) LIKE ${searchPattern} OR
        u.phone LIKE ${searchPattern}
      ))
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.phone, u.role
      ORDER BY active_sessions DESC, session_expires_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const usersArray = Array.isArray(rows) ? rows : [];
    const totalCount = Array.isArray(countRows) && countRows.length > 0 ? Number(countRows[0]?.count ?? 0) : 0;

    return NextResponse.json(
      { success: true, users: usersArray, total: totalCount, limit, offset },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin active users error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

