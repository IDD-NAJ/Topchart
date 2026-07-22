export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { sqlUnsafe } from "@/lib/db";

type Plan = {
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
  // Legacy aliases kept for /checkout compatibility
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
  if (priceOverride !== null && priceOverride > 0) return priceOverride;
  if (markupPercent !== null && markupPercent > 0) {
    return Number((providerPrice * (1 + markupPercent / 100)).toFixed(2));
  }
  return providerPrice;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Accept a network UUID or name
    const networkParam = searchParams.get("network");

    // Build WHERE clause — filter by network UUID when provided.
    // The `networkId` column in data_bundles is a UUID that matches networks.id directly.
    const whereExtra = networkParam ? `AND b."networkId" = $1` : "";
    const params = networkParam ? [networkParam] : [];

    const rows = (await sqlUnsafe(
      `SELECT
         b.id,
         b.name,
         b."sizeMb",
         b."validityHours",
         b.price             AS "providerPrice",
         b."priceOverride",
         b."markupPercent",
         b."isPopular",
         b."isActive",
         b."isFeatured",
         b."datamartPlanId",
         b."datamartPlanType",
         b."updatedAt"       AS "syncedAt",
         n.id                AS "networkId",
         n.name              AS "networkName"
       FROM data_bundles b
       JOIN networks n ON b."networkId" = n.id
       WHERE b."isActive" = true
         ${whereExtra}
       ORDER BY b.price ASC`,
      params
    )) as Record<string, unknown>[];

    const plans: Plan[] = rows.map((row) => {
      const providerPrice = Number(row.providerPrice) || 0;
      const priceOverride =
        row.priceOverride != null && Number(row.priceOverride) > 0
          ? Number(row.priceOverride)
          : null;
      const markupPercent =
        row.markupPercent != null && Number(row.markupPercent) > 0
          ? Number(row.markupPercent)
          : null;
      const effectivePrice = calculateEffectivePrice(
        providerPrice,
        priceOverride,
        markupPercent
      );
      const validityHours =
        row.validityHours != null ? Number(row.validityHours) : null;
      // Always show 90 days validity regardless of provider data
      const validityDays = 90;
      const validity = `${validityDays} days`;
      const networkName = row.networkName ? String(row.networkName) : "";
      const networkId = row.networkId ? String(row.networkId) : "";
      const name = String(row.name ?? "");

      return {
        id: String(row.id),
        networkId,
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
        datamartPlanId:
          row.datamartPlanId != null ? String(row.datamartPlanId) : null,
        datamartPlanType:
          row.datamartPlanType != null ? String(row.datamartPlanType) : null,
        syncedAt: row.syncedAt
          ? new Date(String(row.syncedAt)).toISOString()
          : null,
        // Legacy aliases
        size_label: name,
        validity_label: validity || "N/A",
        price: effectivePrice,
        sizeMb: row.sizeMb != null ? Number(row.sizeMb) : null,
        network_id: networkId,
      };
    });

    const newestSync = plans
      .filter((p) => p.syncedAt)
      .map((p) => new Date(p.syncedAt!).getTime())
      .sort((a, b) => b - a)[0];

    const isStale =
      !newestSync || Date.now() - newestSync > 48 * 60 * 60 * 1000;

    return NextResponse.json({
      success: true,
      data: plans,
      stale: isStale,
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
