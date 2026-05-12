import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/auth";
import { z } from "zod";

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
               u.email as user_email, u.first_name, u.last_name
        FROM esim_orders o
        JOIN users u ON o.user_id = u.id::uuid
        WHERE o.processing_status = ${status}
        ORDER BY o.created_at DESC
      `;
    } else {
      orders = await sql`
        SELECT o.*, 
               u.email as user_email, u.first_name, u.last_name
        FROM esim_orders o
        JOIN users u ON o.user_id = u.id::uuid
        ORDER BY o.created_at DESC
      `;
    }

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("GET Data Orders Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, processingStatus, deliveryDetails, adminNotes } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 });
    }

    const updateSchema = z.object({
      processingStatus: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
      deliveryDetails: z.record(z.any()).optional(),
      adminNotes: z.string().optional(),
    });

    const validation = updateSchema.safeParse({ processingStatus, deliveryDetails, adminNotes });
    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Invalid data", details: validation.error.errors }, { status: 400 });
    }

    const data = validation.data;

    const result = await sql`
      UPDATE esim_orders 
      SET 
        processing_status = COALESCE(${data.processingStatus}, processing_status),
        delivery_details = COALESCE(${data.deliveryDetails ? JSON.stringify(data.deliveryDetails) : null}, delivery_details),
        admin_notes = COALESCE(${data.adminNotes || null}, admin_notes),
        processed_at = CASE WHEN ${data.processingStatus === 'completed' || data.processingStatus === 'failed'} THEN NOW() ELSE processed_at END,
        processed_by = CASE WHEN ${data.processingStatus === 'completed' || data.processingStatus === 'failed'} THEN ${user.id}::uuid ELSE processed_by END,
        updated_at = NOW()
      WHERE id = ${orderId}::uuid
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("PATCH Order Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 });
  }
}
