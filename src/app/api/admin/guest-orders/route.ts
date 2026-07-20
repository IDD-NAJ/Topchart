import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listGuestOrders, getGuestOrderStats } from "@/lib/guest-orders";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);

  // Stats-only mode
  if (searchParams.get("stats") === "1") {
    const stats = await getGuestOrderStats();
    return NextResponse.json({ success: true, stats });
  }

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const payment_status = searchParams.get("payment_status") || undefined;
  const fulfillment_status = searchParams.get("fulfillment_status") || undefined;
  const product_type = searchParams.get("product_type") || undefined;
  const search = searchParams.get("search") || undefined;

  const result = await listGuestOrders({
    page,
    limit,
    payment_status,
    fulfillment_status,
    product_type,
    search,
  });

  return NextResponse.json({ success: true, ...result });
}
