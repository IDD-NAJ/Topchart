import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getGuestOrderByTracking,
  adminUpdateGuestOrder,
  type FulfillmentStatus,
  type PaymentStatus,
} from "@/lib/guest-orders";
import { createPaystackRefund } from "@/lib/paystack";
import { sql } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  const rows = await sql`SELECT * FROM guest_orders WHERE id = ${id} OR tracking_number = ${id.toUpperCase()} LIMIT 1`;
  if (rows.length === 0) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, order: rows[0] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body = await request.json();

  const allowed: Record<string, unknown> = {};
  if (body.fulfillment_status !== undefined) allowed.fulfillment_status = body.fulfillment_status as FulfillmentStatus;
  if (body.payment_status !== undefined) allowed.payment_status = body.payment_status as PaymentStatus;
  if (body.notes !== undefined) allowed.notes = String(body.notes);
  if (body.datamart_order_status !== undefined) allowed.datamart_order_status = String(body.datamart_order_status);

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
  }

  // Handle refund action
  if (body.action === "refund") {
    const rows = await sql`SELECT * FROM guest_orders WHERE id = ${id} LIMIT 1`;
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    const order = rows[0] as { paystack_reference: string | null; amount_ghs: number; payment_status: string };
    if (!order.paystack_reference) {
      return NextResponse.json({ success: false, error: "No Paystack reference on this order" }, { status: 400 });
    }
    if (order.payment_status !== "success") {
      return NextResponse.json({ success: false, error: "Can only refund successfully paid orders" }, { status: 400 });
    }
    const refundResult = await createPaystackRefund(
      order.paystack_reference,
      Math.round(Number(order.amount_ghs) * 100)
    );
    if (!refundResult.success) {
      return NextResponse.json({ success: false, error: refundResult.error }, { status: 500 });
    }
    await adminUpdateGuestOrder(id, { payment_status: "failed", fulfillment_status: "failed", notes: `Refunded by admin (${auth.email})` });
    return NextResponse.json({ success: true, refund: refundResult.data });
  }

  const updated = await adminUpdateGuestOrder(id, allowed as Parameters<typeof adminUpdateGuestOrder>[1]);
  if (!updated) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, order: updated });
}
