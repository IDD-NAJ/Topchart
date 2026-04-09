import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const decodedCode = decodeURIComponent(code);

    // First try to find in reseller_referral_links
    let link: any[] = [];
    try {
      link = await sql`
        SELECT * FROM reseller_referral_links
        WHERE referral_code = ${decodedCode}
        LIMIT 1
      `;
    } catch { link = []; }

    if (link.length > 0) {
      const referralLink = link[0] as any;
      
      // Increment clicks
      try {
        await sql`
          UPDATE reseller_referral_links
          SET clicks = clicks + 1
          WHERE id = ${referralLink.id}
        `;
      } catch { /* ignore click increment error */ }

      // Build redirect URL
      const landingPage = referralLink.landing_page || "/register";
      const url = new URL(request.url);
      const redirectUrl = new URL(landingPage, url.origin);
      redirectUrl.searchParams.set("ref", decodedCode);
      
      return NextResponse.redirect(redirectUrl);
    }

    // Fallback: try reseller_profiles.reseller_code
    let profile: any[] = [];
    try {
      profile = await sql`
        SELECT reseller_code FROM reseller_profiles
        WHERE reseller_code = ${decodedCode}
        LIMIT 1
      `;
    } catch { profile = []; }

    if (profile.length > 0) {
      const url = new URL(request.url);
      const redirectUrl = new URL("/register", url.origin);
      redirectUrl.searchParams.set("ref", decodedCode);
      return NextResponse.redirect(redirectUrl);
    }

    // Not found - redirect to home
    const url = new URL(request.url);
    return NextResponse.redirect(new URL("/", url.origin));

  } catch (error) {
    console.error("Referral redirect error:", error);
    const url = new URL(request.url);
    return NextResponse.redirect(new URL("/", url.origin));
  }
}
