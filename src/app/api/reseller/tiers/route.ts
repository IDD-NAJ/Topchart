import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch reseller tier info and progress
async function GETHandler(request: NextRequest) {
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
    
    // Get all tiers
    let tiers: any[] = [];
    try {
      tiers = await sql`
        SELECT * FROM reseller_tiers
        ORDER BY min_sales_amount ASC
      `;
    } catch { tiers = []; }
    
    // Determine current tier
    let currentTier = tiers[0];
    let nextTier = null;
    let progress = 0;
    
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i] as any;
      if (reseller.total_sales >= tier.min_sales_amount) {
        currentTier = tier;
        if (i < tiers.length - 1) {
          nextTier = tiers[i + 1];
        }
      }
    }
    
    // Calculate progress to next tier
    if (nextTier) {
      const range = (nextTier as any).min_sales_amount - (currentTier as any).min_sales_amount;
      const achieved = reseller.total_sales - (currentTier as any).min_sales_amount;
      progress = Math.min(100, Math.round((achieved / range) * 100));
    } else {
      progress = 100;
    }
    
    return NextResponse.json({
      success: true,
      currentTier,
      nextTier,
      progress,
      totalSales: reseller.total_sales,
      totalReferrals: reseller.total_referrals,
      allTiers: tiers
    });
    
  } catch (error) {
    console.error("Reseller tiers GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Export GET with rate limiting
export const GET = withRateLimit({ type: "api" })(GETHandler);
