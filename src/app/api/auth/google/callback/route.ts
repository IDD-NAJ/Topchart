import { NextRequest, NextResponse } from "next/server";
import { parseOAuthState, exchangeCodeForTokens, verifyIdToken, fetchUserInfo, encryptToken, type GoogleTokenResponse } from "@/lib/google-oauth";
import { handleGoogleAuth } from "@/lib/actions/auth";
import { shouldUseSecureCookies } from "@/lib/utils";
import { withRateLimit } from "@/lib/rate-limit";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

const rateLimitedHandler = withRateLimit({ type: "oauth" });

async function handler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL("/login?error=missing_params", request.url));
    }

    const cookieState = request.cookies.get("google_oauth_state")?.value;
    if (!cookieState || cookieState !== state) {
      console.error("[GoogleAuth] State mismatch - possible CSRF attack");
      return NextResponse.redirect(new URL("/login?error=invalid_state", request.url));
    }

    const parsedState = parseOAuthState(state);
    if (!parsedState) {
      console.error("[GoogleAuth] State parsing failed or expired");
      return NextResponse.redirect(new URL("/login?error=expired_state", request.url));
    }

    const callbackUrl = parsedState.callbackUrl || "/dashboard";

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "https://topchart.store";
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    const { tokens, error: tokenError } = await exchangeCodeForTokens(
      code,
      redirectUri,
      parsedState.pkceVerifier
    );

    if (tokenError || !tokens.access_token) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(tokenError || "no_token")}`, request.url));
    }

    let googleSub: string | null = null;
    let googleEmail: string | null = null;
    let googleEmailVerified = false;
    let firstName = "";
    let lastName = "";
    let picture: string | null = null;

    if (tokens.id_token) {
      const idPayload = await verifyIdToken(tokens.id_token, parsedState.nonce);
      if (idPayload) {
        googleSub = idPayload.sub;
        googleEmail = idPayload.email;
        googleEmailVerified = idPayload.email_verified ?? false;
        firstName = idPayload.given_name || "";
        lastName = idPayload.family_name || "";
        picture = idPayload.picture || null;
      }
    }

    if (!googleEmail) {
      const userInfo = await fetchUserInfo(tokens.access_token);
      if (!userInfo || !userInfo.email) {
        return NextResponse.redirect(new URL("/login?error=no_email", request.url));
      }
      googleSub = googleSub || userInfo.sub;
      googleEmail = userInfo.email;
      googleEmailVerified = googleEmailVerified || (userInfo.email_verified ?? false);
      if (!firstName) firstName = userInfo.given_name || "";
      if (!lastName) lastName = userInfo.family_name || "";
      if (!picture) picture = userInfo.picture || null;
    }

    const normalizedEmail = googleEmail.toLowerCase();

    const existingUsers = await sql`
      SELECT id, email, first_name, last_name, is_verified, role, wallet_balance, phone, referral_code, created_at
      FROM users WHERE email = ${normalizedEmail}
    `;

    let userId: string;

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      userId = existingUser.id;

      if (!existingUser.is_verified && googleEmailVerified) {
        await sql`UPDATE users SET is_verified = true, updated_at = NOW() WHERE id = ${userId}`;
      }
      if (!existingUser.first_name && firstName) {
        await sql`UPDATE users SET first_name = ${firstName}, updated_at = NOW() WHERE id = ${userId}`;
      }
      if (!existingUser.last_name && lastName) {
        await sql`UPDATE users SET last_name = ${lastName}, updated_at = NOW() WHERE id = ${userId}`;
      }
    } else {
      const result = await handleGoogleAuth({
        email: normalizedEmail,
        firstName,
        lastName,
      });

      if (!result.success || !result.token || !result.expiresAt || !result.user) {
        const errorMsg = result.error || "auth_failed";
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMsg)}`, request.url));
      }

      userId = result.user.id;

      const response = NextResponse.redirect(new URL(callbackUrl, request.url));
      response.cookies.set("session_token", result.token, {
        httpOnly: true,
        secure: shouldUseSecureCookies(),
        sameSite: "lax",
        expires: new Date(result.expiresAt),
        path: "/",
      });
      response.cookies.delete("google_oauth_state");
      return response;
    }

    const result = await handleGoogleAuth({
      email: normalizedEmail,
      firstName,
      lastName,
    });

    if (!result.success || !result.token || !result.expiresAt) {
      return NextResponse.redirect(new URL("/login?error=session_failed", request.url));
    }

    const response = NextResponse.redirect(new URL(callbackUrl, request.url));
    response.cookies.set("session_token", result.token, {
      httpOnly: true,
      secure: shouldUseSecureCookies(),
      sameSite: "lax",
      expires: new Date(result.expiresAt),
      path: "/",
    });
    response.cookies.delete("google_oauth_state");
    return response;
  } catch (error) {
    console.error("[GoogleAuth] Callback error:", error);
    return NextResponse.redirect(new URL("/login?error=callback_error", request.url));
  }
}

export const GET = rateLimitedHandler(handler);
