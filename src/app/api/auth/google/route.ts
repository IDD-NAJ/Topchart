import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const env = getGoogleAuthEnv();
    
    if (!env.GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: "Google Auth is not configured" }, { status: 501 });
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.append("client_id", env.GOOGLE_CLIENT_ID);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", "openid email profile");
    authUrl.searchParams.append("access_type", "online");
    authUrl.searchParams.append("prompt", "select_account");

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Google Auth error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
