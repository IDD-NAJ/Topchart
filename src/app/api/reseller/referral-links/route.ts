import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql, isPgMissingRelation } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - List referral links for current reseller
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
    
    // Get referral links
    const links = await sql`
      SELECT id, code, landing_page, clicks, conversions, is_active, created_at
      FROM referral_links
      WHERE reseller_id = ${resellerId}
      ORDER BY created_at DESC
    `;
    
    return NextResponse.json({
      success: true,
      links
    });
    
  } catch (error) {
    if (isPgMissingRelation(error)) {
      return NextResponse.json({ success: true, links: [] });
    }
    console.error("Error fetching referral links:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new referral link
export async function POST(request: NextRequest) {
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
      SELECT id, reseller_code FROM reseller_profiles
      WHERE user_id = ${userId}
    `;
    
    if (!profiles.length) {
      return NextResponse.json({ success: false, error: "Not a reseller" }, { status: 403 });
    }
    
    const resellerId = profiles[0].id;
    const resellerCode = profiles[0].reseller_code;
    
    const body = await request.json();
    const { landing_page = "/register" } = body;
    
    // Generate unique code for this link (reseller_code + timestamp suffix)
    const code = `${resellerCode}-${Date.now().toString(36)}`;
    
    // Create referral link
    const result = await sql`
      INSERT INTO referral_links (reseller_id, code, landing_page)
      VALUES (${resellerId}, ${code}, ${landing_page})
      RETURNING id, code, landing_page, created_at
    `;
    
    const link = result[0];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://topchart.gh';
    
    return NextResponse.json({
      success: true,
      link: {
        ...link,
        full_url: `${baseUrl}/r/${link.code}`
      }
    });
    
  } catch (error) {
    if (isPgMissingRelation(error)) {
      return NextResponse.json(
        { success: false, error: "Referral links require a database migration" },
        { status: 503 }
      );
    }
    console.error("Error creating referral link:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
