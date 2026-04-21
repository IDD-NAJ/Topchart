import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const callbackUrl = url.searchParams.get("callbackUrl") || "/dashboard";
    
    // Build Google OAuth URL
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", process.env.AUTH_GOOGLE_ID || "");
    googleAuthUrl.searchParams.set("redirect_uri", `${url.origin}/api/auth/callback/google`);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("state", Buffer.from(JSON.stringify({ callbackUrl })).toString("base64"));
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "consent");
    
    return NextResponse.redirect(googleAuthUrl);
  } catch (error) {
    console.error("Google authorize error:", error);
    return NextResponse.redirect(new URL("/login?error=oauth", request.url));
  }
}
