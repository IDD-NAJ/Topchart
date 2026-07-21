export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sqlUnsafe } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const fs = require('fs');
    const path = require('path');
    const sqlContent = fs.readFileSync(
      path.join(process.cwd(), 'src/scripts/023-create-favorites-table.sql'),
      'utf8'
    );

    await sqlUnsafe(sqlContent);

    return NextResponse.json({
      success: true,
      message: "Favorites table created successfully"
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Migration failed" },
      { status: 500 }
    );
  }
}
