import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { billService } from "@/lib/bills/service";

export const dynamic = "force-dynamic";

// Get provider configuration and status
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get provider configs from database
    const configs = await sql`
      SELECT 
        id,
        enabled,
        priority,
        markup_percent,
        daily_limit,
        daily_volume,
        success_count,
        failure_count,
        last_health_check,
        health_status,
        updated_at
      FROM bill_provider_config
      ORDER BY priority ASC
    `;

    // Get real-time provider availability
    const providerStatuses = await billService.getProviderStatus();

    // Merge database config with real-time status
    const providers = configs.map((config) => {
      const status = providerStatuses.find((s) => s.provider === config.id);
      return {
        ...config,
        realtimeAvailable: status?.available ?? false,
        realtimeError: status?.error,
      };
    });

    return NextResponse.json({
      success: true,
      data: providers,
    });
  } catch (error) {
    console.error("Failed to fetch bill providers:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch providers",
      },
      { status: 500 }
    );
  }
}

// Update provider configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, enabled, priority, markupPercent, dailyLimit } = body;

    if (!id || !["vtpass", "datamart"].includes(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid provider ID" },
        { status: 400 }
      );
    }

    const [updated] = await sql`
      UPDATE bill_provider_config
      SET 
        enabled = ${enabled !== undefined ? enabled : sql`enabled`},
        priority = ${priority !== undefined ? priority : sql`priority`},
        markup_percent = ${markupPercent !== undefined ? markupPercent : sql`markup_percent`},
        daily_limit = ${dailyLimit !== undefined ? dailyLimit : sql`daily_limit`},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Failed to update bill provider:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Update failed",
      },
      { status: 500 }
    );
  }
}
