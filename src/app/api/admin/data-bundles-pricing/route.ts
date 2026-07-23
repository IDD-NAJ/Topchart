export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { sql, sqlUnsafe } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    // Check if table exists
    const tableExists = await sql`SELECT to_regclass('public.data_bundles')`;
    if (!tableExists[0]?.to_regclass) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { searchParams } = new URL(request.url);
    const network = searchParams.get("network");

    const result = network
      ? await sqlUnsafe(
          `SELECT
            b.id,
            b.network,
            b.name,
            b.size_mb     AS "sizeMb",
            b.validity_hours AS "validityHours",
            b.price       AS "providerPrice",
            b.price_override  AS "priceOverride",
            b.markup_percent  AS "markupPercent",
            b.is_popular  AS "isPopular",
            b.is_active   AS "isActive",
            b.is_featured AS "isFeatured",
            b.stock,
            b.datamart_plan_id AS "datamartPlanId",
            b.datamart_plan_type AS "datamartPlanType",
            b.updated_at  AS "updatedAt"
          FROM data_bundles b
          WHERE b.network = $1
          ORDER BY b.price ASC`,
          [network]
        )
      : await sql`
          SELECT
            b.id,
            b.network,
            b.name,
            b.size_mb     AS "sizeMb",
            b.validity_hours AS "validityHours",
            b.price       AS "providerPrice",
            b.price_override  AS "priceOverride",
            b.markup_percent  AS "markupPercent",
            b.is_popular  AS "isPopular",
            b.is_active   AS "isActive",
            b.is_featured AS "isFeatured",
            b.stock,
            b.datamart_plan_id AS "datamartPlanId",
            b.datamart_plan_type AS "datamartPlanType",
            b.updated_at  AS "updatedAt"
          FROM data_bundles b
          ORDER BY b.network, b.price ASC
        `;

    const bundles = (result as any[]).map((row: Record<string, unknown>) => {
      const providerPrice = Number(row.providerPrice) || 0;
      const priceOverride = row.priceOverride != null ? Number(row.priceOverride) : null;
      const markupPercent = row.markupPercent != null ? Number(row.markupPercent) : null;
      const effectivePrice =
        priceOverride != null
          ? priceOverride
          : markupPercent != null
          ? providerPrice * (1 + markupPercent / 100)
          : providerPrice;

      return {
        id: String(row.id),
        networkId: String(row.network ?? ""),
        network: String(row.network ?? ""),
        name: String(row.name),
        sizeMb: row.sizeMb != null ? Number(row.sizeMb) : null,
        validityHours: row.validityHours != null ? Number(row.validityHours) : null,
        providerPrice,
        priceOverride,
        markupPercent,
        effectivePrice: Math.round(effectivePrice * 100) / 100,
        isPopular: Boolean(row.isPopular),
        isActive: Boolean(row.isActive),
        isFeatured: Boolean(row.isFeatured),
        stock: row.stock != null ? Number(row.stock) : null,
        datamartPlanId: row.datamartPlanId ? String(row.datamartPlanId) : null,
        datamartPlanType: row.datamartPlanType ? String(row.datamartPlanType) : null,
        updatedAt: row.updatedAt ? String(row.updatedAt) : null,
      };
    });

    return NextResponse.json({ success: true, data: bundles });
  } catch (error) {
    console.error("Admin pricing GET error:", error);
    return NextResponse.json(
      { success: true, data: [], warning: "Failed to fetch data bundles" },
      { status: 200 }
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

    // Check if table exists
    const tableExists = await sql`SELECT to_regclass('public.data_bundles')`;
    if (!tableExists[0]?.to_regclass) {
      return NextResponse.json({ success: false, error: "data_bundles table not provisioned" }, { status: 503 });
    }

    const body = await request.json();
    const { id, updates, bulkUpdate } = body;

    // ── Bulk update ──────────────────────────────────────────────────────────
    if (bulkUpdate) {
      const { networkCode, mode, amount } = bulkUpdate;

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
        await sqlUnsafe(
          `UPDATE data_bundles
           SET price_override = price + $1, markup_percent = NULL, updated_at = NOW()
           WHERE network = $2 AND is_active = true`,
          [fixedAmount, networkCode]
        );
        return NextResponse.json({
          success: true,
          message: `Added GH₵${fixedAmount.toFixed(2)} to all active ${networkCode} bundles`,
        });
      }

      if (mode === "percent" && amount !== undefined) {
        const pct = Number(amount);
        if (isNaN(pct)) {
          return NextResponse.json({ success: false, error: "Invalid percentage" }, { status: 400 });
        }
        await sqlUnsafe(
          `UPDATE data_bundles
           SET markup_percent = $1, price_override = NULL, updated_at = NOW()
           WHERE network = $2 AND is_active = true`,
          [pct, networkCode]
        );
        return NextResponse.json({
          success: true,
          message: `Applied ${pct}% markup to all active ${networkCode} bundles`,
        });
      }

      if (mode === "clear") {
        await sqlUnsafe(
          `UPDATE data_bundles
           SET price_override = NULL, markup_percent = NULL, updated_at = NOW()
           WHERE network = $1`,
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

    // ── Single bundle update ──────────────────────────────────────────────────
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
         price_override = $1,
         markup_percent = $2,
         is_active      = COALESCE($3, is_active),
         is_featured    = COALESCE($4, is_featured),
         is_popular     = COALESCE($5, is_popular),
         stock          = COALESCE($6, stock),
         updated_at     = NOW()
       WHERE id = $7`,
      [
        priceOverride !== undefined ? priceOverride : null,
        markupPercent !== undefined ? markupPercent : null,
        isActive !== undefined ? Boolean(isActive) : null,
        isFeatured !== undefined ? Boolean(isFeatured) : null,
        isPopular !== undefined ? Boolean(isPopular) : null,
        stock !== undefined ? Number(stock) : null,
        id,
      ]
    );

    return NextResponse.json({ success: true, message: "Bundle updated successfully" });
  } catch (error) {
    console.error("Admin pricing PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update data bundle" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    // Check if table exists
    const tableExists = await sql`SELECT to_regclass('public.data_bundles')`;
    if (!tableExists[0]?.to_regclass) {
      return NextResponse.json({ success: false, error: "data_bundles table not provisioned" }, { status: 503 });
    }

    const body = await request.json();
    const { network, name, size_mb, validity_hours, price, price_override, markup_percent, is_active, is_popular, is_featured, stock } = body;

    if (!network || !name || price == null) {
      return NextResponse.json({ success: false, error: "network, name and price are required" }, { status: 400 });
    }

    const id = `bundle_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    await sqlUnsafe(
      `INSERT INTO data_bundles
         (id, network, name, size_mb, validity_hours, price, price_override, markup_percent, is_active, is_popular, is_featured, stock, created_at, updated_at)
       VALUES
         ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, true), COALESCE($10, false), COALESCE($11, false), $12, NOW(), NOW())`,
      [id, network, name, size_mb ?? null, validity_hours ?? null, Number(price),
       price_override ?? null, markup_percent ?? null,
       is_active ?? true, is_popular ?? false, is_featured ?? false, stock ?? null]
    );

    return NextResponse.json({ success: true, message: "Bundle created", id });
  } catch (error) {
    console.error("Admin pricing POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create data bundle" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    // Check if table exists
    const tableExists = await sql`SELECT to_regclass('public.data_bundles')`;
    if (!tableExists[0]?.to_regclass) {
      return NextResponse.json({ success: false, error: "data_bundles table not provisioned" }, { status: 503 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });

    await sqlUnsafe(`DELETE FROM data_bundles WHERE id = $1`, [id]);
    return NextResponse.json({ success: true, message: "Bundle deleted" });
  } catch (error) {
    console.error("Admin pricing DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete data bundle" }, { status: 500 });
  }
}
