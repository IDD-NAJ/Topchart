import { NextRequest, NextResponse } from "next/server";
import { generateOAuthState, getGoogleEnv, getGoogleRedirectUri } from "@/lib/google-oauth";
import { withRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const rateLimitedHandler = withRateLimit({ type: "oauth" });

async function handler(request: NextRequest) {
  try {
    const env = getGoogleEnv();
    if (!env) {
      return NextResponse.redirect(new URL("/login?error=google_not_configured", request.url));
    }

    const url = new URL(request.url);
    const callbackUrl = url.searchParams.get("callbackUrl") || "/dashboard";

    const { state, challenge } = generateOAuthState(callbackUrl);

    const redirectUri = getGoogleRedirectUri(request);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[GoogleAuth] Using redirect URI:', redirectUri);
      console.log('[GoogleAuth] Client ID:', env.clientId);
    }

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", env.clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("access_type", "online");
    authUrl.searchParams.set("prompt", "select_account");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    const response = NextResponse.redirect(authUrl.toString());

    response.cookies.set("google_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
      domain: process.env.NODE_ENV === "production" ? ".topchart.store" : undefined,
    });

    return response;
  } catch (error) {
    console.error("[GoogleAuth] Init error:", error);
    return NextResponse.redirect(new URL("/login?error=oauth_init_failed", request.url));
  }
}

export const GET = rateLimitedHandler(handler);
