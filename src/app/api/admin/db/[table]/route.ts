import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql, sqlUnsafe } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function clampInt(value: string | null, def: number, min: number, max: number) {
  const n = value == null ? def : Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function safeIdent(name: string): string {
  // Restrict to unquoted SQL identifiers to prevent injection
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) throw new Error("Invalid identifier");
  return `"${name.replace(/"/g, '""')}"`;
}

async function getTableMeta(table: string) {
  const cols = await sql`
    SELECT DISTINCT ON (c.ordinal_position)
      c.column_name,
      c.data_type,
      (c.is_nullable = 'YES') AS is_nullable,
      c.column_default,
      (tc.constraint_type = 'PRIMARY KEY') AS is_primary_key
    FROM information_schema.columns c
    LEFT JOIN information_schema.key_column_usage kcu
      ON kcu.table_schema = c.table_schema
     AND kcu.table_name = c.table_name
     AND kcu.column_name = c.column_name
    LEFT JOIN information_schema.table_constraints tc
      ON tc.table_schema = kcu.table_schema
     AND tc.table_name = kcu.table_name
     AND tc.constraint_name = kcu.constraint_name
     AND tc.constraint_type = 'PRIMARY KEY'
    WHERE c.table_schema = 'public'
      AND c.table_name = ${table}
    ORDER BY c.ordinal_position ASC, tc.constraint_type DESC NULLS LAST
  `;
  const columns = (cols as any[]).map((c) => ({
    name: c.column_name as string,
    dataType: c.data_type as string,
    isNullable: Boolean(c.is_nullable),
    defaultValue: c.column_default ?? null,
    isPrimaryKey: Boolean(c.is_primary_key),
  }));
  const primaryKeys = columns.filter((c) => c.isPrimaryKey).map((c) => c.name);
  return { columns, primaryKeys };
}

function coerceValue(dataType: string, raw: any) {
  if (raw === "" || raw === undefined) return null;
  if (raw === null) return null;
  const t = String(dataType).toLowerCase();
  if (t.includes("boolean")) return raw === true || raw === "true" || raw === "1" || raw === 1;
  if (t.includes("int") || t.includes("numeric") || t.includes("decimal") || t.includes("real") || t.includes("double")) {
    const n = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(n)) return null;
    return n;
  }
  if (t.includes("timestamp") || t === "date" || t.includes("time")) {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }
  if (t.includes("json")) {
    if (typeof raw === "object") return JSON.stringify(raw);
    try {
      JSON.parse(String(raw));
      return String(raw);
    } catch {
      return null;
    }
  }
  return String(raw);
}

function validatePayload(tableColumns: { name: string; dataType: string; isNullable: boolean; defaultValue: string | null; isPrimaryKey: boolean }[], payload: Record<string, any>, mode: "create" | "update") {
  const colMap = new Map(tableColumns.map((c) => [c.name, c]));
  const out: Record<string, any> = {};
  const errors: Record<string, string> = {};

  for (const [key, value] of Object.entries(payload || {})) {
    const col = colMap.get(key);
    if (!col) continue;
    if (mode === "create" && col.isPrimaryKey && col.defaultValue) {
      // Let DB generate PK if default exists
      continue;
    }
    const coerced = coerceValue(col.dataType, value);
    if (coerced === null && value !== null && value !== "" && value !== undefined) {
      errors[key] = `Invalid ${col.dataType}`;
      continue;
    }
    out[key] = coerced;
  }

  if (mode === "create") {
    for (const c of tableColumns) {
      const isGenerated = c.isPrimaryKey && !!c.defaultValue;
      if (isGenerated) continue;
      const provided = Object.prototype.hasOwnProperty.call(out, c.name);
      if (!provided) continue;
      if (!c.isNullable && out[c.name] == null && c.defaultValue == null) {
        errors[c.name] = "Required";
      }
    }
  }

  return { data: out, errors };
}

