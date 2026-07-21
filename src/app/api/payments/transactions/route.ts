export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const sessions = await sql`
      SELECT s.user_id
      FROM auth_sessions s
      WHERE s.token = ${sessionToken}
        AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 }
      );
    }

    const userId = sessions[0].user_id;

    const transactions = await sql`
      SELECT id, type, amount, status, description, reference, metadata, created_at,
             COUNT(*) OVER() as total_count
      FROM transactions
      WHERE user_id = ${userId}
        ${type ? sql`AND type = ${type}` : sql``}
        ${status ? sql`AND status = ${status}` : sql``}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const totalCount = transactions.length > 0 ? parseInt(String(transactions[0].total_count), 10) : 0;

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions.map(({ total_count, ...tx }) => tx),
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + transactions.length < totalCount,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
