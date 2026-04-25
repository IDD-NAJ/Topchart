import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    // Build query with filters
    let query = sql`
      SELECT 
        id,
        provider,
        service_id,
        service_name,
        category,
        account_number,
        customer_name,
        amount,
        fee,
        total_amount,
        reference,
        provider_reference,
        status,
        created_at,
        completed_at
      FROM bill_transactions 
      WHERE user_id = ${session.id}
    `;

    if (status) {
      query = sql`${query} AND status = ${status}`;
    }

    if (category) {
      query = sql`${query} AND category = ${category}`;
    }

    // Add ordering and pagination
    query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const transactions = await query;

    // Get total count
    const [countResult] = await sql`
      SELECT COUNT(*) as total 
      FROM bill_transactions 
      WHERE user_id = ${session.id}
      ${status ? sql`AND status = ${status}` : sql``}
      ${category ? sql`AND category = ${category}` : sql``}
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
    console.error("Failed to fetch bill history:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch history",
      },
      { status: 500 }
    );
  }
}
