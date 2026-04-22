import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/auth";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const id = (await context.params).id;
    const user = await getCurrentUser();
    if (!user || user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, country, region, data_volume, validity_days, price, description, is_active } = body;

    let updateFields = [];
    if (name !== undefined) updateFields.push(`name = '${name.replace(/'/g, "''")}'`);
    if (country !== undefined) updateFields.push(`country = '${country.replace(/'/g, "''")}'`);
    if (region !== undefined) updateFields.push(region === null ? `region = NULL` : `region = '${region.replace(/'/g, "''")}'`);
    if (data_volume !== undefined) updateFields.push(`data_volume = '${data_volume.replace(/'/g, "''")}'`);
    if (validity_days !== undefined) updateFields.push(`validity_days = ${Number(validity_days)}`);
    if (price !== undefined) updateFields.push(`price = ${Number(price)}`);
    if (description !== undefined) updateFields.push(description === null ? `description = NULL` : `description = '${description.replace(/'/g, "''")}'`);
    if (is_active !== undefined) updateFields.push(`is_active = ${Boolean(is_active)}`);

    if (updateFields.length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    const result = await sql.unsafe(`
      UPDATE esim_products
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = '${id}'
      RETURNING *
    `);

    if (result.length === 0) {
       return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error("PATCH Data Product Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const id = (await context.params).id;
    const user = await getCurrentUser();
    if (!user || user.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Rather than hard-delete, we can soft delete or hard delete. The prompt said "Soft delete (is_active = false) or hard delete". We'll do a soft delete to avoid breaking historical orders.
    const result = await sql`
      UPDATE esim_products
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Product deactivated (soft deleted)" });
  } catch (error) {
    console.error("DELETE Data Product Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 });
  }
}
