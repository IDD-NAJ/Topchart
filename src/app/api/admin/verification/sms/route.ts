export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const numberId = searchParams.get("number_id");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query;
    
    if (numberId) {
      // Get SMS for specific number
      query = sql`
        SELECT 
          vsms.id,
          vsms.from_number,
          vsms.message,
          vsms.received_at,
          vsms.is_read,
          vsms.pvadeals_sms_id,
          vn.number as phone_number,
          vs.name as service_name,
          u.email as user_email
        FROM verification_sms vsms
        JOIN verification_numbers vn ON vsms.number_id = vn.id
        LEFT JOIN verification_services vs ON vn.service_id = vs.id
        LEFT JOIN users u ON vn.user_id = u.id
        WHERE vn.id = ${numberId}
        ORDER BY vsms.received_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      // Get recent SMS across all numbers
      query = sql`
        SELECT 
          vsms.id,
          vsms.from_number,
          vsms.message,
          vsms.received_at,
          vsms.is_read,
          vn.number as phone_number,
          vs.name as service_name,
          u.email as user_email
        FROM verification_sms vsms
        JOIN verification_numbers vn ON vsms.number_id = vn.id
        LEFT JOIN verification_services vs ON vn.service_id = vs.id
        LEFT JOIN users u ON vn.user_id = u.id
        ORDER BY vsms.received_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const sms = await query;

    // Get total count
    const countResult = numberId 
      ? await sql`SELECT COUNT(*) as total FROM verification_sms WHERE number_id = ${numberId}`
      : await sql`SELECT COUNT(*) as total FROM verification_sms`;

    return NextResponse.json({
      success: true,
      data: {
        sms,
        pagination: {
          total: parseInt(countResult[0]?.total || "0"),
          limit,
          offset,
        },
      },
    });
  } catch (error) {
    console.error("Admin SMS fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch SMS" },
      { status: 500 }
    );
  }
}
