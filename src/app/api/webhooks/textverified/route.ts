export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: "This endpoint is no longer active. Verification now uses PVADeals (polling model)." },
    { status: 410 }
  );
}

export async function GET(_request: NextRequest) {
  return NextResponse.json(
    { error: "This endpoint is no longer active. Verification now uses PVADeals (polling model)." },
    { status: 410 }
  );
}
