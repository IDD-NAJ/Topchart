import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get("network");

    if (!network) {
      return NextResponse.json(
        { success: false, error: "Network parameter required" },
        { status: 400 }
      );
    }

    // Demo/sample plans (DataMart API may be unreachable in test env)
    const samplePlans: Record<string, any[]> = {
      MTN: [
        { id: "mtn-1gb", datamartPlanId: "1", name: "1 GB", price: 2.99, validityDays: 30, isFeatured: true },
        { id: "mtn-2gb", datamartPlanId: "2", name: "2 GB", price: 5.49, validityDays: 30, isFeatured: true },
        { id: "mtn-5gb", datamartPlanId: "5", name: "5 GB", price: 12.99, validityDays: 30, isFeatured: false },
        { id: "mtn-10gb", datamartPlanId: "10", name: "10 GB", price: 24.99, validityDays: 30, isFeatured: false },
      ],
      Telecel: [
        { id: "tc-500mb", datamartPlanId: "500m", name: "500 MB", price: 1.99, validityDays: 7, isFeatured: true },
        { id: "tc-1gb", datamartPlanId: "1gb", name: "1 GB", price: 3.99, validityDays: 30, isFeatured: true },
        { id: "tc-5gb", datamartPlanId: "5gb", name: "5 GB", price: 14.99, validityDays: 30, isFeatured: false },
      ],
      AirtelTigo: [
        { id: "at-1gb", datamartPlanId: "1gb", name: "1 GB", price: 2.49, validityDays: 30, isFeatured: true },
        { id: "at-3gb", datamartPlanId: "3gb", name: "3 GB", price: 6.99, validityDays: 30, isFeatured: true },
        { id: "at-10gb", datamartPlanId: "10gb", name: "10 GB", price: 22.99, validityDays: 30, isFeatured: false },
      ],
    };

    const networkKey = network.toUpperCase();
    const rawPlans = samplePlans[networkKey] || samplePlans["MTN"] || [];

    // Transform to match checkout page's Bundle interface
    const bundles = rawPlans.map((plan: any) => {
      const sizeLabel = plan.name; // e.g. "1 GB"
      const validityLabel = plan.validityDays
        ? `${plan.validityDays} Day${plan.validityDays !== 1 ? 's' : ''}`
        : "30 Days";

      const networkCodes: Record<string, string> = {
        MTN: "MTN",
        TELECEL: "TELECEL",
        AIRTELTIGO: "AIRTELTIGO",
      };

      return {
        id: plan.id,
        capacity: plan.datamartPlanId, // Used for purchase API
        network_name: networkKey,
        network_code: networkCodes[networkKey] || networkKey,
        size_label: sizeLabel,
        size_mb: 1024, // Placeholder, would come from real API
        validity_label: validityLabel,
        validity_hours: (plan.validityDays || 30) * 24,
        price: plan.price,
        is_popular: plan.isFeatured || false,
      };
    });

    return NextResponse.json({
      success: true,
      bundles,
      network,
      fetchedAt: new Date().toISOString(),
      note: "Sample data (DataMart API unavailable)",
    });
  } catch (error) {
    console.error("[guest/bundles] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load bundles", bundles: [] },
      { status: 500 }
    );
  }
}
