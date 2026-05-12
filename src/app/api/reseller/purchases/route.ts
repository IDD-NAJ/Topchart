import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) return null;

  const sessions = await sql`
    SELECT u.id FROM auth_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
    LIMIT 1
  `;

  if (!Array.isArray(sessions) || sessions.length === 0) return null;

  return sessions[0];
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profiles = await sql`
      SELECT id FROM reseller_profiles
      WHERE user_id = ${user.id}
    `;

    if (!profiles.length) {
      return NextResponse.json(
        { success: false, error: "Not a reseller" },
        { status: 403 }
      );
    }

    const resellerId = profiles[0].id;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const purchases = await sql`
      SELECT
        id,
        customer_phone,
        product_type,
        network,
        amount,
        cost_price,
        selling_price,
        profit,
        status,
        reference,
        created_at
      FROM reseller_sales
      WHERE reseller_id = ${resellerId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const totalCountResult = await sql`
      SELECT COUNT(*) as count
      FROM reseller_sales
      WHERE reseller_id = ${resellerId}
    `;

    const total = Number(totalCountResult[0]?.count || 0);

    return NextResponse.json({
      success: true,
      purchases,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error("Recent purchases GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
