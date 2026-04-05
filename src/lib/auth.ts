import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export async function requireAuth() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    
    if (!sessionToken) return null;
    
    const sessions = await sql`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.wallet_balance,
        u.is_verified,
        u.role
      FROM auth_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken}
        AND s.expires_at > NOW()
      LIMIT 1
    `;
    
    if (!sessions.length) return null;
    
    return sessions[0] as {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      phone: string;
      wallet_balance: number;
      is_verified: boolean;
      role: string;
    };
  } catch (error) {
    console.error("requireAuth error:", error);
    return null;
  }
}
