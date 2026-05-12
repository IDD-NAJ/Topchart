import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql, sqlUnsafe } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");
    const resourceType = searchParams.get("resourceType");
    const offset = (page - 1) * limit;

    let whereClause = "";
    const params: any[] = [];
    let paramIdx = 1;

    const conditions: string[] = [];
    if (action) {
      conditions.push(`action = $${paramIdx++}`);
      params.push(action);
    }
    if (userId) {
      conditions.push(`user_id = $${paramIdx++}::uuid`);
      params.push(userId);
    }
    if (resourceType) {
      conditions.push(`resource_type = $${paramIdx++}`);
      params.push(resourceType);
    }

    if (conditions.length > 0) {
      whereClause = "WHERE " + conditions.join(" AND ");
    }

    const countSql = `SELECT COUNT(*)::int AS total FROM audit_logs ${whereClause}`;
    const countRows = await sqlUnsafe(countSql, params.length ? params : undefined);
    const limitSlot = paramIdx;
    const offsetSlot = paramIdx + 1;
    const logsSql = `
      SELECT
        al.id, al.user_id, al.action, al.resource_type, al.resource_id,
        al.details, al.ip_address, al.created_at,
        u.first_name, u.last_name, u.email
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${limitSlot} OFFSET $${offsetSlot}
    `;
    const logsParams = [...params, limit, offset];
    const logs = await sqlUnsafe(logsSql, logsParams);

    const total = (countRows[0] as { total?: number })?.total || 0;

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Audit Logs API] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, action, resource_type, resource_id, details, ip_address, user_agent } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: "action is required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES (
        ${user_id || null}::uuid,
        ${action},
        ${resource_type || null},
        ${resource_id || null}::uuid,
        ${details ? JSON.stringify(details) : null}::jsonb,
        ${ip_address || null},
        ${user_agent || null}
      )
      RETURNING id, action, resource_type, created_at
    `;

    return NextResponse.json({ success: true, log: result[0] }, { status: 201 });
  } catch (error) {
    console.error("[Audit Logs API] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create audit log" },
      { status: 500 }
    );
  }
}
