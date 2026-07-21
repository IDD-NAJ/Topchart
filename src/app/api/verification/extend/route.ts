export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { toggleAutoRenew } from "@/lib/pvadeals";

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

    // Verify session and get user with wallet
    const sessions = await sql`
      SELECT s.user_id, u.wallet_balance
      FROM auth_sessions s
      JOIN users u ON s.user_id::text = u.id::text
      WHERE s.token = ${sessionToken}
        AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 }
      );
    }

    const user = sessions[0];
    const userId = user.user_id;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }

    const { numberId } = body;

    if (!numberId) {
      return NextResponse.json({ success: false, error: "Number ID is required" }, { status: 400 });
    }

    // Get LTR number details
    const numbers = await sql`
      SELECT vn.id, vn.pvadeals_request_id, vn.status, vn.auto_renew, vn.type
      FROM verification_numbers vn
      WHERE vn.id = ${numberId} AND vn.user_id = ${userId} AND vn.type = 'LTR'
    `;

    if (numbers.length === 0) {
      return NextResponse.json(
        { success: false, error: "LTR number not found" },
        { status: 404 }
      );
    }

    const number = numbers[0] as any;

    if (number.status !== "active") {
      return NextResponse.json({ success: false, error: "Number is not active" }, { status: 400 });
    }

    if (!number.pvadeals_request_id) {
      return NextResponse.json({ success: false, error: "No PVADeals request ID found" }, { status: 400 });
    }

    // Toggle auto-renew via PVADeals
    const toggleResult = await toggleAutoRenew(number.pvadeals_request_id);

    if (!toggleResult.success || !toggleResult.data) {
      return NextResponse.json(
        { success: false, error: toggleResult.error || "Failed to toggle auto-renew" },
        { status: 502 }
      );
    }

    const newAutoRenew = toggleResult.data.autoRenewEnable ?? !number.auto_renew;

    await sql`
      UPDATE verification_numbers
      SET auto_renew = ${newAutoRenew}, updated_at = NOW()
      WHERE id = ${numberId}
    `;

    return NextResponse.json({
      success: true,
      data: {
        number_id: numberId,
        auto_renew: newAutoRenew,
        message: newAutoRenew ? "Auto-renew enabled" : "Auto-renew disabled",
      },
    });
  } catch (error) {
    console.error("Extend rental error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to extend rental" },
      { status: 500 }
    );
  }
}
