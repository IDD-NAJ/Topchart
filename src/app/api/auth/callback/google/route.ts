import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

interface GoogleUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email: string;
  email_verified?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(new URL("/login?error=oauth_denied", request.url));
    }
    
    if (!code) {
      return NextResponse.redirect(new URL("/login?error=no_code", request.url));
    }
    
    // Parse state to get callback URL
    let callbackUrl = "/dashboard";
    try {
      if (state) {
        const stateData = JSON.parse(Buffer.from(state, "base64").toString());
        callbackUrl = stateData.callbackUrl || "/dashboard";
      }
    } catch {
      // ignore state parsing errors
    }
    
    // Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.AUTH_GOOGLE_ID || "",
        client_secret: process.env.AUTH_GOOGLE_SECRET || "",
        redirect_uri: `${url.origin}/api/auth/callback/google`,
        grant_type: "authorization_code",
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Google token exchange error:", errorData);
      return NextResponse.redirect(new URL("/login?error=token_exchange", request.url));
    }
    
    const tokens: GoogleTokenResponse = await tokenResponse.json();
    
    // Fetch user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });
    
    if (!userInfoResponse.ok) {
      console.error("Failed to fetch user info from Google");
      return NextResponse.redirect(new URL("/login?error=user_info", request.url));
    }
    
    const googleUser: GoogleUserInfo = await userInfoResponse.json();
    
    // Check if user already exists with this email
    const existingUsers = await sql`
      SELECT id, email, first_name, last_name, password_hash, is_verified, role, wallet_balance, referral_code, created_at
      FROM users 
      WHERE email = ${googleUser.email.toLowerCase()}
    `;
    
    let userId: string;
    const now = new Date().toISOString();
    
    if (existingUsers.length > 0) {
      // User exists - link the Google account
      const existingUser = existingUsers[0];
      userId = existingUser.id;
      
      // Check if account already linked
      const existingAccounts = await sql`
        SELECT id FROM accounts 
        WHERE user_id = ${userId} AND provider = 'google' AND provider_account_id = ${googleUser.sub}
      `;
      
      if (existingAccounts.length === 0) {
        // Link the Google account
        await sql`
          INSERT INTO accounts (
            user_id, type, provider, provider_account_id, 
            access_token, refresh_token, expires_at, token_type, scope, id_token
          )
          VALUES (
            ${userId}, 'oauth', 'google', ${googleUser.sub},
            ${tokens.access_token}, ${tokens.refresh_token || null}, 
            ${tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null},
            ${tokens.token_type || 'Bearer'}, ${tokens.scope || null}, ${tokens.id_token || null}
          )
        `;
      }
      
      // Update user info from Google if missing
      if (!existingUser.first_name && googleUser.given_name) {
        await sql`UPDATE users SET first_name = ${googleUser.given_name} WHERE id = ${userId}`;
      }
      if (!existingUser.last_name && googleUser.family_name) {
        await sql`UPDATE users SET last_name = ${googleUser.family_name} WHERE id = ${userId}`;
      }
      if (googleUser.picture) {
        await sql`UPDATE users SET image = ${googleUser.picture} WHERE id = ${userId}`;
      }
      if (!existingUser.is_verified && googleUser.email_verified) {
        await sql`UPDATE users SET is_verified = true WHERE id = ${userId}`;
      }
    } else {
      // Create new user
      userId = uuidv4();
      const referralCode = userId.slice(0, 8).toUpperCase();
      
      // Generate a random password hash (user won't use it, but required for DB constraint)
      const randomPassword = await bcrypt.hash(uuidv4(), 10);
      
      try {
        await sql`
          INSERT INTO users (
            id, email, phone, password_hash, first_name, last_name, 
            wallet_balance, is_verified, role, referral_code, created_at, updated_at, image
          )
          VALUES (
            ${userId}, 
            ${googleUser.email.toLowerCase()}, 
            '',
            ${randomPassword},
            ${googleUser.given_name || googleUser.name?.split(' ')[0] || ''},
            ${googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || ''},
            0.00, 
            ${googleUser.email_verified ? true : false}, 
            'USER', 
            ${referralCode}, 
            ${now}, 
            ${now},
            ${googleUser.picture || null}
          )
        `;
      } catch (err) {
        console.error("Error creating user:", err);
        return NextResponse.redirect(new URL("/login?error=user_creation", request.url));
      }
      
      // Create the account link
      await sql`
        INSERT INTO accounts (
          user_id, type, provider, provider_account_id, 
          access_token, refresh_token, expires_at, token_type, scope, id_token
        )
        VALUES (
          ${userId}, 'oauth', 'google', ${googleUser.sub},
          ${tokens.access_token}, ${tokens.refresh_token || null}, 
          ${tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null},
          ${tokens.token_type || 'Bearer'}, ${tokens.scope || null}, ${tokens.id_token || null}
        )
      `;
    }
    
    // Create a session
    const sessionToken = uuidv4();
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await sql`
      INSERT INTO auth_sessions (id, user_id, token, expires_at, created_at)
      VALUES (${sessionId}, ${userId}, ${sessionToken}, ${expiresAt.toISOString()}, ${now})
    `;
    
    // Set cookies and redirect
    const response = NextResponse.redirect(new URL(callbackUrl, request.url));
    
    // Set the legacy session cookie
    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });
    
    // Set the NextAuth session cookie
    response.cookies.set("next-auth.session-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });
    
    return response;
  } catch (error) {
    console.error("Google callback error:", error);
    return NextResponse.redirect(new URL("/login?error=callback", request.url));
  }
}
