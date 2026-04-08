import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { getRequest, reuseNumber } from "@/lib/pvadeals";

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
      SELECT s.user_id FROM auth_sessions s
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
    }

    const userId = (sessions[0] as any).user_id;
    const { searchParams } = new URL(request.url);
    const numberId = searchParams.get("numberId");

    if (!numberId) {
      return NextResponse.json({ success: false, error: "numberId is required" }, { status: 400 });
    }

    // Verify ownership and get pvadeals_request_id
    const rows = await sql`
      SELECT id, pvadeals_request_id, status, number, expires_at, allow_reuse
      FROM verification_numbers
      WHERE id = ${numberId} AND user_id = ${userId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "Number not found" }, { status: 404 });
    }

    const numRecord = rows[0] as any;

    if (!numRecord.pvadeals_request_id) {
      return NextResponse.json({ success: false, error: "No provider request ID" }, { status: 400 });
    }

    // Poll PVADeals for latest request state (includes messageCounter)
    const pvaResult = await getRequest(numRecord.pvadeals_request_id);

    if (!pvaResult.success || !pvaResult.data) {
      return NextResponse.json(
        { success: false, error: pvaResult.error || "Failed to fetch SMS status from provider" },
        { status: 502 }
      );
    }

    const pvaData = pvaResult.data;

    // Sync status changes back to DB
    const newStatus = pvaData.status === "COMPLETED"
      ? "completed"
      : pvaData.status === "FLAGGED"
      ? "cancelled"
      : pvaData.status === "EXPIRED"
      ? "expired"
      : "active";

    if (newStatus !== numRecord.status) {
      await sql`
        UPDATE verification_numbers
        SET status = ${newStatus}, allow_flag = ${pvaData.allowFlag}, allow_reuse = ${pvaData.allowReuse ?? false}, updated_at = NOW()
        WHERE id = ${numberId}
      `.catch(() => null);
    }

    // Load stored SMS messages from our DB
    let storedSms: any[] = [];
    try {
      storedSms = await sql`
        SELECT id, from_number, message, pvadeals_sms_id, received_at, is_read
        FROM verification_sms
        WHERE number_id = ${numberId}
        ORDER BY received_at DESC
      ` as any[];
    } catch { storedSms = []; }

    return NextResponse.json({
      success: true,
      data: {
        number_id: numberId,
        number: numRecord.number,
        status: newStatus,
        message_count: pvaData.messageCounter ?? storedSms.length,
        allow_reuse: pvaData.allowReuse ?? numRecord.allow_reuse,
        allow_flag: pvaData.allowFlag,
        reuse_counter: pvaData.reuseCounter ?? 0,
        expires_at: pvaData.endTime,
        sms: storedSms,
      },
    });
  } catch (error) {
    console.error("Verification SMS GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch SMS" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const userId = (sessions[0] as any).user_id;

    let body: any;
    try { body = await request.json(); } catch {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }

    const { numberId } = body;
    if (!numberId) {
      return NextResponse.json({ success: false, error: "numberId is required" }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, pvadeals_request_id, status, allow_reuse
      FROM verification_numbers
      WHERE id = ${numberId} AND user_id = ${userId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "Number not found" }, { status: 404 });
    }

    const numRecord = rows[0] as any;

    if (!numRecord.allow_reuse) {
      return NextResponse.json({ success: false, error: "Reuse not available for this number" }, { status: 400 });
    }

    const reuseResult = await reuseNumber(numRecord.pvadeals_request_id);

    if (!reuseResult.success || !reuseResult.data) {
      return NextResponse.json(
        { success: false, error: reuseResult.error || "Failed to reuse number" },
        { status: 502 }
      );
    }

    await sql`
      UPDATE verification_numbers
      SET allow_reuse = ${reuseResult.data.allowReuse ?? false}, updated_at = NOW()
      WHERE id = ${numberId}
    `.catch(() => null);

    return NextResponse.json({
      success: true,
      data: {
        number_id: numberId,
        reuse_counter: reuseResult.data.reuseCounter,
        allow_reuse: reuseResult.data.allowReuse,
        expires_at: reuseResult.data.endTime,
      },
    });
  } catch (error) {
    console.error("Verification SMS POST (reuse) error:", error);
    return NextResponse.json({ success: false, error: "Failed to reuse number" }, { status: 500 });
  }
}
