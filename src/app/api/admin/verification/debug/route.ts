import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { getRequest, getRequestSMS } from "@/lib/pvadeals";
import { isPvadealsConfigured } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await sql`
      SELECT s.user_id, u.email
      FROM auth_sessions s
      JOIN users u ON s.user_id::text = u.id::text
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const numberId = searchParams.get("numberId");
    const rawRequestId = searchParams.get("requestId");

    if (!numberId && !rawRequestId) {
      return NextResponse.json(
        { success: false, error: "Provide ?numberId= or ?requestId= query param" },
        { status: 400 }
      );
    }

    let pvadealsRequestId = rawRequestId ?? null;
    let dbRow: Record<string, unknown> | null = null;

    if (numberId) {
      const rows = await sql`
        SELECT id, number, pvadeals_request_id, status, expires_at, allow_reuse
        FROM verification_numbers
        WHERE id = ${numberId}
      `;
      if (rows.length === 0) {
        return NextResponse.json({ success: false, error: "Number not found" }, { status: 404 });
      }
      dbRow = rows[0] as Record<string, unknown>;
      pvadealsRequestId = (dbRow.pvadeals_request_id as string | null) ?? null;
    }

    const configured = isPvadealsConfigured();
    if (!pvadealsRequestId) {
      return NextResponse.json({
        success: false,
        error: "No pvadeals_request_id found for this number",
        pvadealsConfigured: configured,
        dbRow,
      });
    }

    const [requestResult, smsResult] = await Promise.allSettled([
      getRequest(pvadealsRequestId),
      getRequestSMS(pvadealsRequestId),
    ]);

    let storedSms: unknown[] = [];
    if (numberId) {
      try {
        storedSms = await sql`
          SELECT id, from_number, message, pvadeals_sms_id, received_at, is_read
          FROM verification_sms
          WHERE number_id = ${numberId}
          ORDER BY received_at DESC
          LIMIT 20
        ` as unknown[];
      } catch (e: any) {
        storedSms = [{ error: e?.message ?? String(e) }];
      }
    }

    return NextResponse.json({
      success: true,
      pvadealsConfigured: configured,
      pvadealsRequestId,
      dbRow: dbRow ?? undefined,
      getRequest: requestResult.status === "fulfilled"
        ? requestResult.value
        : { error: String((requestResult as PromiseRejectedResult).reason) },
      getRequestSMS: smsResult.status === "fulfilled"
        ? smsResult.value
        : { error: String((smsResult as PromiseRejectedResult).reason) },
      storedSmsCount: Array.isArray(storedSms) ? storedSms.length : 0,
      storedSms,
    });
  } catch (error: any) {
    console.error("[admin/verification/debug] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
