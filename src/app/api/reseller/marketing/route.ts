import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch marketing data (referral links, assets)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const sessions = await sql`
      SELECT u.id FROM auth_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
      LIMIT 1
    `;
    
    if (!sessions.length) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = (sessions[0] as { id: string }).id;
    
    // Get reseller profile
    let profile: any[] = [];
    try {
      profile = await sql`
        SELECT * FROM reseller_profiles
        WHERE user_id = ${userId}
      `;
    } catch { profile = []; }
    
    if (profile.length === 0) {
      return NextResponse.json({ success: false, error: "Not a reseller" }, { status: 403 });
    }
    
    const reseller = profile[0] as any;
    
    // Get referral links
    let referralLinks: any[] = [];
    try {
      referralLinks = await sql`
        SELECT * FROM reseller_referral_links
        WHERE reseller_id = ${reseller.id}
        ORDER BY created_at DESC
      `;
    } catch { referralLinks = []; }
    
    // Get marketing assets
    let assets: any[] = [];
    try {
      assets = await sql`
        SELECT * FROM marketing_assets
        WHERE is_active = true
        ORDER BY category, name
      `;
    } catch { assets = []; }
    
    return NextResponse.json({
      success: true,
      resellerCode: reseller.reseller_code,
      referralLinks,
      assets,
      stats: {
        totalClicks: referralLinks.reduce((sum: number, link: any) => sum + (link.clicks || 0), 0),
        totalConversions: referralLinks.reduce((sum: number, link: any) => sum + (link.conversions || 0), 0),
        totalAssets: assets.length
      }
    });
    
  } catch (error) {
    console.error("Reseller marketing GET error:", error);
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
      SELECT u.id FROM auth_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
      LIMIT 1
    `;
    
    if (!sessions.length) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = (sessions[0] as { id: string }).id;
    
    // Get reseller profile
    let profilePost: any[] = [];
    try {
      profilePost = await sql`
        SELECT * FROM reseller_profiles
        WHERE user_id = ${userId}
      `;
    } catch { profilePost = []; }
    
    if (profilePost.length === 0) {
      return NextResponse.json({ success: false, error: "Not a reseller" }, { status: 403 });
    }
    
    const reseller = profilePost[0] as any;
    const body = await request.json();
    const { landing_page, utm_source, utm_medium } = body;
    
    // Generate unique referral code
    const referralCode = `${reseller.reseller_code}-${Date.now().toString(36).toUpperCase()}`;
    
    const newLink = await sql`
      INSERT INTO reseller_referral_links (
        reseller_id,
        referral_code,
        landing_page,
        utm_source,
        utm_medium,
        clicks,
        conversions
      ) VALUES (
        ${reseller.id},
        ${referralCode},
        ${landing_page || '/register'},
        ${utm_source || null},
        ${utm_medium || null},
        0,
        0
      )
      RETURNING *
    `;
    
    return NextResponse.json({
      success: true,
      link: newLink[0]
    });
    
  } catch (error) {
    console.error("Reseller marketing POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a referral link
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const sessions = await sql`
      SELECT u.id FROM auth_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
      LIMIT 1
    `;
    
    if (!sessions.length) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = (sessions[0] as { id: string }).id;
    
    // Get reseller profile
    let profile: any[] = [];
    try {
      profile = await sql`
        SELECT * FROM reseller_profiles
        WHERE user_id = ${userId}
      `;
    } catch { profile = []; }
    
    if (profile.length === 0) {
      return NextResponse.json({ success: false, error: "Not a reseller" }, { status: 403 });
    }
    
    const reseller = profile[0] as any;
    
    const url = new URL(request.url);
    const linkId = url.searchParams.get("id");
    
    if (!linkId) {
      return NextResponse.json({ success: false, error: "Link ID required" }, { status: 400 });
    }
    
    // Delete the link (only if it belongs to this reseller)
    await sql`
      DELETE FROM reseller_referral_links
      WHERE id = ${linkId} AND reseller_id = ${reseller.id}
    `;
    
    return NextResponse.json({ success: true, message: "Link deleted" });
    
  } catch (error) {
    console.error("Reseller marketing DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
