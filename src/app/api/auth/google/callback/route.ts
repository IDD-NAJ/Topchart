import { NextRequest, NextResponse } from "next/server";
import { parseOAuthState, exchangeCodeForTokens, verifyIdToken, fetchUserInfo, encryptToken, getGoogleRedirectUri, type GoogleTokenResponse } from "@/lib/google-oauth";
import { handleGoogleAuth } from "@/lib/actions/auth";
import { shouldUseSecureCookies } from "@/lib/utils";
import { withRateLimit } from "@/lib/rate-limit";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

const rateLimitedHandler = withRateLimit({ type: "oauth" });

async function handler(request: NextRequest) {
  try {
    console.log('[GoogleAuth Callback] Starting OAuth callback');
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    console.log('[GoogleAuth Callback] Received params - code:', !!code, 'state:', !!state, 'error:', error);

    if (error) {
      console.error('[GoogleAuth Callback] OAuth error from Google:', error);
      const productionUrl = process.env.NODE_ENV === "production" ? "https://topchart.store" : request.url;
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, productionUrl), 307);
    }

    if (!code || !state) {
      console.error('[GoogleAuth Callback] Missing required params');
      const productionUrl = process.env.NODE_ENV === "production" ? "https://topchart.store" : request.url;
      return NextResponse.redirect(new URL("/login?error=missing_params", productionUrl), 307);
    }

    const cookieState = request.cookies.get("google_oauth_state")?.value;
    if (!cookieState || cookieState !== state) {
      console.error('[GoogleAuth Callback] State mismatch - possible CSRF attack');
      const productionUrl = process.env.NODE_ENV === "production" ? "https://topchart.store" : request.url;
      return NextResponse.redirect(new URL("/login?error=invalid_state", productionUrl), 307);
    }

    const parsedState = parseOAuthState(state);
    if (!parsedState) {
      console.error('[GoogleAuth Callback] State parsing failed or expired');
      const productionUrl = process.env.NODE_ENV === "production" ? "https://topchart.store" : request.url;
      return NextResponse.redirect(new URL("/login?error=expired_state", productionUrl), 307);
    }

    let callbackUrl = parsedState.callbackUrl || "/dashboard";
    
    // Force callback URL to use production domain
    if (process.env.NODE_ENV === "production") {
      const productionUrl = "https://topchart.store";
      try {
        const callbackObj = new URL(callbackUrl, request.url);
        if (callbackObj.hostname !== "topchart.store" && callbackObj.hostname !== "www.topchart.store") {
          callbackUrl = callbackObj.pathname;
          callbackUrl = `${productionUrl}${callbackUrl}`;
        }
      } catch {
        // If URL parsing fails, ensure it's a relative path
        if (callbackUrl.startsWith("/")) {
          callbackUrl = `${productionUrl}${callbackUrl}`;
        } else {
          callbackUrl = `${productionUrl}/${callbackUrl}`;
        }
      }
    }

    console.log('[GoogleAuth Callback] Callback URL:', callbackUrl);

    const redirectUri = getGoogleRedirectUri(request);
    console.log('[GoogleAuth Callback] Redirect URI:', redirectUri);

    const { tokens, error: tokenError } = await exchangeCodeForTokens(
      code,
      redirectUri,
      parsedState.pkceVerifier
    );

    if (tokenError || !tokens.access_token) {
      console.error('[GoogleAuth Callback] Token exchange failed:', tokenError);
      const productionUrl = process.env.NODE_ENV === "production" ? "https://topchart.store" : request.url;
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(tokenError || "no_token")}`, productionUrl), 307);
    }

    console.log('[GoogleAuth Callback] Token exchange successful');

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
        console.log('[GoogleAuth Callback] ID token verified for email:', googleEmail);
      }
    }

    if (!googleEmail) {
      const userInfo = await fetchUserInfo(tokens.access_token);
      if (!userInfo || !userInfo.email) {
        console.error('[GoogleAuth Callback] No email from user info');
        const productionUrl = process.env.NODE_ENV === "production" ? "https://topchart.store" : request.url;
        return NextResponse.redirect(new URL("/login", productionUrl), 307);
      }
      googleSub = googleSub || userInfo.sub;
      googleEmail = userInfo.email;
      googleEmailVerified = googleEmailVerified || (userInfo.email_verified ?? false);
      if (!firstName) firstName = userInfo.given_name || "";
      if (!lastName) lastName = userInfo.family_name || "";
      if (!picture) picture = userInfo.picture || null;
      console.log('[GoogleAuth Callback] User info fetched for email:', googleEmail);
    }

    const normalizedEmail = googleEmail.toLowerCase();
    console.log('[GoogleAuth Callback] Normalized email:', normalizedEmail);

    const existingUsers = await sql`
      SELECT id, email, first_name, last_name, is_verified, role, wallet_balance, phone, referral_code, created_at
      FROM users WHERE email = ${normalizedEmail}
    `;

    console.log('[GoogleAuth Callback] Existing users found:', existingUsers.length);

    let userId: string;

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      userId = existingUser.id;
      console.log('[GoogleAuth Callback] Existing user found, ID:', userId);

      if (!existingUser.is_verified && googleEmailVerified) {
        await sql`UPDATE users SET is_verified = true, updated_at = NOW() WHERE id = ${userId}`;
        console.log('[GoogleAuth Callback] User verified');
      }
      if (!existingUser.first_name && firstName) {
        await sql`UPDATE users SET first_name = ${firstName}, updated_at = NOW() WHERE id = ${userId}`;
        console.log('[GoogleAuth Callback] First name updated');
      }
      if (!existingUser.last_name && lastName) {
        await sql`UPDATE users SET last_name = ${lastName}, updated_at = NOW() WHERE id = ${userId}`;
        console.log('[GoogleAuth Callback] Last name updated');
      }
    } else {
      console.log('[GoogleAuth Callback] No existing user, creating new user');
      const result = await handleGoogleAuth({
        email: normalizedEmail,
        firstName,
        lastName,
      });

      console.log('[GoogleAuth Callback] handleGoogleAuth result:', result.success, result.error);

      if (!result.success || !result.token || !result.expiresAt || !result.user) {
        const errorMsg = result.error || "auth_failed";
        console.error('[GoogleAuth Callback] handleGoogleAuth failed:', errorMsg);
        const productionUrl = process.env.NODE_ENV === "production" ? "https://topchart.store" : request.url;
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMsg)}`, productionUrl), 307);
      }

      userId = result.user.id;
      console.log('[GoogleAuth Callback] New user created, ID:', userId);

      const productionUrl = process.env.NODE_ENV === "production" ? "https://topchart.store" : request.url;
      const targetUrl = new URL(callbackUrl, productionUrl);
      
      // Use HTML redirect to prevent callback URL from showing in browser
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta http-equiv="refresh" content="0;url=${targetUrl.toString()}">
          <script>window.location.href="${targetUrl.toString()}";</script>
        </head>
        <body>Redirecting...</body>
        </html>
      `;
      
      const response = new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Set-Cookie': `session_token=${result.token}; Path=/; HttpOnly; ${shouldUseSecureCookies() ? 'Secure; ' : ''}SameSite=lax; Expires=${new Date(result.expiresAt).toUTCString()}${process.env.NODE_ENV === 'production' ? '; Domain=.topchart.store' : ''}`,
        },
      });
      response.cookies.delete("google_oauth_state");
      console.log('[GoogleAuth Callback] Redirecting to:', targetUrl.toString());
      return response;
    }

    console.log('[GoogleAuth Callback] Creating session for existing user');
    const result = await handleGoogleAuth({
      email: normalizedEmail,
      firstName,
      lastName,
    });

    console.log('[GoogleAuth Callback] handleGoogleAuth result for existing user:', result.success, result.error);

    if (!result.success || !result.token || !result.expiresAt) {
      console.error('[GoogleAuth Callback] Session creation failed for existing user');
      const productionUrl = process.env.NODE_ENV === "production" ? "https://topchart.store" : request.url;
      return NextResponse.redirect(new URL("/login?error=session_failed", productionUrl), 307);
    }

    const productionUrl = process.env.NODE_ENV === "production" ? "https://topchart.store" : request.url;
    const targetUrl = new URL(callbackUrl, productionUrl);
    
    // Use HTML redirect to prevent callback URL from showing in browser
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="refresh" content="0;url=${targetUrl.toString()}">
        <script>window.location.href="${targetUrl.toString()}";</script>
      </head>
      <body>Redirecting...</body>
      </html>
    `;
    
    const response = new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Set-Cookie': `session_token=${result.token}; Path=/; HttpOnly; ${shouldUseSecureCookies() ? 'Secure; ' : ''}SameSite=lax; Expires=${new Date(result.expiresAt).toUTCString()}${process.env.NODE_ENV === 'production' ? '; Domain=.topchart.store' : ''}`,
      },
    });
    response.cookies.delete("google_oauth_state");
    console.log('[GoogleAuth Callback] Redirecting existing user to:', targetUrl.toString());
    return response;
  } catch (error) {
    console.error("[GoogleAuth Callback] Callback error:", error);
    if (error instanceof Error) {
      console.error('[GoogleAuth Callback] Error message:', error.message);
      console.error('[GoogleAuth Callback] Error stack:', error.stack);
    }
    const productionUrl = process.env.NODE_ENV === "production" ? "https://topchart.store" : request.url;
    return NextResponse.redirect(new URL("/login?error=callback_error", productionUrl), 307);
  }
}

export const GET = rateLimitedHandler(handler);
