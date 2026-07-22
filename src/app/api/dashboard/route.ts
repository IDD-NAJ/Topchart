import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth";
import { getDashboardData } from "@/lib/actions/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const data = await getDashboardData();
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Dashboard API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error && error.stack ? error.stack : "";
    
    console.error("Dashboard error details:", errorMessage, errorDetails);
    
    const isRetryable = /timeout|connect|network|fetch failed|cold start/i.test(errorMessage);
    
    return NextResponse.json(
      { 
        success: false, 
        error: isRetryable
          ? "Database is starting up. Please retry in a moment."
          : "Failed to load dashboard data",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        retryable: isRetryable || undefined,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}

