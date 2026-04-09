import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - List recent activity for current reseller
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const sessions = await sql`
      SELECT u.id, u.role FROM auth_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
      LIMIT 1
    `;
    
    if (!sessions.length) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = sessions[0].id;
    
    // Get reseller profile
    const profiles = await sql`
      SELECT id FROM reseller_profiles
      WHERE user_id = ${userId}
    `;
    
    if (!profiles.length) {
      return NextResponse.json({ success: false, error: "Not a reseller" }, { status: 403 });
    }
    
    const resellerId = profiles[0].id;
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const offset = (page - 1) * limit;
    
    // Build activities query
    let activities: any[] = [];
    
    // Get sales
    const sales = await sql`
      SELECT 
        id,
        'sale' as type,
        customer_phone as description,
        amount,
        profit,
        created_at
      FROM reseller_sales
      WHERE reseller_id = ${resellerId}
        ${type ? sql`AND 'sale' = ${type}` : sql``}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    // Get commissions
    const commissions = await sql`
      SELECT 
        id,
        'commission' as type,
        COALESCE(referred_user_id::text, 'Commission') as description,
        commission_amount as amount,
        commission_amount as profit,
        created_at
      FROM reseller_commissions
      WHERE reseller_id = ${resellerId}
        ${type ? sql`AND 'commission' = ${type}` : sql``}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    // Combine and sort by date
    activities = [...sales, ...commissions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
    
    // Get total count
    const totalCount = sales.length + commissions.length;
    
    return NextResponse.json({
      success: true,
      activities,
      total: totalCount,
      page,
      total_pages: Math.ceil(totalCount / limit)
    });
    
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
