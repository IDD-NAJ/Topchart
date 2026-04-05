import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { checkSMS } from "@/lib/textverified";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ numberId: string }> }
) {
  try {
    const { numberId } = await params;
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

    // Verify number belongs to user
    const numbers = await sql`
      SELECT vn.id, vn.textverified_order_id, vn.status, vn.expires_at
      FROM verification_numbers vn
      WHERE vn.id = ${numberId} AND vn.user_id = ${userId}
    `;

    if (numbers.length === 0) {
      return NextResponse.json(
        { success: false, error: "Number not found" },
        { status: 404 }
      );
    }

    const number = numbers[0];

    // Check if number is still active
    if (number.status !== "active") {
      // Return cached SMS even if expired
      const cachedSMS = await sql`
        SELECT 
          id, from_number, message, received_at, is_read
        FROM verification_sms
        WHERE number_id = ${numberId}
        ORDER BY received_at DESC
      `;

      return NextResponse.json({
        success: true,
        data: {
          sms: cachedSMS,
          status: number.status,
          expired: true,
        },
      });
    }

    // Sync with Textverified API for latest SMS
    const smsResult = await checkSMS(number.textverified_order_id);
    
    if (smsResult.success && smsResult.data) {
      // Store new SMS in database
      for (const sms of smsResult.data) {
        try {
          await sql`
            INSERT INTO verification_sms (
              number_id, from_number, message, textverified_sms_id, received_at
            ) VALUES (
              ${numberId}, ${sms.from}, ${sms.message}, ${sms.id}, ${sms.received_at}
            )
            ON CONFLICT (textverified_sms_id) DO NOTHING
          `;
        } catch (e) {
          // Ignore duplicates
        }
      }
    }

    // Fetch all SMS from database
    const allSMS = await sql`
      SELECT 
        id, from_number, message, received_at, is_read
      FROM verification_sms
      WHERE number_id = ${numberId}
      ORDER BY received_at DESC
    `;

    // Mark as read
    await sql`
      UPDATE verification_sms
      SET is_read = true
      WHERE number_id = ${numberId} AND is_read = false
    `;

    // Check if we got verification SMS (common patterns)
    const hasVerificationCode = allSMS.some((sms: any) => 
      /\d{4,8}/.test(sms.message) || 
      /verification|verify|code|otp/i.test(sms.message)
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
    return NextResponse.json(
      { success: false, error: "Failed to fetch SMS" },
      { status: 500 }
    );
  }
}
