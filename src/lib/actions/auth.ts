"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { isPgMissingRelation, sql } from "@/lib/db";
import { ROLES } from "@/lib/roles";
import { shouldUseSecureCookies } from "@/lib/utils";

export interface User {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  wallet_balance: number;
  is_verified: boolean;
  role?: string;
  referral_code?: string;
  created_at: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  token?: string;
  expiresAt?: Date;
}

async function insertSessionRecord(params: {
  sessionId: string;
  userId: string;
  token: string;
  expiresAtIso: string;
  nowIso: string;
}) {
  try {
    await sql`
      INSERT INTO auth_sessions (id, user_id, token, expires_at, created_at)
      VALUES (${params.sessionId}, ${params.userId}, ${params.token}, ${params.expiresAtIso}, ${params.nowIso})
    `;
  } catch (error) {
    if (!isPgMissingRelation(error)) throw error;
    await sql`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (${params.sessionId}, ${params.userId}, ${params.token}, ${params.expiresAtIso}, ${params.nowIso})
    `;
  }
}

async function pruneUserSessions(userId: string) {
  try {
    await sql`
      DELETE FROM auth_sessions
      WHERE user_id = ${userId}
        AND id NOT IN (
          SELECT id FROM auth_sessions
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
          LIMIT 3
        )
    `;
  } catch (error) {
    if (!isPgMissingRelation(error)) throw error;
    await sql`
      DELETE FROM sessions
      WHERE user_id = ${userId}
        AND id NOT IN (
          SELECT id FROM sessions
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
          LIMIT 3
        )
    `;
  }
}

async function deleteSessionByToken(token: string) {
  try {
    await sql`DELETE FROM auth_sessions WHERE token::text = ${token}`;
  } catch (error) {
    if (!isPgMissingRelation(error)) throw error;
    await sql`DELETE FROM sessions WHERE token::text = ${token}`;
  }
}

