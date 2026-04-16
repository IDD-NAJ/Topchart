import { NextRequest, NextResponse } from "next/server";
import { sql, sqlUnsafe } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

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
    const planType = searchParams.get("planType");

    let query;
    if (network) {
      query = sql`
        SELECT 
          id,
          network_id as "networkId",
          network,
          name,
          validity,
          validity_hours as "validityHours",
          validity_days as "validityDays",
          price as "providerPrice",
          original_price as "originalPrice",
          price_override as "priceOverride",
          markup_percent as "markupPercent",
          is_popular as "isPopular",
          is_active as "isActive",
          is_featured as "isFeatured",
          datamart_plan_id as "datamartPlanId",
          datamart_plan_type as "datamartPlanType",
          notes,
          synced_at as "syncedAt",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM data_bundles
        WHERE network = ${network}
        ORDER BY price ASC
      `;
    } else if (planType) {
      query = sql`
        SELECT 
          id,
          network_id as "networkId",
          network,
          name,
          validity,
          validity_hours as "validityHours",
          validity_days as "validityDays",
          price as "providerPrice",
          original_price as "originalPrice",
          price_override as "priceOverride",
          markup_percent as "markupPercent",
          is_popular as "isPopular",
          is_active as "isActive",
          is_featured as "isFeatured",
          datamart_plan_id as "datamartPlanId",
          datamart_plan_type as "datamartPlanType",
          notes,
          synced_at as "syncedAt",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM data_bundles
        WHERE datamart_plan_type = ${planType}
        ORDER BY network, price ASC
      `;
    } else {
      query = sql`
        SELECT 
          id,
          network_id as "networkId",
          network,
          name,
          validity,
          validity_hours as "validityHours",
          validity_days as "validityDays",
          price as "providerPrice",
          original_price as "originalPrice",
          price_override as "priceOverride",
          markup_percent as "markupPercent",
          is_popular as "isPopular",
          is_active as "isActive",
          is_featured as "isFeatured",
          datamart_plan_id as "datamartPlanId",
          datamart_plan_type as "datamartPlanType",
          notes,
          synced_at as "syncedAt",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM data_bundles
        ORDER BY network, price ASC
      `;
    }

    const rows = await query;

    const bundles = rows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      networkId: String(row.networkId),
      network: String(row.network),
      name: String(row.name),
      validity: row.validity ? String(row.validity) : null,
      validityHours: row.validityHours ? Number(row.validityHours) : null,
      validityDays: row.validityDays ? Number(row.validityDays) : null,
      providerPrice: Number(row.providerPrice),
      originalPrice: row.originalPrice ? Number(row.originalPrice) : null,
      priceOverride: row.priceOverride ? Number(row.priceOverride) : null,
      markupPercent: row.markupPercent ? Number(row.markupPercent) : null,
      isPopular: Boolean(row.isPopular),
      isActive: Boolean(row.isActive),
      isFeatured: Boolean(row.isFeatured),
      datamartPlanId: row.datamartPlanId ? String(row.datamartPlanId) : null,
      datamartPlanType: row.datamartPlanType ? String(row.datamartPlanType) : null,
      notes: row.notes ? String(row.notes) : null,
      syncedAt: row.syncedAt ? String(row.syncedAt) : null,
      createdAt: row.createdAt ? String(row.createdAt) : null,
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
    const { id, updates, bulkNetworkUpdates } = body;

    if (bulkNetworkUpdates) {
      const { network, markupPercent, priceOverride, isActive, isFeatured } = bulkNetworkUpdates;
      
      if (!network) {
        return NextResponse.json(
          { success: false, error: "Network is required for bulk updates" },
          { status: 400 }
        );
      }

      const updateFields: string[] = [];
      const values: (string | number | boolean | null)[] = [];
      let paramIndex = 1;

      if (markupPercent !== undefined) {
        updateFields.push(`markup_percent = $${paramIndex++}`);
        values.push(markupPercent);
      }
      if (priceOverride !== undefined) {
        updateFields.push(`price_override = $${paramIndex++}`);
        values.push(priceOverride);
      }
      if (isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(isActive);
      }
      if (isFeatured !== undefined) {
        updateFields.push(`is_featured = $${paramIndex++}`);
        values.push(isFeatured);
      }

      if (updateFields.length === 0) {
        return NextResponse.json(
          { success: false, error: "No fields to update" },
          { status: 400 }
        );
      }

      values.push(network);

      await sqlUnsafe(`
        UPDATE data_bundles
        SET ${updateFields.join(", ")}, updated_at = NOW()
        WHERE network = $${paramIndex}
      `, values);

      return NextResponse.json({
        success: true,
        message: `Updated all bundles for network: ${network}`,
      });
    }

    if (!id || !updates) {
      return NextResponse.json(
        { success: false, error: "Bundle ID and updates are required" },
        { status: 400 }
      );
    }

    const { 
      priceOverride, 
      markupPercent, 
      isActive, 
      isFeatured, 
      isPopular,
      notes 
    } = updates;

    await sql`
      UPDATE data_bundles
      SET 
        price_override = ${priceOverride !== undefined ? priceOverride : null},
        markup_percent = ${markupPercent !== undefined ? markupPercent : null},
        is_active = ${isActive !== undefined ? isActive : undefined},
        is_featured = ${isFeatured !== undefined ? isFeatured : undefined},
        is_popular = ${isPopular !== undefined ? isPopular : undefined},
        notes = ${notes !== undefined ? notes : undefined},
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
