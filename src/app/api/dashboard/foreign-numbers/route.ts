import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { ForeignNumbersSummary } from "@/lib/actions/dashboard";

export async function GET(request: NextRequest) {
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
    let userId: string | null = null;
    try {
      const sessions = await sql`
        SELECT user_id FROM auth_sessions
        WHERE token = ${sessionToken} AND expires_at > NOW()
        LIMIT 1
      `;
      if (sessions.length > 0) userId = String(sessions[0].user_id);
    } catch {
      // try alternate auth table
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 }
      );
    }

    // Get recent foreign numbers (last 10)
    const numbers = await sql`
      SELECT 
        vn.id,
        vn.number,
        vs.name as service_name,
        vs.category as service_category,
        vs.picture_url as service_icon,
        vn.status,
        vn.expires_at,
        vn.completed_at,
        vn.created_at,
        vn.type,
        COALESCE(COUNT(vsms.id), 0) as sms_count
      FROM verification_numbers vn
      LEFT JOIN verification_services vs ON vn.service_id = vs.id
      LEFT JOIN verification_sms vsms ON vn.id = vsms.number_id
      WHERE vn.user_id = ${userId}
      GROUP BY vn.id, vs.id, vs.name, vs.category, vs.picture_url
      ORDER BY 
        CASE 
          WHEN vn.status = 'active' THEN 0
          WHEN vn.status = 'pending' THEN 1
          WHEN vn.status = 'completed' THEN 2
          ELSE 3
        END,
        vn.created_at DESC
      LIMIT 10
    `;

    // Get counts
    const totalCountResult = await sql`
      SELECT COUNT(*) as count
      FROM verification_numbers
      WHERE user_id = ${userId}
    `;

    const activeCountResult = await sql`
      SELECT COUNT(*) as count
      FROM verification_numbers
      WHERE user_id = ${userId} AND status = 'active'
    `;

    const summary: ForeignNumbersSummary = {
      numbers: numbers as any[],
      activeCount: parseInt(activeCountResult[0]?.count || 0),
      totalCount: parseInt(totalCountResult[0]?.count || 0),
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching foreign numbers:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