export async function register(formData: {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  referralCode?: string;
}): Promise<AuthResult> {
  try {
    const { email, phone, password, firstName, lastName, referralCode } = formData;

    // Validation
    if (!email || !phone || !password || !firstName || !lastName) {
      return { success: false, error: "All fields are required" };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Invalid email format" };
    }

    // Phone validation
    const phoneRegex = /^0[2-5][0-9]\d{7}$/;
    if (!phoneRegex.test(phone)) {
      return { success: false, error: "Please enter a valid Ghanaian phone number" };
    }

    // Password validation
    if (password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }
    if (!/[A-Z]/.test(password)) {
      return { success: false, error: "Password must contain at least one uppercase letter" };
    }
    if (!/[0-9]/.test(password)) {
      return { success: false, error: "Password must contain at least one number" };
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return { success: false, error: "Password must contain at least one special character" };
    }
    
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();
    
    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${normalizedEmail} OR phone = ${phone}
    `;
    
    if (existingUser.length > 0) {
      return { success: false, error: "User with this email or phone already exists" };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Look up reseller referrer if referral code provided
    let referredBy: string | null = null;
    let referrerResellerId: string | null = null;
    if (referralCode) {
      const referrer = await sql`
        SELECT id, user_id, reseller_code FROM reseller_profiles
        WHERE reseller_code = ${referralCode.toUpperCase()}
      `;
      if (referrer.length > 0) {
        referredBy = referrer[0].reseller_code;
        referrerResellerId = referrer[0].id;
      }
    }

    const userId = uuidv4();
    const newReferralCode = userId.slice(0, 8).toUpperCase();
    const now = new Date().toISOString();
    let result: any[] = [];
    try {
      result = await sql`
        INSERT INTO users (id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, role, referral_code, referral_earnings, referred_by, total_deposits, created_at, updated_at)
        VALUES (${userId}, ${normalizedEmail}, ${phone}, ${passwordHash}, ${firstName}, ${lastName}, 0.00, false, ${ROLES.USER}, ${newReferralCode}, 0.00, ${referredBy}, 0.00, ${now}, ${now})
        RETURNING id, email, phone, first_name, last_name, wallet_balance, is_verified, role, referral_code, created_at
      `;
    } catch (error: any) {
      const message = `${error?.message || ""}`.toLowerCase();
      const missingColumn =
        error?.code === "42703" ||
        message.includes("column") ||
        message.includes("does not exist");

      if (!missingColumn) {
        throw error;
      }

      try {
        result = await sql`
          INSERT INTO users (id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, role, referral_code, created_at, updated_at)
          VALUES (${userId}, ${normalizedEmail}, ${phone}, ${passwordHash}, ${firstName}, ${lastName}, 0.00, false, ${ROLES.USER}, ${newReferralCode}, ${now}, ${now})
          RETURNING id, email, phone, first_name, last_name, wallet_balance, is_verified, role, referral_code, created_at
        `;
      } catch (fallbackError: any) {
        const fallbackMessage = `${fallbackError?.message || ""}`.toLowerCase();
        const referralCodeMissing =
          fallbackError?.code === "42703" ||
          fallbackMessage.includes("referral_code");

        if (!referralCodeMissing) {
          throw fallbackError;
        }

        result = await sql`
          INSERT INTO users (id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, role, created_at, updated_at)
          VALUES (${userId}, ${normalizedEmail}, ${phone}, ${passwordHash}, ${firstName}, ${lastName}, 0.00, false, ${ROLES.USER}, ${now}, ${now})
          RETURNING id, email, phone, first_name, last_name, wallet_balance, is_verified, role, NULL::text AS referral_code, created_at
        `;
      }
    }

    const user = result[0] as User;

    // Update reseller stats if referred
    if (referrerResellerId) {
      try {
        await sql`
          UPDATE reseller_profiles
          SET total_referrals = total_referrals + 1
          WHERE id = ${referrerResellerId}
        `;
        
        // Also update any matching referral link conversion
        await sql`
          UPDATE reseller_referral_links
          SET conversions = conversions + 1
          WHERE reseller_id = ${referrerResellerId}
            AND referral_code = ${referralCode?.toUpperCase()}
        `;
      } catch { /* ignore stats update errors */ }
    }

    // Create session with explicit UUID
    const token = uuidv4();
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await insertSessionRecord({
      sessionId,
      userId: user.id,
      token,
      expiresAtIso: expiresAt.toISOString(),
      nowIso: now,
    });
    await pruneUserSessions(user.id);

    return { success: true, user, token, expiresAt };
  } catch (error: unknown) {
    console.error("Registration error:", error);
    return { success: false, error: "Failed to create account. Please try again." };
  }
}

export async function login(formData: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  try {
    const { email, password } = formData;

    // Validation
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Invalid email format" };
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();
    
    const result = await sql`
      SELECT id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, role, created_at
      FROM users WHERE email = ${normalizedEmail}
    `;

    if (result.length === 0) {
      return { success: false, error: "Invalid email or password" };
    }

    const user = result[0] as any;

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return { success: false, error: "Invalid email or password" };
    }

    // Create session with explicit UUID
    const token = uuidv4();
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date().toISOString();

    await insertSessionRecord({
      sessionId,
      userId: user.id,
      token,
      expiresAtIso: expiresAt.toISOString(),
      nowIso: now,
    });
    await pruneUserSessions(user.id);

    // Cookie is set in the API route response (see /api/auth/login)

    const userResponse: User = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      first_name: user.first_name,
      last_name: user.last_name,
      wallet_balance: Number(user.wallet_balance),
      is_verified: user.is_verified,
      role: (user as any).role,
      created_at: user.created_at,
    };

    return { 
      success: true, 
      user: userResponse,
      token: token,
      expiresAt: expiresAt
    };
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string; cause?: unknown };
    console.error("Login error:", {
      message: err?.message || "Unknown error",
      code: err?.code,
      cause:
        err?.cause && typeof err.cause === "object"
          ? (err.cause as { message?: string }).message || "Nested error"
          : undefined,
    });
    return { success: false, error: "Failed to login. Please try again." };
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (token) {
    // Delete session from database
    await deleteSessionByToken(token);
    cookieStore.delete("session_token");
  }

  redirect("/login");
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return null;
    }

    let result: any[] = [];
    try {
      result = await sql`
        SELECT 
          u.id, u.email, u.phone, u.first_name, u.last_name, 
          u.wallet_balance, u.is_verified, u.role, u.referral_code, u.created_at
        FROM auth_sessions s
        JOIN users u ON s.user_id::text = u.id::text
        WHERE s.token::text = ${token} AND s.expires_at > NOW()
      `;
    } catch (error) {
      if (!isPgMissingRelation(error)) throw error;
      result = await sql`
        SELECT 
          u.id, u.email, u.phone, u.first_name, u.last_name, 
          u.wallet_balance, u.is_verified, u.role, u.referral_code, u.created_at
        FROM sessions s
        JOIN users u ON s.user_id::text = u.id::text
        WHERE s.token::text = ${token} AND s.expires_at > NOW()
      `;
    }

    if (result.length === 0) {
      return null;
    }

    const user = result[0] as any;

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      first_name: user.first_name,
      last_name: user.last_name,
      wallet_balance: Number(user.wallet_balance),
      is_verified: user.is_verified,
      role: (user as any).role,
      referral_code: user.referral_code,
      created_at: user.created_at,
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'type' in error && error.type === 'error') {
      console.error("[getCurrentUser] ErrorEvent detected - ignoring");
      return null;
    }
    console.error("[getCurrentUser] Error:", error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function updateWalletBalance(
  userId: string,
  amount: number,
  operation: "add" | "subtract"
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    const result = await (operation === "add"
      ? sql`
        UPDATE users
        SET wallet_balance = wallet_balance + ${amount}
        WHERE id = ${userId}
        RETURNING wallet_balance
      `
      : sql`
        UPDATE users
        SET wallet_balance = wallet_balance - ${amount}
        WHERE id = ${userId}
        RETURNING wallet_balance
      `);

    if (result.length === 0) {
      return { success: false, error: "User not found" };
    }

    return { success: true, newBalance: Number(result[0].wallet_balance) };
  } catch (error) {
    console.error("Update wallet balance error:", error);
    return { success: false, error: "Failed to update wallet balance" };
  }
}
