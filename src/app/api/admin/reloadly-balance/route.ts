import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getBalance, clearTokenCache } from "@/lib/reloadly";

export const runtime = "nodejs";

 function getReloadlyResponseMeta(error?: string) {
   const message = error || "Failed to fetch Reloadly balance";
   const isNotConfigured =
     message.includes("Missing required environment variables") ||
     message.includes("RELOADLY_CLIENT_ID") ||
     message.includes("RELOADLY_CLIENT_SECRET") ||
     message.includes("Reloadly not configured");

   return {
     error: message,
     state: isNotConfigured ? "not_configured" : "disconnected",
     status: isNotConfigured ? 200 : 502,
   };
 }

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

    const meta = getReloadlyResponseMeta(result.error);

    return NextResponse.json(
      {
        success: false,
        error: meta.error,
        errorCode: result.errorCode,
        state: meta.state,
      },
      { status: meta.state === "not_configured" ? meta.status : (result.statusCode || meta.status) }
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

    const meta = getReloadlyResponseMeta(result.error);

    return NextResponse.json(
      {
        success: false,
        error: meta.error,
        errorCode: result.errorCode,
        state: meta.state,
      },
      { status: meta.state === "not_configured" ? meta.status : (result.statusCode || meta.status) }
    );
  } catch (error) {
    console.error("Reloadly balance refresh error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
