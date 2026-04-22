import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let orders;
    if (status) {
      orders = await sql`
        SELECT o.*, 
               u.email as user_email, u.first_name, u.last_name,
               p.name as product_name, p.data_volume, p.country, p.validity_days
        FROM esim_orders o
        JOIN users u ON o.user_id = u.id::uuid
        JOIN esim_products p ON o.product_id = p.id
        WHERE o.status = ${status}
        ORDER BY o.created_at DESC
      `;
    } else {
      orders = await sql`
        SELECT o.*, 
               u.email as user_email, u.first_name, u.last_name,
               p.name as product_name, p.data_volume, p.country, p.validity_days
        FROM esim_orders o
        JOIN users u ON o.user_id = u.id::uuid
        JOIN esim_products p ON o.product_id = p.id
        ORDER BY o.created_at DESC
      `;
    }

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("GET Data Orders Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}