export async function GET(request: NextRequest, context: { params: Promise<{ table: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  const { table } = await context.params;
  const url = new URL(request.url);
  const limit = clampInt(url.searchParams.get("limit"), 25, 1, 200);
  const offset = clampInt(url.searchParams.get("offset"), 0, 0, 1_000_000);
  const q = (url.searchParams.get("q") || "").trim();

  const { columns, primaryKeys } = await getTableMeta(table);
  if (columns.length === 0) {
    return NextResponse.json({ success: false, error: "Table not found." }, { status: 404 });
  }

  const tableIdent = safeIdent(table);

  const textCols = columns
    .filter((c) => {
      const t = c.dataType.toLowerCase();
      return t.includes("character") || t.includes("text") || t.includes("uuid");
    })
    .map((c) => c.name);

  const where =
    q && textCols.length
      ? `WHERE ${textCols.map((c) => `${safeIdent(c)} ILIKE '%' || $1 || '%'`).join(" OR ")}`
      : "";
  const args = q && textCols.length ? [q] : [];

  const countSql = `SELECT COUNT(*)::int AS count FROM ${tableIdent} ${where}`;
  const dataSql = `SELECT * FROM ${tableIdent} ${where} ORDER BY 1 DESC LIMIT ${limit} OFFSET ${offset}`;

  const [countRows, rows] = await Promise.all([
    sqlUnsafe(countSql, args),
    sqlUnsafe(dataSql, args),
  ]);

  return NextResponse.json(
    {
      success: true,
      table,
      primaryKeys,
      columns,
      pagination: { limit, offset, total: (countRows as any[])[0]?.count ?? 0 },
      rows,
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest, context: { params: Promise<{ table: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  const { table } = await context.params;
  const body = await request.json().catch(() => ({}));
  const payload = (body && body.data) || body || {};

  const { columns } = await getTableMeta(table);
  if (columns.length === 0) {
    return NextResponse.json({ success: false, error: "Table not found." }, { status: 404 });
  }

  const { data, errors } = validatePayload(columns, payload, "create");
  if (Object.keys(errors).length) {
    return NextResponse.json({ success: false, error: "Validation failed", fieldErrors: errors }, { status: 400 });
  }

  const keys = Object.keys(data);
  if (keys.length === 0) {
    return NextResponse.json({ success: false, error: "No fields provided." }, { status: 400 });
  }

  const tableIdent = safeIdent(table);
  const colIdents = keys.map(safeIdent).join(", ");
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
  const values = keys.map((k) => data[k]);

  const insertSql = `INSERT INTO ${tableIdent} (${colIdents}) VALUES (${placeholders}) RETURNING *`;
  const created = await sqlUnsafe(insertSql, values);

  return NextResponse.json({ success: true, row: (created as any[])[0] }, { status: 200 });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ table: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  const { table } = await context.params;
  const body = await request.json().catch(() => ({}));
  const id = body?.id;
  const payload = body?.data || {};

  const { columns, primaryKeys } = await getTableMeta(table);
  if (columns.length === 0) {
    return NextResponse.json({ success: false, error: "Table not found." }, { status: 404 });
  }
  if (!primaryKeys.length) {
    return NextResponse.json({ success: false, error: "Table has no primary key; update disabled." }, { status: 400 });
  }
  if (primaryKeys.length !== 1) {
    return NextResponse.json({ success: false, error: "Composite primary keys not supported in UI yet." }, { status: 400 });
  }
  if (id == null || id === "") {
    return NextResponse.json({ success: false, error: "Missing id." }, { status: 400 });
  }

  const { data, errors } = validatePayload(columns, payload, "update");
  if (Object.keys(errors).length) {
    return NextResponse.json({ success: false, error: "Validation failed", fieldErrors: errors }, { status: 400 });
  }

  const keys = Object.keys(data);
  if (keys.length === 0) {
    return NextResponse.json({ success: false, error: "No fields provided." }, { status: 400 });
  }

  const tableIdent = safeIdent(table);
  const pk = primaryKeys[0];
  const sets = keys.map((k, i) => `${safeIdent(k)} = $${i + 1}`).join(", ");
  const values = keys.map((k) => data[k]);
  values.push(id);

  const updateSql = `UPDATE ${tableIdent} SET ${sets} WHERE ${safeIdent(pk)}::text = $${keys.length + 1} RETURNING *`;
  const updated = await sqlUnsafe(updateSql, values);

  if ((updated as any[]).length === 0) {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true, row: (updated as any[])[0] }, { status: 200 });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ table: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  const { table } = await context.params;
  const body = await request.json().catch(() => ({}));
  const ids: any[] = Array.isArray(body?.ids) ? body.ids : body?.id != null ? [body.id] : [];

  const { primaryKeys } = await getTableMeta(table);
  if (!primaryKeys.length) {
    return NextResponse.json({ success: false, error: "Table has no primary key; delete disabled." }, { status: 400 });
  }
  if (primaryKeys.length !== 1) {
    return NextResponse.json({ success: false, error: "Composite primary keys not supported in UI yet." }, { status: 400 });
  }
  if (!ids.length) {
    return NextResponse.json({ success: false, error: "No ids provided." }, { status: 400 });
  }

  const tableIdent = safeIdent(table);
  const pk = primaryKeys[0];
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");

  const delSql = `DELETE FROM ${tableIdent} WHERE ${safeIdent(pk)}::text IN (${placeholders})`;
  await sqlUnsafe(delSql, ids.map(String));

  return NextResponse.json({ success: true, deleted: ids.length }, { status: 200 });
}

