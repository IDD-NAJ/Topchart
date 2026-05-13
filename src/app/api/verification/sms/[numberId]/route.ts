import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { syncPvadealsRequestAndSms } from "@/lib/verification-sms-sync";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ numberId: string }> }
) {
  try {
    const { numberId } = await context.params;
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

    const isExpired = number.expires_at != null && new Date(number.expires_at as string) < new Date();

    let responseStatus = String(number.status ?? "");
    if (number.pvadeals_request_id && !isExpired) {
      const synced = await syncPvadealsRequestAndSms({
        numberId,
        pvadealsRequestId: number.pvadeals_request_id,
      });
      if (synced.ok) {
        responseStatus = synced.dbStatus;
      } else {
        console.warn(`[SMS] Sync failed for ${numberId}: ${synced.error} — returning cached SMS`);
        responseStatus = "expired";
      }
    } else if (isExpired) {
      responseStatus = "expired";
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
        status: responseStatus,
        expired: isExpired,
        has_verification_code: hasVerificationCode,
      },
    });
  } catch (error) {
    console.error("Get SMS error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch SMS" }, { status: 500 });
  }
}
