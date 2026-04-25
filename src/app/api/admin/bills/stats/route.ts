import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    // Get overall statistics
    const [overallStats] = await sql`
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as total_amount,
        SUM(fee) as total_fees
      FROM bill_transactions
      WHERE created_at >= NOW() - INTERVAL '${days} days'
    `;

    // Get provider breakdown
    const providerStats = await sql`
      SELECT 
        provider,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as amount,
        AVG(CASE 
          WHEN completed_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 60 
          ELSE NULL 
        END) as avg_processing_minutes
      FROM bill_transactions
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY provider
    `;

    // Get category breakdown
    const categoryStats = await sql`
      SELECT 
        category,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as amount
      FROM bill_transactions
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY category
    `;

    // Get daily trend
    const dailyTrend = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as amount
      FROM bill_transactions
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    return NextResponse.json({
      success: true,
      data: {
        overall: overallStats,
        byProvider: providerStats,
        byCategory: categoryStats,
        dailyTrend,
      },
    });
  } catch (error) {
    console.error("Failed to fetch bill stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch stats",
      },
      { status: 500 }
    );
  }
}
