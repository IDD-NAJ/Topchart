import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const products = await sql`
      SELECT id, name, country, region, data_volume, validity_days, price, description
      FROM esim_products
      WHERE is_active = true
      ORDER BY country ASC, price ASC
    `;

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("GET Public Data Products Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}
