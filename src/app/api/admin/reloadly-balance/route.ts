import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getBalance, clearTokenCache } from "@/lib/reloadly";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    // Clear token cache if refresh requested
    if (refresh) {
      clearTokenCache();
    }

    const result = await getBalance();

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        cached: !refresh,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: result.error || "Failed to fetch Reloadly balance",
        errorCode: result.errorCode,
      },
      { status: result.statusCode || 502 }
    );
  } catch (error) {
    console.error("Reloadly balance check error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    // Force token refresh and balance check
    clearTokenCache();
    const result = await getBalance();

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        refreshed: true,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: result.error || "Failed to refresh Reloadly balance",
        errorCode: result.errorCode,
      },
      { status: result.statusCode || 502 }
    );
  } catch (error) {
    console.error("Reloadly balance refresh error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
