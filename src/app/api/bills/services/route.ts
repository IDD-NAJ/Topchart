export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { billService } from "@/lib/bills/service";
import { requireAuth } from "@/lib/auth";
import type { BillCategory } from "@/lib/bills/types";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as BillCategory | null;

    const services = await billService.getServices(category || undefined);

    return NextResponse.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("Failed to fetch bill services:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch services",
      },
      { status: 500 }
    );
  }
}
