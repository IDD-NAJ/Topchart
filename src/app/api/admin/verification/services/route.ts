import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
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

    const services = await sql`
      SELECT 
        id,
        textverified_service_id,
        name,
        category,
        description,
        is_active,
        base_cost,
        markup_percentage,
        rental_multiplier,
        created_at,
        updated_at
      FROM verification_services
      ORDER BY category, name
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
    const { serviceId, baseCost, markupPercentage, rentalMultiplier, isActive } = body;

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: "Service ID is required" },
        { status: 400 }
      );
    }

    await sql`
      UPDATE verification_services
      SET 
        base_cost = COALESCE(${baseCost}, base_cost),
        markup_percentage = COALESCE(${markupPercentage}, markup_percentage),
        rental_multiplier = COALESCE(${rentalMultiplier}, rental_multiplier),
        is_active = COALESCE(${isActive}, is_active),
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
