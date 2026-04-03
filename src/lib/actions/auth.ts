"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { sql } from "@/lib/db";
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
  created_at: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  token?: string;
  expiresAt?: Date;
}

let _usersRoleColumnCache: boolean | null = null;
async function usersHasRoleColumn(): Promise<boolean> {
  if (_usersRoleColumnCache !== null) return _usersRoleColumnCache;
  try {
    const rows = await sql`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'role'
      LIMIT 1
    `;
    _usersRoleColumnCache = rows.length > 0;
  } catch {
    _usersRoleColumnCache = false;
  }
  return _usersRoleColumnCache;
}

let _usersUpdatedAtColumnCache: boolean | null = null;
async function usersHasUpdatedAtColumn(): Promise<boolean> {
  if (_usersUpdatedAtColumnCache !== null) return _usersUpdatedAtColumnCache;
  try {
    const rows = await sql`
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'updated_at'
      LIMIT 1
    `;
    _usersUpdatedAtColumnCache = rows.length > 0;
  } catch {
    _usersUpdatedAtColumnCache = false;
  }
  return _usersUpdatedAtColumnCache;
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

    // Look up referrer if referral code provided
    let referredBy: string | null = null;
    if (referralCode) {
      const referrer = await sql`
        SELECT id FROM users WHERE referral_code = ${referralCode.toUpperCase()}
      `;
      if (referrer.length > 0) {
        referredBy = referrer[0].id;
      }
    }

// Create user with explicit UUID and referral code
      const userId = uuidv4();
      const newReferralCode = userId.slice(0, 8).toUpperCase();
      const now = new Date().toISOString();
      const hasRole = await usersHasRoleColumn();
      const hasUpdatedAt = await usersHasUpdatedAtColumn();
      const result =
        hasRole && hasUpdatedAt
          ? await sql`
              INSERT INTO users (id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, role, referral_code, referral_earnings, referred_by, total_deposits, created_at, updated_at)
              VALUES (${userId}, ${normalizedEmail}, ${phone}, ${passwordHash}, ${firstName}, ${lastName}, 0.00, false, ${ROLES.USER}, ${newReferralCode}, 0.00, ${referredBy}, 0.00, ${now}, ${now})
              RETURNING id, email, phone, first_name, last_name, wallet_balance, is_verified, role, referral_code, created_at
            `
          : hasRole && !hasUpdatedAt
            ? await sql`
                INSERT INTO users (id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, role, referral_code, referral_earnings, referred_by, total_deposits, created_at)
                VALUES (${userId}, ${normalizedEmail}, ${phone}, ${passwordHash}, ${firstName}, ${lastName}, 0.00, false, ${ROLES.USER}, ${newReferralCode}, 0.00, ${referredBy}, 0.00, ${now})
                RETURNING id, email, phone, first_name, last_name, wallet_balance, is_verified, role, referral_code, created_at
              `
            : !hasRole && hasUpdatedAt
              ? await sql`
                  INSERT INTO users (id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, referral_code, referral_earnings, referred_by, total_deposits, created_at, updated_at)
                  VALUES (${userId}, ${normalizedEmail}, ${phone}, ${passwordHash}, ${firstName}, ${lastName}, 0.00, false, ${newReferralCode}, 0.00, ${referredBy}, 0.00, ${now}, ${now})
                  RETURNING id, email, phone, first_name, last_name, wallet_balance, is_verified, referral_code, created_at
                `
              : await sql`
                  INSERT INTO users (id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, referral_code, referral_earnings, referred_by, total_deposits, created_at)
                  VALUES (${userId}, ${normalizedEmail}, ${phone}, ${passwordHash}, ${firstName}, ${lastName}, 0.00, false, ${newReferralCode}, 0.00, ${referredBy}, 0.00, ${now})
                  RETURNING id, email, phone, first_name, last_name, wallet_balance, is_verified, referral_code, created_at
                `;

    const user = result[0] as User;

    // Create session with explicit UUID
    const token = uuidv4();
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await sql`
      INSERT INTO auth_sessions (id, user_id, token, expires_at, created_at)
      VALUES (${sessionId}, ${user.id}, ${token}, ${expiresAt.toISOString()}, ${now})
    `;

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: shouldUseSecureCookies(),
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return { success: true, user };
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
    
    // Find user by email
    // Prefer selecting role directly. If the column doesn't exist, fall back.
    // This avoids false negatives when information_schema access is restricted.
    let result: any[];
    try {
      result = await sql`
        SELECT id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, role, created_at
        FROM users WHERE email = ${normalizedEmail}
      `;
    } catch {
      result = await sql`
        SELECT id, email, phone, password_hash, first_name, last_name, wallet_balance, is_verified, created_at
        FROM users WHERE email = ${normalizedEmail}
      `;
    }

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

    await sql`
      INSERT INTO auth_sessions (id, user_id, token, expires_at, created_at)
      VALUES (${sessionId}, ${user.id}, ${token}, ${expiresAt.toISOString()}, ${now})
    `;

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
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Failed to login. Please try again." };
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (token) {
    // Delete session from database
    await sql`DELETE FROM auth_sessions WHERE token::text = ${token}`;
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

    // Get session with user data
    // Prefer selecting role directly. If the column doesn't exist, fall back.
    // This avoids false negatives when information_schema access is restricted.
    let result: any[];
    try {
      result = await sql`
        SELECT 
          u.id, u.email, u.phone, u.first_name, u.last_name, 
          u.wallet_balance, u.is_verified, u.role, u.created_at,
          s.expires_at
        FROM auth_sessions s
        JOIN users u ON s.user_id::text = u.id::text
        WHERE s.token::text = ${token} AND s.expires_at > NOW()
      `;
    } catch {
      result = await sql`
        SELECT 
          u.id, u.email, u.phone, u.first_name, u.last_name, 
          u.wallet_balance, u.is_verified, u.created_at,
          s.expires_at
        FROM auth_sessions s
        JOIN users u ON s.user_id::text = u.id::text
        WHERE s.token::text = ${token} AND s.expires_at > NOW()
      `;
    }

    if (result.length === 0) {
      // Session expired or invalid, delete it
      await sql`DELETE FROM auth_sessions WHERE token::text = ${token}`;
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
      created_at: user.created_at,
    };
  } catch (error) {
    console.error("[getCurrentUser] Error:", error);
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
