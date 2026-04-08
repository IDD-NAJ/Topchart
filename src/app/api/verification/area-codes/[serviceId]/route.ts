import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { getServiceAreaCodes } from "@/lib/pvadeals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const sessions = await sql`
      SELECT s.user_id FROM auth_sessions s
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 }
      );
    }

    const { serviceId } = await params;

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: "serviceId is required" },
        { status: 400 }
      );
    }

    // Fetch area codes from PVADeals
    const result = await getServiceAreaCodes(serviceId);

    if (!result.success) {
      // If the endpoint doesn't exist or returns error, return empty array
      // Client will fall back to hardcoded list
      return NextResponse.json({
        success: true,
        data: { areaCodes: [] },
        fallback: true,
        message: "Area codes not available from provider",
      });
    }

    return NextResponse.json({
      success: true,
      data: { areaCodes: result.data?.areaCodes || [] },
    });
  } catch (error) {
    console.error("Area codes fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch area codes" },
      { status: 500 }
    );
  }
}
