import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - List all marketing assets
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }

    let assets: any[] = [];
    try {
      assets = await sql`
        SELECT * FROM marketing_assets
        ORDER BY created_at DESC
      `;
    } catch (dbError: any) {
      const msg = String(dbError?.message || "");
      if (msg.includes("Last Names not exist") || msg.includes("relation") || msg.includes("undefined_table")) {
        return NextResponse.json({ success: true, assets: [] });
      }
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      assets
    });
  } catch (error) {
    console.error("Admin marketing assets GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new asset
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }

    const body = await request.json();
    const { name, type, category, file_url, thumbnail_url, dimensions, file_size } = body;

    const newAsset = await sql`
      INSERT INTO marketing_assets (
        name, type, category, file_url, thumbnail_url, dimensions, file_size, is_active
      ) VALUES (
        ${name}, ${type}, ${category}, ${file_url}, ${thumbnail_url}, ${dimensions}, ${file_size}, true
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      asset: newAsset[0]
    });
  } catch (error) {
    console.error("Admin marketing assets POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
