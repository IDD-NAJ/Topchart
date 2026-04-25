import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/auth";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const id = (await context.params).id;
    const user = await getCurrentUser();
    if (!user || user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, qr_code_url, activation_code } = body;

    // action can be: 'process', 'complete', 'fail'
    
    if (action === 'process') {
      const result = await sql`
        UPDATE esim_orders
        SET status = 'processing', updated_at = NOW()
        WHERE id = ${id} AND status = 'pending'
        RETURNING *
      `;
      if (result.length === 0) return NextResponse.json({ success: false, error: "Order not found or invalid transition" }, { status: 400 });
      return NextResponse.json({ success: true, data: result[0] });
    }
    
    if (action === 'complete') {
      if (!qr_code_url && !activation_code) {
         return NextResponse.json({ success: false, error: "QR code or Activation code is required to complete an order" }, { status: 400 });
      }
      
      const result = await sql`
        UPDATE esim_orders
        SET status = 'completed', 
            qr_code_url = ${qr_code_url || null}, 
            activation_code = ${activation_code || null}, 
            completed_at = NOW(), 
            updated_at = NOW()
        WHERE id = ${id} AND status IN ('pending', 'processing')
        RETURNING *
      `;
      if (result.length === 0) return NextResponse.json({ success: false, error: "Order not found or invalid transition" }, { status: 400 });
      return NextResponse.json({ success: true, data: result[0] });
    }

    if (action === 'fail') {
      const result = await sql`
        UPDATE esim_orders
        SET status = 'failed', updated_at = NOW()
        WHERE id = ${id} AND status IN ('pending', 'processing')
        RETURNING *
      `;
      if (result.length === 0) return NextResponse.json({ success: false, error: "Order not found or invalid transition" }, { status: 400 });
      return NextResponse.json({ success: true, data: result[0] });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("PATCH Data Order Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 });
  }
}
