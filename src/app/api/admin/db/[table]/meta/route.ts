import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ColumnMeta = {
  name: string;
  dataType: string;
  isNullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ table: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  const { table } = await context.params;

  const columns = await sql`
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

  if ((columns as any[]).length === 0) {
    return NextResponse.json(
      { success: false, error: "Table not found or no columns." },
      { status: 404 }
    );
  }

  const formatted: ColumnMeta[] = (columns as any[]).map((c) => ({
    name: c.column_name,
    dataType: c.data_type,
    isNullable: Boolean(c.is_nullable),
    defaultValue: c.column_default ?? null,
    isPrimaryKey: Boolean(c.is_primary_key),
  }));

  const primaryKeys = formatted.filter((c) => c.isPrimaryKey).map((c) => c.name);

  return NextResponse.json(
    {
      success: true,
      table,
      primaryKeys,
      columns: formatted,
    },
    { status: 200 }
  );
}

