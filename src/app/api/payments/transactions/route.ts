import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Get the session token from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify the session
    const sessions = await sql`
      SELECT s.user_id
      FROM sessions s
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

    // Build query based on filters
    let transactions;
    
    if (type && status) {
      transactions = await sql`
        SELECT id, type, amount, status, description, reference, metadata, created_at
        FROM transactions
        WHERE user_id = ${userId}
          AND type = ${type}
          AND status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else if (type) {
      transactions = await sql`
        SELECT id, type, amount, status, description, reference, metadata, created_at
        FROM transactions
        WHERE user_id = ${userId}
          AND type = ${type}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else if (status) {
      transactions = await sql`
        SELECT id, type, amount, status, description, reference, metadata, created_at
        FROM transactions
        WHERE user_id = ${userId}
          AND status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      transactions = await sql`
        SELECT id, type, amount, status, description, reference, metadata, created_at
        FROM transactions
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    // Get total count for pagination
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM transactions
      WHERE user_id = ${userId}
    `;

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total: parseInt(countResult[0].total, 10),
          limit,
          offset,
          hasMore: offset + transactions.length < parseInt(countResult[0].total, 10),
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
