import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { syncPvadealsRequestAndSms } from "@/lib/verification-sms-sync";
import { getSmspvaSMS } from "@/lib/smspva";

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

    let numbers: any[];
    try {
      numbers = await sql`
        SELECT vn.id, vn.pvadeals_request_id, vn.status, vn.expires_at,
               vn.metadata
        FROM verification_numbers vn
        WHERE vn.id = ${numberId} AND vn.user_id = ${userId}
      ` as any[];
    } catch {
      numbers = await sql`
        SELECT vn.id, vn.pvadeals_request_id, vn.status, vn.expires_at
        FROM verification_numbers vn
        WHERE vn.id = ${numberId} AND vn.user_id = ${userId}
      ` as any[];
    }

    if (numbers.length === 0) {
      return NextResponse.json({ success: false, error: "Number not found" }, { status: 404 });
    }

    const number = numbers[0];
    const meta = (number.metadata as any) || {};
    const provider: string = meta.provider || "pvadeals";
    const smspvaOrderId: number | undefined = meta.smspva_order_id
      ? parseInt(String(meta.smspva_order_id), 10)
      : undefined;
    const smspvaService: string | undefined = meta.smspva_service;

    const isExpired = number.expires_at != null && new Date(number.expires_at as string) < new Date();

    let responseStatus = String(number.status ?? "");

    if (isExpired) {
      responseStatus = "expired";
    } else if (provider === "smspva" && smspvaOrderId && smspvaService) {
      const smsResult = await getSmspvaSMS(smspvaOrderId, smspvaService);
      if (smsResult.ok && !("pending" in smsResult && smsResult.pending)) {
        const data = (smsResult as any).data;
        if (data?.sms) {
          const smsId = `smspva-${smspvaOrderId}`;
          await sql`
            INSERT INTO verification_sms (id, number_id, from_number, message, received_at, is_read)
            VALUES (${smsId}, ${numberId}, ${"SMSPVA"}, ${data.text || data.sms}, NOW(), false)
            ON CONFLICT (id) DO NOTHING
          `.catch(() => {});
          responseStatus = "active";
        }
      } else if (!smsResult.ok) {
        console.warn(`[SMS] SMSPVA poll failed for ${numberId}: ${(smsResult as any).error}`);
      }
    } else if (number.pvadeals_request_id && provider === "pvadeals") {
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
