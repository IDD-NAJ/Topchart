export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql, sqlUnsafe } from "@/lib/db";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  const rows = await sql`
    SELECT id, code, name, color, is_active, created_at, updated_at
    FROM networks
    ORDER BY name ASC
  `;

  const counts = await sql`
    SELECT network, COUNT(*) AS bundle_count
    FROM data_bundles
    GROUP BY network
  `;
  const countMap: Record<string, number> = {};
  for (const r of counts) countMap[String(r.network)] = Number(r.bundle_count);

  const networks = rows.map((r) => ({
    ...r,
    bundle_count: countMap[r.code] ?? countMap[r.name] ?? 0,
  }));

  return NextResponse.json({ success: true, networks });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { code, name, color, is_active } = body;
  if (!code || !name) return NextResponse.json({ success: false, error: "code and name required" }, { status: 400 });

  const rows = await sql`
    INSERT INTO networks (code, name, color, is_active, created_at, updated_at)
    VALUES (${code.toUpperCase()}, ${name}, ${color ?? null}, ${is_active ?? true}, NOW(), NOW())
    RETURNING *
  `;

  return NextResponse.json({ success: true, network: rows[0] });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { id, code, name, color, is_active } = body;
  if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });

  await sqlUnsafe(
    `UPDATE networks SET
       code      = COALESCE($1, code),
       name      = COALESCE($2, name),
       color     = COALESCE($3, color),
       is_active = COALESCE($4, is_active),
       updated_at = NOW()
     WHERE id = $5`,
    [code ? code.toUpperCase() : null, name ?? null, color ?? null, is_active ?? null, id]
  );

  return NextResponse.json({ success: true, message: "Network updated" });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });

  await sql`DELETE FROM networks WHERE id = ${id}`;
  return NextResponse.json({ success: true, message: "Network deleted" });
}
