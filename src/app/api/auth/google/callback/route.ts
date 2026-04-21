import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthEnv } from "@/lib/env";
import { handleGoogleAuth } from "@/lib/actions/auth";
import { shouldUseSecureCookies } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=No+authorization+code+provided", request.url));
    }

    const env = getGoogleAuthEnv();
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.redirect(new URL("/login?error=Google+Auth+not+configured", request.url));
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    // Exchange code for token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errorData = await tokenRes.text();
      console.error("Failed to exchange token:", errorData);
      return NextResponse.redirect(new URL("/login?error=Failed+to+exchange+token", request.url));
    }

    const tokenData = await tokenRes.json();

    // Fetch user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(new URL("/login?error=Failed+to+fetch+user+profile", request.url));
    }

    const userData = await userRes.json();

    if (!userData.email) {
      return NextResponse.redirect(new URL("/login?error=Google+account+must+have+an+email", request.url));
    }

    // Authenticate / Register with DB
    const result = await handleGoogleAuth({
      email: userData.email,
      firstName: userData.given_name || "",
      lastName: userData.family_name || "",
    });

    if (result.success && result.token && result.expiresAt) {
      const response = NextResponse.redirect(new URL("/dashboard", request.url));
      
      response.cookies.set("session_token", result.token, {
        httpOnly: true,
        secure: shouldUseSecureCookies(),
        sameSite: "lax",
        expires: new Date(result.expiresAt),
        path: "/",
      });

      return response;
    } else {
      const errorMsg = result.error || "Authentication+failed";
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMsg)}`, request.url));
    }
  } catch (error) {
    console.error("Google Callback error:", error);
    return NextResponse.redirect(new URL("/login?error=Internal+Server+Error", request.url));
  }
}
