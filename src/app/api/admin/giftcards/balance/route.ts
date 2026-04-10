import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getBalance } from "@/lib/reloadly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    const balanceResult = await getBalance();

    if (!balanceResult.success || !balanceResult.data) {
      return NextResponse.json(
        { success: false, error: balanceResult.error || "Failed to fetch Reloadly balance" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        balanceUSD: balanceResult.data.balance,
        currencyCode: balanceResult.data.currencyCode,
      },
    });
  } catch (error) {
    console.error("Admin giftcard balance GET error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
