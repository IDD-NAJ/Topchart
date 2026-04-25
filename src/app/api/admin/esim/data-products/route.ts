import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const products = await sql`
      SELECT id, name, country, region, data_volume, validity_days, price, description, is_active, created_at, updated_at
      FROM esim_products
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("GET Data Products Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, country, region, data_volume, validity_days, price, description, is_active } = body;

    if (!name || !country || !data_volume || !validity_days || !price) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO esim_products (name, country, region, data_volume, validity_days, price, description, is_active)
      VALUES (${name}, ${country}, ${region || null}, ${data_volume}, ${Number(validity_days)}, ${Number(price)}, ${description || null}, ${is_active ?? true})
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("POST Data Products Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 });
  }
}
