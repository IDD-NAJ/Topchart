export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sqlUnsafe } from "@/lib/db";
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

async function getMarkupGuards(): Promise<{ minMarkup: number | null; maxMarkup: number | null }> {
  const settings = await fetchVerificationPricingSettings();
  return {
    minMarkup: settings.minMarkup,
    maxMarkup: settings.maxMarkup,
  };
}

function validateMarkupRange(markup: number, min: number | null, max: number | null): boolean {
  if (min !== null && markup < min) return false;
  if (max !== null && markup > max) return false;
  return true;
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
    const { serviceIds, markupPercentage, isActive, category } = body;

    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Service IDs array is required" },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (markupPercentage !== undefined) {
      const normalizedMarkup = parseNullableMarkup(markupPercentage);
      if (normalizedMarkup === null) {
        return NextResponse.json(
          { success: false, error: "markupPercentage must be a non-negative number" },
          { status: 400 }
        );
      }

      const guards = await getMarkupGuards();
      if (!validateMarkupRange(normalizedMarkup, guards.minMarkup, guards.maxMarkup)) {
        return NextResponse.json(
          {
            success: false,
            error: `markupPercentage must be within configured guard range (${guards.minMarkup ?? "no min"} - ${guards.maxMarkup ?? "no max"})`,
          },
          { status: 400 }
        );
      }
    }

    if (markupPercentage !== undefined) {
      updates.push(`markup_percentage = $${paramIndex}`);
      values.push(markupPercentage);
      paramIndex++;
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(isActive);
      paramIndex++;
    }

    if (category !== undefined) {
      updates.push(`category = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    updates.push(`updated_at = NOW()`);

    const placeholders = serviceIds.map((_, i) => `$${paramIndex + i}`).join(", ");
    values.push(...serviceIds);

    const query = `
      UPDATE verification_services
      SET ${updates.join(", ")}
      WHERE id IN (${placeholders})
    `;

    await sqlUnsafe(query, values);

    return NextResponse.json({
      success: true,
      message: `Updated ${serviceIds.length} services`,
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update services" },
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
    const { category, markupPercentage, isActive } = body;

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category is required" },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [category];
    let paramIndex = 2;

    if (markupPercentage !== undefined) {
      const normalizedMarkup = parseNullableMarkup(markupPercentage);
      if (normalizedMarkup === null) {
        return NextResponse.json(
          { success: false, error: "markupPercentage must be a non-negative number" },
          { status: 400 }
        );
      }

      const guards = await getMarkupGuards();
      if (!validateMarkupRange(normalizedMarkup, guards.minMarkup, guards.maxMarkup)) {
        return NextResponse.json(
          {
            success: false,
            error: `markupPercentage must be within configured guard range (${guards.minMarkup ?? "no min"} - ${guards.maxMarkup ?? "no max"})`,
          },
          { status: 400 }
        );
      }
    }

    if (markupPercentage !== undefined) {
      updates.push(`markup_percentage = $${paramIndex}`);
      values.push(markupPercentage);
      paramIndex++;
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(isActive);
      paramIndex++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE verification_services
      SET ${updates.join(", ")}
      WHERE category = $1
      RETURNING id
    `;

    const result = await sqlUnsafe(query, values);

    return NextResponse.json({
      success: true,
      message: `Updated all services in ${category}`,
      affected: (result as any[]).length,
    });
  } catch (error) {
    console.error("Category update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update category" },
      { status: 500 }
    );
  }
}
