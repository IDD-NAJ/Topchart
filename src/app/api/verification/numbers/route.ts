import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql, sqlUnsafe } from "@/lib/db";
import { getRequest } from "@/lib/pvadeals";

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const includeExpired = searchParams.get("include_expired") === "true";

    const BASE = `
      SELECT 
        vn.id, vn.number, vn.type, vn.status, vn.purchase_price,
        vn.rental_duration_hours, vn.ltr_duration_days,
        vn.allow_flag, vn.allow_reuse, vn.auto_renew,
        vn.expires_at, vn.completed_at, vn.created_at,
        vn.pvadeals_request_id,
        vs.id as service_id, vs.name as service_name,
        vs.category as service_category, vs.picture_url as service_icon,
        COUNT(vsms.id) as sms_count
      FROM verification_numbers vn
      LEFT JOIN verification_services vs ON vn.service_id = vs.id
      LEFT JOIN verification_sms vsms ON vn.id = vsms.number_id
    `;
    const TAIL = `
      GROUP BY vn.id, vs.id, vs.name, vs.category, vs.picture_url
      ORDER BY vn.created_at DESC
    `;

    let numbers: any[];

    if (status && !includeExpired) {
      numbers = await sqlUnsafe(
        `${BASE} WHERE vn.user_id = $1 AND vn.status = $2 ${TAIL}`,
        [userId, status]
      ) as any[];
    } else if (!includeExpired) {
      numbers = await sqlUnsafe(
        `${BASE} WHERE vn.user_id = $1 AND (vn.status != 'expired' OR vn.expires_at > NOW() - INTERVAL '24 hours') ${TAIL}`,
        [userId]
      ) as any[];
    } else {
      numbers = await sqlUnsafe(
        `${BASE} WHERE vn.user_id = $1 ${TAIL}`,
        [userId]
      ) as any[];
    }

    const activeNumbers = numbers.filter((n: any) => n.status === "active" && n.pvadeals_request_id);
    if (activeNumbers.length > 0) {
      for (const num of activeNumbers) {
        try {
          const pvaResult = await getRequest(num.pvadeals_request_id);
          if (pvaResult.success && pvaResult.data) {
            const pvaStatus = pvaResult.data.status?.toUpperCase();
            if (pvaStatus && pvaStatus !== num.status) {
              const mappedStatus = pvaStatus === "COMPLETED" ? "completed"
                : pvaStatus === "FLAGGED" ? "cancelled"
                : pvaStatus === "EXPIRED" ? "expired"
                : null;
              if (mappedStatus) {
                await sql`
                  UPDATE verification_numbers
                  SET status = ${mappedStatus},
                      completed_at = CASE WHEN ${mappedStatus} IN ('completed', 'cancelled', 'expired') THEN COALESCE(completed_at, NOW()) ELSE completed_at END,
                      updated_at = NOW()
                  WHERE id = ${num.id}
                `;
                num.status = mappedStatus;
              }
            }
          }
        } catch (syncError) {
          console.error(`[Numbers] Failed to sync status for number ${num.id}:`, syncError);
        }
      }
    }

    // Calculate time remaining for active numbers
    const now = new Date();
    const numbersWithMeta = numbers.map((num: any) => {
      const expiresAt = num.expires_at ? new Date(num.expires_at) : null;
      const timeRemaining = expiresAt && num.status === "active" 
        ? Math.max(0, expiresAt.getTime() - now.getTime())
        : 0;
      
      return {
        ...num,
        time_remaining_ms: timeRemaining,
        time_remaining_formatted: formatDuration(timeRemaining),
        is_expired: timeRemaining === 0 && num.status === "active",
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        numbers: numbersWithMeta,
        summary: {
          total: numbers.length,
          active: numbers.filter((n: any) => n.status === "active").length,
          completed: numbers.filter((n: any) => n.status === "completed").length,
        },
      },
    });
  } catch (error) {
    console.error("Get verification numbers error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch numbers" },
      { status: 500 }
    );
  }
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "Expired";
  
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
