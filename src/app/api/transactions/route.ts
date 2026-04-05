import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    
    // Security: Only allow users to see their own transactions, 
    // unless they are an admin (assuming role-based check)
    let targetUserId = user.id;
    if (requestedUserId && requestedUserId !== user.id) {
      if (user.role !== "admin") {
        return NextResponse.json(
          { success: false, error: "Forbidden: You can only view your own transactions" },
          { status: 403 }
        );
      }
      targetUserId = requestedUserId;
    }

    let raw: any[]
    try {
      raw = (await sql`
        SELECT 
          id,
          "type",
          amount,
          "status",
          "reference",
          "description",
          "network",
          "phone_number",
          "data_plan",
          "payment_method",
          "metadata",
          "paystack_reference",
          "paystack_access_code",
          "payment_channel",
          "currency",
          "fees",
          "paid_at",
          created_at
        FROM transactions 
        WHERE user_id = ${targetUserId}
        ORDER BY created_at DESC
        LIMIT 100
      `) as any[]
    } catch {
      raw = (await sql`
        SELECT id, "type", amount, "status", "reference", "metadata", created_at
        FROM transactions 
        WHERE user_id = ${targetUserId}
        ORDER BY created_at DESC
        LIMIT 100
      `) as any[]
    }

    const transactions = raw.map((row) => ({
      id: row.id,
      type: String(row.type || "").toLowerCase(),
      amount: Number(row.amount ?? 0),
      status: String(row.status || "").toLowerCase(),
      description: row.description || row.metadata?.description || row.metadata?.memo || (String(row.type).toLowerCase() === 'deposit' ? 'Wallet Deposit' : 'Transaction'),
      reference: row.reference,
      network: row.network ?? row.metadata?.network ?? null,
      phone_number: row.phone_number ?? row.metadata?.phone_number ?? null,
      data_plan: row.data_plan ?? row.metadata?.data_plan ?? null,
      payment_method: row.payment_method ?? row.metadata?.payment_method ?? null,
      paystack_reference: row.paystack_reference ?? row.metadata?.paystack_reference ?? null,
      paystack_access_code: row.paystack_access_code ?? row.metadata?.access_code ?? row.metadata?.paystack_access_code ?? null,
      payment_channel: row.payment_channel ?? row.metadata?.payment_channel ?? null,
      currency: row.currency ?? row.metadata?.currency ?? "GHS",
      fees: row.fees != null ? Number(row.fees) : (row.metadata?.fees != null ? Number(row.metadata.fees) : null),
      paid_at: row.paid_at ?? row.metadata?.paid_at ?? null,
      metadata: row.metadata ?? null,
      created_at: row.created_at,
    }));

    return NextResponse.json(
      { success: true, transactions }
    );
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
