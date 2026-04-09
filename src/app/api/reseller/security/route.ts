import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Fetch reseller security data (fraud alerts, audit logs)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const sessions = await sql`
      SELECT u.id FROM auth_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
      LIMIT 1
    `;
    
    if (!sessions.length) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = (sessions[0] as { id: string }).id;
    
    // Get reseller profile
    let profile: any[] = [];
    try {
      profile = await sql`
        SELECT * FROM reseller_profiles
        WHERE user_id = ${userId}
      `;
    } catch { profile = []; }
    
    if (profile.length === 0) {
      return NextResponse.json({ success: false, error: "Not a reseller" }, { status: 403 });
    }
    
    const resellerId = (profile[0] as { id: string }).id;
    
    const safeQuery = async <T>(fn: () => Promise<T[]>): Promise<T[]> => {
      try { return await fn(); } catch { return []; }
    };

    // Log audit entry for dashboard access
    await sql`
      INSERT INTO reseller_audit_logs (reseller_id, user_id, action, details, created_at)
      VALUES (${resellerId}, ${userId}, 'security_dashboard_accessed', ${JSON.stringify({ timestamp: new Date().toISOString() })}, NOW())
    `;

    const [fraudAlerts, auditLogs, rateViolations, suspiciousTxns] = await Promise.all([
      safeQuery(() => sql`
        SELECT * FROM fraud_alerts
        WHERE reseller_id = ${resellerId}
        ORDER BY created_at DESC LIMIT 10
      `),
      safeQuery(() => sql`
        SELECT * FROM reseller_audit_logs
        WHERE reseller_id = ${resellerId}
        ORDER BY created_at DESC LIMIT 20
      `),
      safeQuery(() => sql`
        SELECT * FROM rate_limit_violations
        WHERE reseller_id = ${resellerId}
        ORDER BY created_at DESC LIMIT 10
      `),
      safeQuery(() => sql`
        SELECT * FROM suspicious_transactions
        WHERE reseller_id = ${resellerId}
        ORDER BY created_at DESC LIMIT 10
      `),
    ]);
    
    // Calculate security score
    const openAlerts = fraudAlerts.filter((a: any) => a.status === 'open').length;
    const securityScore = Math.max(0, 100 - (openAlerts * 10) - (rateViolations.length * 5));
    
    return NextResponse.json({
      success: true,
      securityScore,
      fraudAlerts,
      auditLogs,
      rateViolations,
      suspiciousTransactions: suspiciousTxns,
      stats: {
        totalAlerts: fraudAlerts.length,
        openAlerts,
        totalViolations: rateViolations.length,
        suspiciousTxns: suspiciousTxns.length
      }
    });
    
  } catch (error) {
    console.error("Reseller security GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Resolve a fraud alert
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const sessions = await sql`
      SELECT u.id FROM auth_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
      LIMIT 1
    `;
    
    if (!sessions.length) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = (sessions[0] as { id: string }).id;
    
    // Get reseller profile
    let profile: any[] = [];
    try {
      profile = await sql`
        SELECT * FROM reseller_profiles
        WHERE user_id = ${userId}
      `;
    } catch { profile = []; }
    
    if (profile.length === 0) {
      return NextResponse.json({ success: false, error: "Not a reseller" }, { status: 403 });
    }
    
    const resellerId = (profile[0] as { id: string }).id;
    
    const body = await request.json();
    const { alertId } = body;
    
    if (!alertId) {
      return NextResponse.json({ success: false, error: "Alert ID required" }, { status: 400 });
    }
    
    // Update the alert status
    await sql`
      UPDATE fraud_alerts
      SET status = 'resolved', resolved_at = NOW(), resolved_by = ${userId}
      WHERE id = ${alertId} AND reseller_id = ${resellerId}
    `;
    
    // Log the action
    await sql`
      INSERT INTO reseller_audit_logs (reseller_id, user_id, action, details, created_at)
      VALUES (${resellerId}, ${userId}, 'fraud_alert_resolved', ${JSON.stringify({ alert_id: alertId })}, NOW())
    `;
    
    return NextResponse.json({ success: true, message: "Alert resolved" });
    
  } catch (error) {
    console.error("Reseller security PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
