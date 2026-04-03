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
    const statusFilter = (url.searchParams.get("status") || "").trim().toLowerCase();
    const typeFilter = (url.searchParams.get("type") || "").trim().toLowerCase();
    const limit = clampInt(url.searchParams.get("limit"), 50, 1, 200);
    const offset = clampInt(url.searchParams.get("offset"), 0, 0, 1_000_000);

    const searchPattern = q ? `%${q.toLowerCase()}%` : null;

    // Get total count
    const countRows = await sql`
      SELECT COUNT(*)::int AS count
      FROM transactions t
      LEFT JOIN users u ON u.id::text = t."userId"::text
      WHERE (${searchPattern}::text IS NULL OR (
        t.reference ILIKE ${searchPattern} OR 
        COALESCE(t.source,'') ILIKE ${searchPattern} OR 
        u.email ILIKE ${searchPattern}
      ))
      AND (${statusFilter}::text = '' OR LOWER(t.status::text) = ${statusFilter})
      AND (${typeFilter}::text = '' OR LOWER(t.type::text) = ${typeFilter})
    `;

    // Get transactions with user details
    const rows = await sql`
      SELECT
        t.id,
        t."userId" AS user_id,
        t.type,
        t.amount,
        t.status,
        t.reference,
        t.source AS description,
        t.currency,
        t.metadata,
        t."createdAt" AS created_at,
        u.email AS user_email,
        u.first_name AS user_first_name,
        u.last_name AS user_last_name
      FROM transactions t
      LEFT JOIN users u ON u.id::text = t."userId"::text
      WHERE (${searchPattern}::text IS NULL OR (
        t.reference ILIKE ${searchPattern} OR 
        COALESCE(t.source,'') ILIKE ${searchPattern} OR 
        u.email ILIKE ${searchPattern}
      ))
      AND (${statusFilter}::text = '' OR LOWER(t.status::text) = ${statusFilter})
      AND (${typeFilter}::text = '' OR LOWER(t.type::text) = ${typeFilter})
      ORDER BY t."createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const transactionsArray = Array.isArray(rows) ? rows : [];
    const totalCount = Array.isArray(countRows) && countRows.length > 0 ? Number(countRows[0]?.count ?? 0) : 0;

    return NextResponse.json(
      { success: true, transactions: transactionsArray, total: totalCount, limit, offset },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Admin transactions error:", error);
    const errorMessage = error?.message || "Internal server error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

