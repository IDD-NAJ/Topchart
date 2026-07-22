export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { fetchVerificationPricingSettings } from "@/lib/verification-pricing-settings";

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseNullableMarkup(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = parseFiniteNumber(value);
  if (parsed === null || parsed < 0) return null;
  return parsed;
}

function validateMarkupRange(markup: number, min: number | null, max: number | null): boolean {
  if (min !== null && markup < min) return false;
  if (max !== null && markup > max) return false;
  return true;
}

export async function GET(_request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const services = await sql`
      SELECT 
        vs.id,
        vs.pvadeals_service_id,
        vs.name,
        vs.category,
        vs.picture_url,
        vs.country,
        vs.is_active,
        vs.markup_percentage,
        vs.str_price,
        vs.ltr3_price,
        vs.ltr7_price,
        vs.ltr14_price,
        vs.ltr30_price,
        vs.created_at,
        vs.updated_at,
        COALESCE(vn_stats.purchase_count, 0) as purchase_count,
        COALESCE(vn_stats.total_revenue, 0) as total_revenue
      FROM verification_services vs
      LEFT JOIN (
        SELECT service_id, COUNT(*) as purchase_count, SUM(purchase_price) as total_revenue
        FROM verification_numbers
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY service_id
      ) vn_stats ON vs.id = vn_stats.service_id
      ORDER BY vs.category, vs.name
    `;

    return NextResponse.json({
      success: true,
      data: { services },
    });
  } catch (error) {
    console.error("Admin verification services error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const body = await request.json();
    const serviceId = body.serviceId;
    const markupPercentageInput = body.markupPercentage ?? body.markup_percentage;
    const isActiveInput = body.isActive ?? body.is_active;
    const categoryInput = body.category;

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: "Service ID is required" },
        { status: 400 }
      );
    }

    if (markupPercentageInput !== undefined) {
      const normalizedMarkup = parseNullableMarkup(markupPercentageInput);
      if (normalizedMarkup === null) {
        return NextResponse.json(
          { success: false, error: "markupPercentage must be a non-negative number" },
          { status: 400 }
        );
      }

      const { minMarkup, maxMarkup } = await fetchVerificationPricingSettings();
      if (!validateMarkupRange(normalizedMarkup, minMarkup, maxMarkup)) {
        return NextResponse.json(
          {
            success: false,
            error: `markupPercentage must be within configured guard range (${minMarkup ?? "no min"} - ${maxMarkup ?? "no max"})`,
          },
          { status: 400 }
        );
      }
    }

    await sql`
      UPDATE verification_services
      SET 
        markup_percentage = COALESCE(${markupPercentageInput ?? null}, markup_percentage),
        is_active = COALESCE(${isActiveInput ?? null}, is_active),
        category = COALESCE(${categoryInput ?? null}, category),
        updated_at = NOW()
      WHERE id = ${serviceId}
    `;

    return NextResponse.json({
      success: true,
      message: "Service updated successfully",
    });
  } catch (error) {
    console.error("Admin update service error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update service" },
      { status: 500 }
    );
  }
}

// PATCH — update pricing fields for a service (used by admin verification-pricing page)
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
    const { id, markup_percentage, str_price, ltr3_price, ltr7_price, ltr14_price, ltr30_price, is_active } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Service ID is required" }, { status: 400 });
    }

    const markupVal = markup_percentage !== undefined && markup_percentage !== "" && markup_percentage !== null
      ? parseFloat(String(markup_percentage))
      : null;

    await sql`
      UPDATE verification_services
      SET
        markup_percentage = ${markupVal},
        str_price        = COALESCE(${str_price != null ? Number(str_price) : null}, str_price),
        ltr3_price       = COALESCE(${ltr3_price != null ? Number(ltr3_price) : null}, ltr3_price),
        ltr7_price       = COALESCE(${ltr7_price != null ? Number(ltr7_price) : null}, ltr7_price),
        ltr14_price      = COALESCE(${ltr14_price != null ? Number(ltr14_price) : null}, ltr14_price),
        ltr30_price      = COALESCE(${ltr30_price != null ? Number(ltr30_price) : null}, ltr30_price),
        is_active        = COALESCE(${is_active != null ? Boolean(is_active) : null}, is_active),
        updated_at       = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, message: "Service pricing updated" });
  } catch (error) {
    console.error("Admin PATCH service error:", error);
    return NextResponse.json({ success: false, error: "Failed to update service" }, { status: 500 });
  }
}
