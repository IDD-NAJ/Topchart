import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

// GET - Fetch all data packages
export async function GET() {
  try {
    const session = await requireAuth();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const packages = await sql`
      SELECT 
        id,
        country,
        country_code,
        flag,
        data_allowance,
        validity,
        price,
        network,
        speed,
        region,
        is_active,
        sort_order,
        created_at,
        updated_at
      FROM esim_data_packages
      ORDER BY sort_order ASC, price ASC
    `;

    return NextResponse.json({
      success: true,
      data: packages.map((p: any) => ({
        id: p.id,
        country: p.country,
        countryCode: p.country_code,
        flag: p.flag,
        dataAllowance: p.data_allowance,
        validity: p.validity,
        price: parseFloat(p.price),
        network: p.network,
        speed: p.speed,
        region: p.region,
        isActive: p.is_active,
        sortOrder: p.sort_order,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch data packages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch packages" },
      { status: 500 }
    );
  }
}

// POST - Create new package
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const packageSchema = z.object({
      id: z.string().min(1).max(50).optional(),
      country: z.string().min(1).max(100),
      countryCode: z.string().min(2).max(5),
      flag: z.string().max(10).default(""),
      dataAllowance: z.string().min(1).max(50),
      validity: z.string().min(1).max(50),
      price: z.number().positive(),
      network: z.string().min(1).max(100),
      speed: z.string().min(1).max(50),
      region: z.string().min(1).max(50),
      isActive: z.boolean().default(true),
      sortOrder: z.number().int().default(0),
    });

    const validation = packageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;
    const pkgId = data.id || `pkg_${Date.now()}`;

    const [pkg] = await sql`
      INSERT INTO esim_data_packages (
        id,
        country,
        country_code,
        flag,
        data_allowance,
        validity,
        price,
        network,
        speed,
        region,
        is_active,
        sort_order
      ) VALUES (
        ${pkgId},
        ${data.country},
        ${data.countryCode},
        ${data.flag},
        ${data.dataAllowance},
        ${data.validity},
        ${data.price},
        ${data.network},
        ${data.speed},
        ${data.region},
        ${data.isActive},
        ${data.sortOrder}
      )
      ON CONFLICT (id) DO UPDATE SET
        country = EXCLUDED.country,
        country_code = EXCLUDED.country_code,
        flag = EXCLUDED.flag,
        data_allowance = EXCLUDED.data_allowance,
        validity = EXCLUDED.validity,
        price = EXCLUDED.price,
        network = EXCLUDED.network,
        speed = EXCLUDED.speed,
        region = EXCLUDED.region,
        is_active = EXCLUDED.is_active,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: {
        id: pkg.id,
        country: pkg.country,
        countryCode: pkg.country_code,
        flag: pkg.flag,
        dataAllowance: pkg.data_allowance,
        validity: pkg.validity,
        price: parseFloat(pkg.price),
        network: pkg.network,
        speed: pkg.speed,
        region: pkg.region,
        isActive: pkg.is_active,
        sortOrder: pkg.sort_order,
      },
    });
  } catch (error) {
    console.error("Failed to create data package:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create package" },
      { status: 500 }
    );
  }
}

// PUT - Update package
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
        { success: false, error: "Package ID is required" },
        { status: 400 }
      );
    }

    const [pkg] = await sql`
      UPDATE esim_data_packages
      SET 
        country = ${updates.country ?? sql`country`},
        country_code = ${updates.countryCode ?? sql`country_code`},
        flag = ${updates.flag ?? sql`flag`},
        data_allowance = ${updates.dataAllowance ?? sql`data_allowance`},
        validity = ${updates.validity ?? sql`validity`},
        price = ${updates.price ?? sql`price`},
        network = ${updates.network ?? sql`network`},
        speed = ${updates.speed ?? sql`speed`},
        region = ${updates.region ?? sql`region`},
        is_active = ${updates.isActive ?? sql`is_active`},
        sort_order = ${updates.sortOrder ?? sql`sort_order`},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!pkg) {
      return NextResponse.json(
        { success: false, error: "Package not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: pkg.id,
        country: pkg.country,
        countryCode: pkg.country_code,
        flag: pkg.flag,
        dataAllowance: pkg.data_allowance,
        validity: pkg.validity,
        price: parseFloat(pkg.price),
        network: pkg.network,
        speed: pkg.speed,
        region: pkg.region,
        isActive: pkg.is_active,
        sortOrder: pkg.sort_order,
      },
    });
  } catch (error) {
    console.error("Failed to update data package:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update package" },
      { status: 500 }
    );
  }
}

// DELETE - Delete package
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
        { success: false, error: "Package ID is required" },
        { status: 400 }
      );
    }

    await sql`DELETE FROM esim_data_packages WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete data package:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete package" },
      { status: 500 }
    );
  }
}
