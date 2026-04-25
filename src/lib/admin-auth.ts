import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { isAdmin, ROLES } from "@/lib/roles";

export type AdminAuthResult =
  | {
      ok: false;
      status: 401 | 403 | 500 | 503;
      error: string;
      classification?: "unauthenticated" | "unauthorized" | "auth_backend_failure" | "db_timeout";
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
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      console.log("[AUTH] No session token", { requestId, classification: "unauthenticated" });
      return { ok: false, status: 401, error: "Unauthorized", classification: "unauthenticated" };
    }

    let sessions: any[] = [];
    try {
      sessions = await sql`
        SELECT
          s.user_id,
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
      const duration = Date.now() - startTime;
      const err = e as any;
      const isTimeout = err?.message?.includes("timeout") || err?.code === "UND_ERR_CONNECT_TIMEOUT";
      
      console.error("[AUTH] Session query failed", {
        requestId,
        duration,
        error: err?.message,
        code: err?.code,
        classification: isTimeout ? "db_timeout" : "auth_backend_failure"
      });

      if (isTimeout) {
        return { ok: false, status: 503, error: "Auth service temporarily unavailable", classification: "db_timeout" };
      }
      return { ok: false, status: 500, error: "Auth backend failure", classification: "auth_backend_failure" };
    }

    const duration = Date.now() - startTime;
    if (sessions.length === 0) {
      console.log("[AUTH] Session not found or expired", { requestId, duration, classification: "unauthenticated" });
      return { ok: false, status: 401, error: "Session expired", classification: "unauthenticated" };
    }

    let user = sessions[0] as { user_id: string; email: string; first_name: string; last_name: string; role?: string };

    if (!isAdmin(user.role)) {
      console.warn("[SECURITY] Unauthorized admin access attempt", {
        requestId,
        userId: user.user_id,
        email: user.email,
        role: user.role,
        timestamp: new Date().toISOString(),
        classification: "unauthorized"
      });
      return { ok: false, status: 403, error: "Access denied", classification: "unauthorized" };
    }

    console.log("[AUTH] Admin auth success", { requestId, userId: user.user_id, duration });
    return {
      ok: true,
      userId: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[AUTH] Unexpected error", {
      requestId,
      duration,
      error: error instanceof Error ? error.message : String(error),
      classification: "auth_backend_failure"
    });
    return { ok: false, status: 500, error: "Internal server error", classification: "auth_backend_failure" };
  }
}
