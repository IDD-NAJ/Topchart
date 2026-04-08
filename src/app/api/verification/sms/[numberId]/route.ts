import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { getRequest } from "@/lib/pvadeals";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ numberId: string }> }
) {
  try {
    const { numberId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await sql`
      SELECT s.user_id FROM auth_sessions s
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
    }

    const userId = sessions[0].user_id;

    const numbers = await sql`
      SELECT vn.id, vn.pvadeals_request_id, vn.status, vn.expires_at
      FROM verification_numbers vn
      WHERE vn.id = ${numberId} AND vn.user_id = ${userId}
    `;

    if (numbers.length === 0) {
      return NextResponse.json({ success: false, error: "Number not found" }, { status: 404 });
    }

    const number = numbers[0];

    if (number.status !== "active") {
      const cachedSMS = await sql`
        SELECT id, from_number, message, received_at, is_read
        FROM verification_sms WHERE number_id = ${numberId}
        ORDER BY received_at DESC
      `;
      return NextResponse.json({
        success: true,
        data: { sms: cachedSMS, status: number.status, expired: true },
      });
    }

    // Poll PVADeals for latest request state / SMS
    if (number.pvadeals_request_id) {
      const result = await getRequest(number.pvadeals_request_id);
      if (result.success && result.data) {
        const pva = result.data;

        // Sync status
        const pvaStatus = pva.status?.toUpperCase();
        if (pvaStatus === "COMPLETED" || pvaStatus === "FLAGGED") {
          await sql`
            UPDATE verification_numbers
            SET status = 'completed', completed_at = NOW(), updated_at = NOW()
            WHERE id = ${numberId}
          `;
        } else if (pvaStatus === "EXPIRED") {
          await sql`
            UPDATE verification_numbers
            SET status = 'expired', updated_at = NOW()
            WHERE id = ${numberId}
          `;
        }

        // Store any SMS messages returned in the request
        if (Array.isArray((pva as any).messages)) {
          for (const msg of (pva as any).messages) {
            try {
              await sql`
                INSERT INTO verification_sms (
                  id, number_id, from_number, message, pvadeals_sms_id, received_at
                ) VALUES (
                  ${uuidv4()}, ${numberId}, ${msg.from || "Unknown"},
                  ${msg.message || msg.body || ""}, ${msg._id || msg.id || null},
                  ${msg.receivedAt || msg.received_at || new Date().toISOString()}
                )
                ON CONFLICT (pvadeals_sms_id) DO NOTHING
              `;
            } catch { /* ignore duplicates */ }
          }
        }
      }
    }

    const allSMS = await sql`
      SELECT id, from_number, message, received_at, is_read
      FROM verification_sms WHERE number_id = ${numberId}
      ORDER BY received_at DESC
    `;

    await sql`
      UPDATE verification_sms SET is_read = true
      WHERE number_id = ${numberId} AND is_read = false
    `;

    const hasVerificationCode = allSMS.some((sms: any) =>
      /\d{4,8}/.test(sms.message) || /verification|verify|code|otp/i.test(sms.message)
    );

    return NextResponse.json({
      success: true,
      data: {
        sms: allSMS,
        status: number.status,
        expired: new Date(number.expires_at) < new Date(),
        has_verification_code: hasVerificationCode,
      },
    });
  } catch (error) {
    console.error("Get SMS error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch SMS" }, { status: 500 });
  }
}
