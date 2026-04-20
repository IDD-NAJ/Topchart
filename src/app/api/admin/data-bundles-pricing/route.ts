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
            b."networkId",
            n.code as "networkCode",
            n.name as "networkName",
            b.name,
            b."sizeMb",
            b."validityHours",
            b.price as "providerPrice",
            b."priceOverride",
            b."markupPercent",
            b."isPopular",
            b."isActive",
            b."isFeatured",
            b."updatedAt"
          FROM data_bundles b
          JOIN networks n ON n.id = b."networkId"
          WHERE n.code = ${dbCode}
          ORDER BY b.price ASC
        `
      : sql`
          SELECT 
            b.id,
            b."networkId",
            n.code as "networkCode",
            n.name as "networkName",
            b.name,
            b."sizeMb",
            b."validityHours",
            b.price as "providerPrice",
            b."priceOverride",
            b."markupPercent",
            b."isPopular",
            b."isActive",
            b."isFeatured",
            b."updatedAt"
          FROM data_bundles b
          JOIN networks n ON n.id = b."networkId"
          ORDER BY n.code, b.price ASC
        `;

    const result = await rows;

    const bundles = result.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      networkId: String(row.networkId),
      network: String(row.networkName),
      networkCode: String(row.networkCode),
      name: String(row.name),
      sizeMb: row.sizeMb ? Number(row.sizeMb) : null,
      validityHours: row.validityHours ? Number(row.validityHours) : null,
      providerPrice: Number(row.providerPrice),
      priceOverride: row.priceOverride ? Number(row.priceOverride) : null,
      markupPercent: row.markupPercent ? Number(row.markupPercent) : null,
      isPopular: Boolean(row.isPopular),
      isActive: Boolean(row.isActive),
      isFeatured: Boolean(row.isFeatured),
      updatedAt: row.updatedAt ? String(row.updatedAt) : null,
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
            SET "priceOverride" = ${fixedAmount}, "updatedAt" = NOW()
            WHERE "networkId" IN (SELECT id FROM networks WHERE code = ${networkCode})
              AND "isActive" = true
          `;
        } else {
          await sql`
            UPDATE data_bundles
            SET "priceOverride" = price + ${fixedAmount}, "markupPercent" = NULL, "updatedAt" = NOW()
            WHERE "networkId" IN (SELECT id FROM networks WHERE code = ${networkCode})
              AND "isActive" = true
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
            SET "markupPercent" = ${pct}, "priceOverride" = NULL, "updatedAt" = NOW()
            WHERE "networkId" IN (SELECT id FROM networks WHERE code = ${networkCode})
              AND "isActive" = true
          `;
        } else {
          await sql`
            UPDATE data_bundles
            SET "markupPercent" = COALESCE("markupPercent", 0) + ${pct}, "updatedAt" = NOW()
            WHERE "networkId" IN (SELECT id FROM networks WHERE code = ${networkCode})
              AND "isActive" = true
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
          SET "priceOverride" = NULL, "markupPercent" = NULL, "updatedAt" = NOW()
          WHERE "networkId" IN (SELECT id FROM networks WHERE code = ${networkCode})
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
        "priceOverride" = ${priceOverride !== undefined ? priceOverride : null},
        "markupPercent" = ${markupPercent !== undefined ? markupPercent : null},
        "isActive" = ${isActive !== undefined ? isActive : undefined},
        "isFeatured" = ${isFeatured !== undefined ? isFeatured : undefined},
        "isPopular" = ${isPopular !== undefined ? isPopular : undefined},
        "updatedAt" = NOW()
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
