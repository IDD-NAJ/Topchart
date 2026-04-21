import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

// GET - Fetch all phone plans
export async function GET() {
  try {
    const session = await requireAuth();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plans = await sql`
      SELECT 
        id,
        name,
        price,
        minutes,
        sms,
        validity_days,
        features,
        is_active,
        popular,
        sort_order,
        created_at,
        updated_at
      FROM esim_phone_plans
      ORDER BY sort_order ASC, price ASC
    `;

    return NextResponse.json({
      success: true,
      data: plans.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price),
        minutes: p.minutes,
        sms: p.sms,
        validityDays: p.validity_days,
        features: p.features || [],
        isActive: p.is_active,
        popular: p.popular,
        sortOrder: p.sort_order,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch phone plans:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}

// POST - Create new plan
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const planSchema = z.object({
      id: z.string().min(1).max(50).optional(),
      name: z.string().min(1).max(100),
      price: z.number().positive(),
      minutes: z.number().int().min(0),
      sms: z.number().int().min(0),
      validityDays: z.number().int().min(1),
      features: z.array(z.string()).default([]),
      isActive: z.boolean().default(true),
      popular: z.boolean().default(false),
      sortOrder: z.number().int().default(0),
    });

    const validation = planSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;
    const planId = data.id || `plan_${Date.now()}`;

    const [plan] = await sql`
      INSERT INTO esim_phone_plans (
        id,
        name,
        price,
        minutes,
        sms,
        validity_days,
        features,
        is_active,
        popular,
        sort_order
      ) VALUES (
        ${planId},
        ${data.name},
        ${data.price},
        ${data.minutes},
        ${data.sms},
        ${data.validityDays},
        ${JSON.stringify(data.features)},
        ${data.isActive},
        ${data.popular},
        ${data.sortOrder}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        minutes = EXCLUDED.minutes,
        sms = EXCLUDED.sms,
        validity_days = EXCLUDED.validity_days,
        features = EXCLUDED.features,
        is_active = EXCLUDED.is_active,
        popular = EXCLUDED.popular,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: {
        id: plan.id,
        name: plan.name,
        price: parseFloat(plan.price),
        minutes: plan.minutes,
        sms: plan.sms,
        validityDays: plan.validity_days,
        features: plan.features || [],
        isActive: plan.is_active,
        popular: plan.popular,
        sortOrder: plan.sort_order,
      },
    });
  } catch (error) {
    console.error("Failed to create phone plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create plan" },
      { status: 500 }
    );
  }
}

// PUT - Update plan
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Plan ID is required" },
        { status: 400 }
      );
    }

    const [plan] = await sql`
      UPDATE esim_phone_plans
      SET 
        name = ${updates.name ?? sql`name`},
        price = ${updates.price ?? sql`price`},
        minutes = ${updates.minutes ?? sql`minutes`},
        sms = ${updates.sms ?? sql`sms`},
        validity_days = ${updates.validityDays ?? sql`validity_days`},
        features = ${updates.features ? JSON.stringify(updates.features) : sql`features`},
        is_active = ${updates.isActive ?? sql`is_active`},
        popular = ${updates.popular ?? sql`popular`},
        sort_order = ${updates.sortOrder ?? sql`sort_order`},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: plan.id,
        name: plan.name,
        price: parseFloat(plan.price),
        minutes: plan.minutes,
        sms: plan.sms,
        validityDays: plan.validity_days,
        features: plan.features || [],
        isActive: plan.is_active,
        popular: plan.popular,
        sortOrder: plan.sort_order,
      },
    });
  } catch (error) {
    console.error("Failed to update phone plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update plan" },
      { status: 500 }
    );
  }
}

// DELETE - Delete plan
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Plan ID is required" },
        { status: 400 }
      );
    }

    await sql`DELETE FROM esim_phone_plans WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete phone plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete plan" },
      { status: 500 }
    );
  }
}
