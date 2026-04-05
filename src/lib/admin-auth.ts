import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { isAdmin, ROLES } from "@/lib/roles";

export type AdminAuthResult =
  | {
      ok: false;
      status: 401 | 403;
      error: string;
    }
  | {
      ok: true;
      userId: string;
      email: string;
      firstName: string;
      lastName: string;
    };

/**
 * Reusable function to check if the current user is an admin
 * Returns admin user info if authenticated and authorized, otherwise returns error
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }

    // Simple query for auth_sessions table
    let sessions: any[] = [];
    try {
      sessions = await sql`
        SELECT
          s.user_id::text AS user_id,
          u.email,
          u.first_name,
          u.last_name,
          COALESCE(u.role, 'USER') AS role
        FROM auth_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ${sessionToken}
          AND s.expires_at > NOW()
        LIMIT 1
      `;
    } catch (e) {
      console.error("Auth sessions query failed:", e);
      sessions = [];
    }

    if (sessions.length === 0) {
      return { ok: false, status: 401, error: "Session expired" };
    }

    let user = sessions[0] as { user_id: string; email: string; first_name: string; last_name: string; role?: string };

    // Security: No auto-promotion - admin role must be explicitly assigned
    // This prevents privilege escalation vulnerabilities

    if (!isAdmin(user.role)) {
      console.warn("[SECURITY] Unauthorized admin access attempt", {
        userId: user.user_id,
        email: user.email,
        role: user.role,
        timestamp: new Date().toISOString()
      });
      return { ok: false, status: 403, error: "Access denied" };
    }

    return {
      ok: true,
      userId: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    };
  } catch (error) {
    console.error("Admin auth error:", error);
    return { ok: false, status: 401, error: "Internal server error" };
  }
}
