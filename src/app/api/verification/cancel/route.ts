import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { cancelOrder } from "@/lib/textverified";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify session
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

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { numberId } = body;

    if (!numberId) {
      return NextResponse.json(
        { success: false, error: "Number ID is required" },
        { status: 400 }
      );
    }

    // Get number details
    const numbers = await sql`
      SELECT id, textverified_order_id, status, type, expires_at
      FROM verification_numbers
      WHERE id = ${numberId} AND user_id = ${userId}
    `;

    if (numbers.length === 0) {
      return NextResponse.json(
        { success: false, error: "Number not found" },
        { status: 404 }
      );
    }

    const number = numbers[0];

    if (number.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Number is not active" },
        { status: 400 }
      );
    }

    // Check if already expired
    if (new Date(number.expires_at) < new Date()) {
      await sql`
        UPDATE verification_numbers
        SET status = 'expired', updated_at = NOW()
        WHERE id = ${numberId}
      `;
      
      return NextResponse.json(
        { success: false, error: "Number has already expired" },
        { status: 400 }
      );
    }

    // Cancel with Textverified
    if (number.textverified_order_id) {
      await cancelOrder(number.textverified_order_id);
    }

    // Update status
    await sql`
      UPDATE verification_numbers
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${numberId}
    `;

    return NextResponse.json({
      success: true,
      data: {
        number_id: numberId,
        status: "cancelled",
      },
    });
  } catch (error) {
    console.error("Cancel number error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel number" },
      { status: 500 }
    );
  }
}
