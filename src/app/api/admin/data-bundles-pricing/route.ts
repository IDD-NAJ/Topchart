import { NextRequest, NextResponse } from "next/server";
import { sql, sqlUnsafe } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

const DB_NETWORK_MAP: Record<string, string> = {
  MTN: "MTN",
  Telecel: "Telecel",
  Vodafone: "Telecel",
  AirtelTigo: "AirtelTigo",
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

    const dbNetworkCode = network ? (DB_NETWORK_MAP[network] || network) : undefined;

    const result = dbNetworkCode
      ? await sqlUnsafe(
          `SELECT
            b.id,
            n.name as "networkId",
            b.name,
            b."sizeMb",
            b."validityHours",
            b.price as "providerPrice",
            b."priceOverride",
            b."markupPercent",
            b."isPopular",
            b."isActive",
            b."isFeatured",
            b.stock,
            b."updatedAt"
          FROM data_bundles b
          LEFT JOIN networks n ON COALESCE(b."networkId", b.network_id::uuid) = n.id
          WHERE n.name = $1
          ORDER BY b.price ASC`,
          [dbNetworkCode]
        )
      : await sqlUnsafe(
          `SELECT
            b.id,
            n.name as "networkId",
            b.name,
            b."sizeMb",
            b."validityHours",
            b.price as "providerPrice",
            b."priceOverride",
            b."markupPercent",
            b."isPopular",
            b."isActive",
            b."isFeatured",
            b.stock,
            b."updatedAt"
          FROM data_bundles b
          LEFT JOIN networks n ON COALESCE(b."networkId", b.network_id::uuid) = n.id
          ORDER BY n.name, b.price ASC`
        );

    const bundles = (result as any[]).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      networkId: String(row.networkId),
      network: String(row.networkId),
      name: String(row.name),
      sizeMb: row.sizeMb ? Number(row.sizeMb) : null,
      validityHours: row.validityHours ? Number(row.validityHours) : null,
      providerPrice: Number(row.providerPrice),
      priceOverride: row.priceOverride ? Number(row.priceOverride) : null,
      markupPercent: row.markupPercent ? Number(row.markupPercent) : null,
      isPopular: Boolean(row.isPopular),
      isActive: Boolean(row.isActive),
      isFeatured: Boolean(row.isFeatured),
      stock: row.stock ? Number(row.stock) : null,
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
          await sqlUnsafe(
            `UPDATE data_bundles
            SET "priceOverride" = $1, "updatedAt" = NOW()
            WHERE "networkId" IN (SELECT id FROM networks WHERE name = $2)
              AND "isActive" = true`,
            [fixedAmount, networkCode]
          );
        } else {
          await sqlUnsafe(
            `UPDATE data_bundles
            SET "priceOverride" = price + $1, "markupPercent" = NULL, "updatedAt" = NOW()
            WHERE "networkId" IN (SELECT id FROM networks WHERE name = $2)
              AND "isActive" = true`,
            [fixedAmount, networkCode]
          );
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
          await sqlUnsafe(
            `UPDATE data_bundles
            SET "markupPercent" = $1, "priceOverride" = NULL, "updatedAt" = NOW()
            WHERE "networkId" IN (SELECT id FROM networks WHERE name = $2)
              AND "isActive" = true`,
            [pct, networkCode]
          );
        } else {
          await sqlUnsafe(
            `UPDATE data_bundles
            SET "markupPercent" = COALESCE("markupPercent", 0) + $1, "updatedAt" = NOW()
            WHERE "networkId" IN (SELECT id FROM networks WHERE name = $2)
              AND "isActive" = true`,
            [pct, networkCode]
          );
        }

        return NextResponse.json({
          success: true,
          message: `Applied ${pct}% markup to all ${networkCode} bundles`,
        });
      }

      if (mode === "clear") {
        await sqlUnsafe(
          `UPDATE data_bundles
          SET "priceOverride" = NULL, "markupPercent" = NULL, "updatedAt" = NOW()
          WHERE "networkId" IN (SELECT id FROM networks WHERE name = $1)`,
          [networkCode]
        );
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

    const { priceOverride, markupPercent, isActive, isFeatured, isPopular, stock } = updates;

    await sqlUnsafe(
      `UPDATE data_bundles
      SET
        "priceOverride" = $1,
        "markupPercent" = $2,
        "isActive" = $3,
        "isFeatured" = $4,
        "isPopular" = $5,
        stock = $6,
        "updatedAt" = NOW()
      WHERE id = $7`,
      [
        priceOverride !== undefined ? priceOverride : null,
        markupPercent !== undefined ? markupPercent : null,
        isActive !== undefined ? isActive : undefined,
        isFeatured !== undefined ? isFeatured : undefined,
        isPopular !== undefined ? isPopular : undefined,
        stock !== undefined ? stock : null,
        id,
      ]
    );

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
