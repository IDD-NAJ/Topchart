import { NextRequest, NextResponse } from "next/server";
import { sqlUnsafe } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get("network");

    const rows = await sqlUnsafe(
      `SELECT
        b.id,
        b.datamart_plan_id as capacity,
        n.name as network_name,
        n.code as network_code,
        b."sizeMb" as size_mb,
        b."validityHours" as validity_hours,
        b.price as provider_price,
        b."priceOverride" as price_override,
        b."markupPercent" as markup_percent,
        b."isPopular" as is_popular,
        b.is_active
      FROM data_bundles b
      JOIN data_networks n ON b.network_id = n.id
      WHERE b.is_active = true
        ${network ? `AND n.name ILIKE $1` : ""}
      ORDER BY n.name, b.price ASC`,
      network ? [`%${network}%`] : []
    );

    type BundleRow = {
      id: string;
      capacity: string;
      network_name: string;
      network_code: string;
      size_mb: number;
      validity_hours: number;
      provider_price: number;
      price_override: number | null;
      markup_percent: number | null;
      is_popular: boolean;
      is_active: boolean;
    };

    const bundles = (rows as BundleRow[]).map((b) => {
      const providerPrice = Number(b.provider_price);
      const priceOverride = b.price_override ? Number(b.price_override) : null;
      const markupPercent = b.markup_percent ? Number(b.markup_percent) : null;

      let effectivePrice = providerPrice;
      if (priceOverride && priceOverride > 0) {
        effectivePrice = priceOverride;
      } else if (markupPercent && markupPercent > 0) {
        effectivePrice = Number((providerPrice * (1 + markupPercent / 100)).toFixed(2));
      }

      const sizeMb = Number(b.size_mb);
      const sizeLabel =
        sizeMb >= 1024
          ? `${(sizeMb / 1024).toFixed(sizeMb % 1024 === 0 ? 0 : 1)}GB`
          : `${sizeMb}MB`;

      const validityHours = Number(b.validity_hours);
      const validityLabel =
        validityHours >= 720
          ? `${Math.round(validityHours / 720)} Month`
          : validityHours >= 168
          ? `${Math.round(validityHours / 168)} Week`
          : validityHours >= 24
          ? `${Math.round(validityHours / 24)} Day`
          : `${validityHours}hr`;

      return {
        id: b.id,
        capacity: b.capacity,
        network_name: b.network_name,
        network_code: b.network_code,
        size_label: sizeLabel,
        size_mb: sizeMb,
        validity_label: validityLabel,
        validity_hours: validityHours,
        price: effectivePrice,
        is_popular: b.is_popular,
      };
    });

    return NextResponse.json({ success: true, bundles });
  } catch (error) {
    console.error("[guest/bundles] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load bundles", bundles: [] },
      { status: 500 }
    );
  }
}
