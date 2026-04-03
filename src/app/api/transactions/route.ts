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

    const raw = await sql`
      SELECT 
        id,
        "type",
        amount,
        "status",
        "reference",
        "metadata",
        created_at
      FROM transactions 
      WHERE user_id = ${targetUserId}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const transactions = (raw as any[]).map((row) => ({
      id: row.id,
      type: String(row.type || "").toLowerCase(),
      amount: Number(row.amount ?? 0),
      status: String(row.status || "").toLowerCase(),
      description: row.metadata?.description || row.metadata?.memo || (String(row.type).toLowerCase() === 'deposit' ? 'Wallet Deposit' : 'Transaction'),
      reference: row.reference,
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
