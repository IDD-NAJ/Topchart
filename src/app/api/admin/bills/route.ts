import { NextRequest, NextResponse } from "next/server";
import { sql, sqlUnsafe } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }

    // Check if bill_transactions table exists
    const tableExists = await sql`SELECT to_regclass('public.bill_transactions')`;
    if (!tableExists[0]?.to_regclass) {
      return NextResponse.json({
        success: true,
        bills: [],
        total: 0,
        warning: "bill_transactions table not provisioned. Run admin database repair.",
      });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const status = searchParams.get("status");
    const provider = searchParams.get("provider");
    const userId = searchParams.get("userId");

    // Build query conditions
    let statusFilter = "";
    let providerFilter = "";
    let userIdFilter = "";
    const params: any[] = [];
    let paramIdx = 1;

    if (status) {
      statusFilter = ` AND status = $${paramIdx++}`;
      params.push(status);
    }
    if (provider) {
      providerFilter = ` AND provider = $${paramIdx++}`;
      params.push(provider);
    }
    if (userId) {
      userIdFilter = ` AND user_id = $${paramIdx++}`;
      params.push(userId);
    }

    const limitIdx = paramIdx;
    const offsetIdx = paramIdx + 1;

    const queryParams = [
      ...params,
      limit,
      offset,
    ];

    const countParams = params;

    // Get transactions
    const transactions = (await sqlUnsafe(
      `SELECT 
        bt.id,
        bt.user_id,
        u.email as user_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        bt.provider,
        bt.service_id,
        bt.service_name,
        bt.category,
        bt.account_number,
        bt.customer_name,
        bt.amount,
        bt.fee,
        bt.total_amount,
        bt.reference,
        bt.provider_reference,
        bt.status,
        bt.error_message,
        bt.created_at,
        bt.completed_at
      FROM bill_transactions bt
      LEFT JOIN users u ON bt.user_id = u.id
      WHERE 1=1${statusFilter}${providerFilter}${userIdFilter}
      ORDER BY bt.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      queryParams
    )) as any[];

    // Get total count
    const countResult = (await sqlUnsafe(
      `SELECT COUNT(*) as total FROM bill_transactions WHERE 1=1${statusFilter}${providerFilter}${userIdFilter}`,
      countParams
    )) as any[];
    const total = countResult[0]?.total || 0;

    return NextResponse.json({
      success: true,
      bills: Array.isArray(transactions) ? transactions : [],
      total,
    });
  } catch (error: any) {
    console.error("Admin bills GET error:", error);
    return NextResponse.json(
      { success: true, bills: [], total: 0, warning: error?.message || "Failed to fetch bills" },
      { status: 200 }
    );
  }
}
