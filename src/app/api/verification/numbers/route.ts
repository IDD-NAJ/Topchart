import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql, sqlUnsafe } from "@/lib/db";

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

    // Ensure tables exist before querying
    await sql`
      CREATE TABLE IF NOT EXISTS verification_services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pvadeals_service_id VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        picture_url VARCHAR(500),
        country VARCHAR(10) DEFAULT 'US',
        is_active BOOLEAN DEFAULT TRUE,
        markup_percentage DECIMAL(5,2) DEFAULT 40.00,
        str_price DECIMAL(10,4) DEFAULT 0,
        ltr3_price DECIMAL(10,4) DEFAULT 0,
        ltr7_price DECIMAL(10,4) DEFAULT 0,
        ltr14_price DECIMAL(10,4) DEFAULT 0,
        ltr30_price DECIMAL(10,4) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS verification_numbers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        service_id UUID,
        number VARCHAR(20) NOT NULL,
        type VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        pvadeals_request_id VARCHAR(100) UNIQUE,
        ltr_duration_days INTEGER,
        allow_flag BOOLEAN DEFAULT TRUE,
        allow_reuse BOOLEAN DEFAULT FALSE,
        auto_renew BOOLEAN DEFAULT FALSE,
        purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        rental_duration_hours INTEGER DEFAULT 0,
        expires_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS verification_sms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        number_id UUID NOT NULL,
        from_number VARCHAR(20),
        message TEXT NOT NULL,
        pvadeals_sms_id VARCHAR(100) UNIQUE,
        received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_read BOOLEAN DEFAULT FALSE
      )
    `;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const includeExpired = searchParams.get("include_expired") === "true";

    const BASE = `
      SELECT 
        vn.id, vn.number, vn.type, vn.status, vn.purchase_price,
        vn.rental_duration_hours, vn.ltr_duration_days,
        vn.allow_flag, vn.allow_reuse, vn.auto_renew,
        vn.expires_at, vn.completed_at, vn.created_at,
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
