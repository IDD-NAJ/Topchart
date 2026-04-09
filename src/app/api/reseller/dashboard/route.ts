import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { finalizeResellerApplicationPayment } from "@/lib/reseller-payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Reseller dashboard stats
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const sessions = await sql`
      SELECT u.id, u.role FROM auth_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
      LIMIT 1
    `;
    
    if (!sessions.length) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const sessionUser = sessions[0] as { id: string; role: string };
    const userId = sessionUser.id;
    
    // Get reseller profile
    let profile: any[] = [];
    try {
      profile = await sql`
        SELECT * FROM reseller_profiles
        WHERE user_id = ${userId}
      `;
    } catch (error) {
      console.error("Error fetching reseller profile:", error);
      return NextResponse.json(
        { success: false, error: "Database error fetching profile" },
        { status: 500 }
      );
    }
    
    let applicationRows: unknown[] = [];
    try {
      applicationRows = await sql`
        SELECT application_status, payment_status, created_at, updated_at
        FROM reseller_applications
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 1
      `;
    } catch {
      applicationRows = await sql`
        SELECT application_status, payment_status, created_at
        FROM reseller_applications
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 1
      `;
    }
    const latestApplication = applicationRows[0] as
      | {
          application_status: string;
          payment_status: string;
          created_at: string;
          updated_at: string;
        }
      | undefined;

    if (profile.length === 0) {
      const looksApproved =
        String(sessionUser.role || "").toUpperCase() === "RESELLER" ||
        latestApplication?.payment_status === "paid" ||
        latestApplication?.application_status === "approved";

      if (looksApproved) {
        try {
          const latestTxRows = await sql`
            SELECT id
            FROM transactions
            WHERE user_id = ${userId}
              AND status = 'success'
              AND (type = 'reseller_application' OR metadata->>'payment_type' = 'reseller_application')
            ORDER BY created_at DESC
            LIMIT 1
          `;
          const transactionId = (latestTxRows[0] as { id?: string } | undefined)?.id;
          const latestApplicationIdRows = await sql`
            SELECT id
            FROM reseller_applications
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
            LIMIT 1
          `;
          const latestApplicationId =
            (latestApplicationIdRows[0] as { id?: string } | undefined)?.id;

          if (transactionId) {
            const finalized = await finalizeResellerApplicationPayment({
              transactionId,
              applicationId: latestApplicationId,
              actor: "system",
              reason: "reseller_dashboard_profile_reconciliation",
            });
            if (!finalized.ok) {
              console.warn("Reseller dashboard reconciliation skipped:", finalized.message);
            }
          }
        } catch (reconciliationError) {
          console.warn("Reseller dashboard reconciliation failed:", reconciliationError);
        }

        try {
          profile = await sql`
            SELECT * FROM reseller_profiles
            WHERE user_id = ${userId}
          `;
        } catch {
          profile = [];
        }
      }
    }

    if (profile.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Not a reseller",
          state: {
            role: sessionUser.role,
            profile_exists: false,
            application_status: latestApplication?.application_status || null,
            payment_status: latestApplication?.payment_status || null,
          },
        },
        { status: 403 }
      );
    }
    
    const resellerId = (profile[0] as { id: string }).id;
    
    const safeQuery = async <T>(fn: () => Promise<T[]>): Promise<T[]> => {
      try { return await fn(); } catch { return [{ total_sales: 0, total_amount: 0, total_profit: 0, total_commissions: 0, total_earned: 0, count: 0 }] as any[]; }
    };

    const [sales, commissions, inventory] = await Promise.all([
      safeQuery(() => sql`
        SELECT
          COUNT(*) as total_sales,
          COALESCE(SUM(amount), 0) as total_amount,
          COALESCE(SUM(profit), 0) as total_profit
        FROM reseller_sales
        WHERE reseller_id = ${resellerId}
      `),
      safeQuery(() => sql`
        SELECT
          COUNT(*) as total_commissions,
          COALESCE(SUM(commission_amount), 0) as total_earned
        FROM reseller_commissions
        WHERE reseller_id = ${resellerId}
      `),
      safeQuery(() => sql`
        SELECT COUNT(*) as count
        FROM reseller_inventory
        WHERE reseller_id = ${resellerId}
        AND status = 'available'
      `),
    ]);
    
    return NextResponse.json({
      success: true,
      profile: profile[0],
      state: {
        role: sessionUser.role,
        profile_exists: true,
        application_status: latestApplication?.application_status || "approved",
        payment_status: latestApplication?.payment_status || "paid",
      },
      stats: {
        sales: sales[0],
        commissions: commissions[0],
        inventory: inventory[0]
      }
    });
    
  } catch (error) {
    console.error("Reseller dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
