import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { SMSPVA_SERVICES } from "@/lib/smspva";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const rows = await sql`
      SELECT service_code, name, category, base_usd_price, is_active,
             markup_percentage, picture_url, created_at, updated_at
      FROM smspva_services
      ORDER BY category, name
    `;

    return NextResponse.json({ success: true, data: { services: rows } });
  } catch (error) {
    console.error("[Admin SMSPVA services GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch international services" },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    let inserted = 0;
    for (const svc of SMSPVA_SERVICES) {
      const result = await sql`
        INSERT INTO smspva_services (service_code, name, category, base_usd_price)
        VALUES (${svc.code}, ${svc.name}, ${svc.category}, ${svc.baseUsdPrice})
        ON CONFLICT (service_code) DO UPDATE
          SET name           = EXCLUDED.name,
              category       = EXCLUDED.category,
              base_usd_price = EXCLUDED.base_usd_price,
              updated_at     = NOW()
        RETURNING (xmax = 0) AS was_inserted
      `;
      if ((result[0] as any)?.was_inserted) inserted++;
    }

    const total = await sql`SELECT COUNT(*) AS cnt FROM smspva_services`;

    return NextResponse.json({
      success: true,
      data: {
        inserted,
        total: parseInt(String((total[0] as any).cnt), 10),
        message: `Synced ${SMSPVA_SERVICES.length} services — ${inserted} new`,
      },
    });
  } catch (error) {
    console.error("[Admin SMSPVA services POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to sync international services" },
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
    const { serviceCode, isActive, markupPercentage } = body;

    if (!serviceCode) {
      return NextResponse.json(
        { success: false, error: "serviceCode is required" },
        { status: 400 }
      );
    }

    if (markupPercentage !== undefined && (typeof markupPercentage !== "number" || markupPercentage < 0)) {
      return NextResponse.json(
        { success: false, error: "markupPercentage must be a non-negative number" },
        { status: 400 }
      );
    }

    await sql`
      UPDATE smspva_services
      SET
        is_active         = COALESCE(${isActive ?? null}, is_active),
        markup_percentage = COALESCE(${markupPercentage ?? null}, markup_percentage),
        updated_at        = NOW()
      WHERE service_code = ${serviceCode}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin SMSPVA services PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update service" },
      { status: 500 }
    );
  }
}
