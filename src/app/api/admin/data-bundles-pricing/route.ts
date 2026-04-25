import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

const DB_NETWORK_MAP: Record<string, string> = {
  MTN: "MTN",
  Telecel: "VODAFONE",
  Vodafone: "VODAFONE",
  AirtelTigo: "AIRTELTIGO",
};

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const network = searchParams.get("network");

    const dbCode = network ? DB_NETWORK_MAP[network] : undefined;

    const rows = dbCode
      ? sql`
          SELECT 
            b.id,
            b.network_id,
            b.name,
            b.size_mb,
            b.validity_hours,
            b.price as "providerPrice",
            b.price_override as "priceOverride",
            b.markup_percent as "markupPercent",
            b.is_popular as "isPopular",
            b.is_active as "isActive",
            b.is_featured as "isFeatured",
            b.updated_at
          FROM data_bundles b
          WHERE b.network_id = ${dbCode}
          ORDER BY b.price ASC
        `
      : sql`
          SELECT 
            b.id,
            b.network_id,
            b.name,
            b.size_mb,
            b.validity_hours,
            b.price as "providerPrice",
            b.price_override as "priceOverride",
            b.markup_percent as "markupPercent",
            b.is_popular as "isPopular",
            b.is_active as "isActive",
            b.is_featured as "isFeatured",
            b.updated_at
          FROM data_bundles b
          ORDER BY b.network_id, b.price ASC
        `;

    const result = await rows;

    const bundles = result.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      networkId: String(row.network_id),
      network: String(row.network_id),
      name: String(row.name),
      sizeMb: row.size_mb ? Number(row.size_mb) : null,
      validityHours: row.validity_hours ? Number(row.validity_hours) : null,
      providerPrice: Number(row.providerPrice),
      priceOverride: row.priceOverride ? Number(row.priceOverride) : null,
      markupPercent: row.markupPercent ? Number(row.markupPercent) : null,
      isPopular: Boolean(row.isPopular),
      isActive: Boolean(row.isActive),
      isFeatured: Boolean(row.isFeatured),
      updatedAt: row.updated_at ? String(row.updated_at) : null,
    }));

    return NextResponse.json({ success: true, data: bundles });
  } catch (error) {
    console.error("Admin pricing GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data bundles" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const body = await request.json();
    const { id, updates, bulkUpdate } = body;

    if (bulkUpdate) {
      const { networkCode, mode, amount, applyTo } = bulkUpdate;

      if (!networkCode) {
        return NextResponse.json(
          { success: false, error: "Network code is required for bulk updates" },
          { status: 400 }
        );
      }

      if (mode === "fixed" && amount !== undefined) {
        const fixedAmount = Number(amount);
        if (isNaN(fixedAmount)) {
          return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
        }

        if (applyTo === "override") {
          await sql`
            UPDATE data_bundles
            SET price_override = ${fixedAmount}, updated_at = NOW()
            WHERE network_id = ${networkCode}
              AND is_active = true
          `;
        } else {
          await sql`
            UPDATE data_bundles
            SET price_override = price + ${fixedAmount}, markup_percent = NULL, updated_at = NOW()
            WHERE network_id = ${networkCode}
              AND is_active = true
          `;
        }

        return NextResponse.json({
          success: true,
          message: `Added GH₵${fixedAmount.toFixed(2)} to all ${networkCode} bundles`,
        });
      }

      if (mode === "percent" && amount !== undefined) {
        const pct = Number(amount);
        if (isNaN(pct)) {
          return NextResponse.json({ success: false, error: "Invalid percentage" }, { status: 400 });
        }

        if (applyTo === "override") {
          await sql`
            UPDATE data_bundles
            SET markup_percent = ${pct}, price_override = NULL, updated_at = NOW()
            WHERE network_id = ${networkCode}
              AND is_active = true
          `;
        } else {
          await sql`
            UPDATE data_bundles
            SET markup_percent = COALESCE(markup_percent, 0) + ${pct}, updated_at = NOW()
            WHERE network_id = ${networkCode}
              AND is_active = true
          `;
        }

        return NextResponse.json({
          success: true,
          message: `Applied ${pct}% markup to all ${networkCode} bundles`,
        });
      }

      if (mode === "clear") {
        await sql`
          UPDATE data_bundles
          SET price_override = NULL, markup_percent = NULL, updated_at = NOW()
          WHERE network_id = ${networkCode}
        `;
        return NextResponse.json({
          success: true,
          message: `Cleared all pricing overrides for ${networkCode}`,
        });
      }

      return NextResponse.json(
        { success: false, error: "Invalid bulk update mode" },
        { status: 400 }
      );
    }

    if (!id || !updates) {
      return NextResponse.json(
        { success: false, error: "Bundle ID and updates are required" },
        { status: 400 }
      );
    }

    const { priceOverride, markupPercent, isActive, isFeatured, isPopular } = updates;

    await sql`
      UPDATE data_bundles
      SET 
        price_override = ${priceOverride !== undefined ? priceOverride : null},
        markup_percent = ${markupPercent !== undefined ? markupPercent : null},
        is_active = ${isActive !== undefined ? isActive : undefined},
        is_featured = ${isFeatured !== undefined ? isFeatured : undefined},
        is_popular = ${isPopular !== undefined ? isPopular : undefined},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({
      success: true,
      message: "Bundle updated successfully",
    });
  } catch (error) {
    console.error("Admin pricing PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update data bundle" },
      { status: 500 }
    );
  }
}
