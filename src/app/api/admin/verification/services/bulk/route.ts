import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

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

    await sql.query(query, values);

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
    `;

    const result = await sql.query(query, values);

    return NextResponse.json({
      success: true,
      message: `Updated all services in ${category}`,
      affected: result.rowCount,
    });
  } catch (error) {
    console.error("Category update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update category" },
      { status: 500 }
    );
  }
}
