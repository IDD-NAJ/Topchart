import { NextResponse } from "next/server";
import { fetchDeliveryTracker } from "@/lib/datamart-v2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchDeliveryTracker();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch delivery tracker",
      },
      { status: 502 }
    );
  }
}
