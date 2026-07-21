export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const status = searchParams.get("status");
    const provider = searchParams.get("provider");
    const userId = searchParams.get("userId");

    // Build query conditions
    let statusFilter = sql``;
    let providerFilter = sql``;
    let userIdFilter = sql``;
    
    if (status) {
      statusFilter = sql`AND status = ${status}`;
    }
    if (provider) {
      providerFilter = sql`AND provider = ${provider}`;
    }
    if (userId) {
      userIdFilter = sql`AND user_id = ${userId}`;
    }

    const transactions = await sql`
      SELECT 
        bt.id,
        bt.user_id,
        u.email as user_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        bt.provider,
        bt.service_id,
        bt.service_name,
        bt.category,
        bt.account_number,
        bt.customer_name,
        bt.amount,
        bt.fee,
        bt.total_amount,
        bt.reference,
        bt.provider_reference,
        bt.status,
        bt.error_message,
        bt.created_at,
        bt.completed_at
      FROM bill_transactions bt
      LEFT JOIN users u ON bt.user_id = u.id
      WHERE 1=1 ${statusFilter} ${providerFilter} ${userIdFilter}
      ORDER BY bt.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Get total count
    const [countResult] = await sql`
      SELECT COUNT(*) as total
      FROM bill_transactions
      WHERE 1=1 ${statusFilter} ${providerFilter} ${userIdFilter}
    `;

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total: parseInt(countResult.total, 10),
          limit,
          offset,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch bill transactions:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch transactions",
      },
      { status: 500 }
    );
  }
}
