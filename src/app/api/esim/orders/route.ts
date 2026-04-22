import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const orders = await sql`
      SELECT o.id, o.quantity, o.total_amount, o.status, o.activation_code, o.qr_code_url, o.created_at, o.completed_at,
             p.name as product_name, p.country, p.region, p.data_volume, p.validity_days
      FROM esim_orders o
      JOIN esim_products p ON o.product_id = p.id
      WHERE o.user_id = ${user.id}::uuid
      ORDER BY o.created_at DESC
    `;

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("GET User Data Orders Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}
