export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getHubnetPlans } from "@/lib/providers/hubnet";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const network = (searchParams.get("network") || "airteltigo").toLowerCase();
    const subcategory = (searchParams.get("subcategory") || "").toLowerCase();

    if (!subcategory || (subcategory !== "ishare" && subcategory !== "big_time")) {
      return NextResponse.json({ success: false, error: "subcategory must be 'ishare' or 'big_time'" }, { status: 400 });
    }

    const res = await getHubnetPlans({ network, subcategory });
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error || "Failed to fetch plans" }, { status: 502 });
    }

    return NextResponse.json({ success: true, data: { packages: res.packages || [] } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
