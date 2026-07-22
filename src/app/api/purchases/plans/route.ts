export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sqlUnsafe } from "@/lib/db";

export const revalidate = 60;
export const runtime = "nodejs";

type Plan = {
  // Contract used by /dashboard/data (DatamartPlan)
  id: string;
  networkId: string;
  network: string;
  name: string;
  validity: string | null;
  validityHours: number | null;
  validityDays: number | null;
  effectivePrice: number;
  priceOverride: number | null;
  markupPercent: number | null;
  isPopular: boolean;
  isActive: boolean;
  isFeatured: boolean;
  datamartPlanId: string | null;
  datamartPlanType: string | null;
  syncedAt: string | null;
  // Legacy aliases kept for /checkout and other consumers
  size_label: string;
  validity_label: string;
  price: number;
  sizeMb: number | null;
  network_id: string;
};

function calculateEffectivePrice(
  providerPrice: number,
  priceOverride: number | null,
  markupPercent: number | null
): number {
  if (priceOverride !== null && priceOverride > 0) {
    return priceOverride;
  }
  if (markupPercent !== null && markupPercent > 0) {
    const markup = providerPrice * (markupPercent / 100);
    return Number((providerPrice + markup).toFixed(2));
  }
  return providerPrice;
}

const FRONTEND_TO_DB_NETWORK: Record<string, string> = {
  mtn: "MTN",
  vodafone: "Telecel",
  telecel: "Telecel",
  airteltigo: "AirtelTigo",
  "airtel-tigo": "AirtelTigo",
  at: "AirtelTigo",
  glo: "GLO",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get("network");

    const dbNetworkCode = network
      ? FRONTEND_TO_DB_NETWORK[network.toLowerCase()] || network.toUpperCase()
      : undefined;

    const selectCols = `
      b.id,
      n.name as network_name,
      b.name,
      b."sizeMb",
      b."validityHours",
      b.price as "providerPrice",
      b."priceOverride",
      b."markupPercent",
      b."isPopular",
      b."isActive",
      b."isFeatured",
      b."datamartPlanId",
      b."datamartPlanType",
      b."updatedAt" as "syncedAt"`;

    const joinClause = `FROM data_bundles b LEFT JOIN networks n ON COALESCE(b."networkId", b.network_id::uuid) = n.id`;

    const result = (await (dbNetworkCode
      ? sqlUnsafe(
          `SELECT ${selectCols} ${joinClause} WHERE b."isActive" = true AND n.name = $1 ORDER BY b.price ASC`,
          [dbNetworkCode]
        )
      : sqlUnsafe(
          `SELECT ${selectCols} ${joinClause} WHERE b."isActive" = true ORDER BY n.name, b.price ASC`
        ))) as Record<string, unknown>[];

    const plans: Plan[] = result.map((row) => {
      const providerPrice = Number(row.providerPrice) || 0;
      const priceOverride = row.priceOverride != null && Number(row.priceOverride) > 0 ? Number(row.priceOverride) : null;
      const markupPercent = row.markupPercent != null && Number(row.markupPercent) > 0 ? Number(row.markupPercent) : null;
      const effectivePrice = calculateEffectivePrice(providerPrice, priceOverride, markupPercent);
      const validityHours = row.validityHours != null ? Number(row.validityHours) : null;
      const validityDays = validityHours != null ? Math.round(validityHours / 24) : null;
      const validity = validityDays ? `${validityDays} days` : null;
      const networkName = row.network_name ? String(row.network_name) : "";
      const name = String(row.name ?? "");

      return {
        id: String(row.id),
        networkId: networkName,
        network: networkName,
        name,
        validity,
        validityHours,
        validityDays,
        effectivePrice,
        priceOverride,
        markupPercent,
        isPopular: Boolean(row.isPopular),
        isActive: Boolean(row.isActive),
        isFeatured: Boolean(row.isFeatured),
        datamartPlanId: row.datamartPlanId != null ? String(row.datamartPlanId) : null,
        datamartPlanType: row.datamartPlanType != null ? String(row.datamartPlanType) : null,
        syncedAt: row.syncedAt ? new Date(String(row.syncedAt)).toISOString() : null,
        // Legacy aliases
        size_label: name,
        validity_label: validity || "N/A",
        price: effectivePrice,
        sizeMb: row.sizeMb != null ? Number(row.sizeMb) : null,
        network_id: networkName,
      };
    });

    const newestSync = plans
      .filter((p) => p.syncedAt)
      .map((p) => new Date(p.syncedAt!).getTime())
      .sort((a, b) => b - a)[0];

    const isStale = !newestSync || Date.now() - newestSync > 48 * 60 * 60 * 1000;

    return NextResponse.json({
      success: true,
      data: plans,
      stale: isStale,
      fromCache: true,
      fetchedAt: newestSync ? new Date(newestSync).toISOString() : null,
    });
  } catch (error) {
    console.error("[Plans API] error:", error);
    const err = error as { code?: string; message?: string };

    if (err?.code === "42P01") {
      return NextResponse.json(
        { success: false, error: "Data bundles table not found" },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch plans" },
      { status: 500 }
    );
  }
}
