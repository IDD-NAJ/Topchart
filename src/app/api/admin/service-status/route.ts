import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ServiceStatus {
  id: string;
  service_key: string;
  service_name: string;
  description: string | null;
  is_coming_soon: boolean;
  coming_soon_message: string | null;
  expected_launch_date: string | null;
  is_enabled: boolean;
  display_order: number;
  icon_name: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

/**
 * GET - Fetch all service statuses (admin only)
 */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const services = await sql<ServiceStatus[]>`
      SELECT 
        id, service_key, service_name, description,
        is_coming_soon, coming_soon_message, expected_launch_date,
        is_enabled, display_order, icon_name,
        created_at, updated_at, updated_by
      FROM service_status
      ORDER BY display_order ASC, service_name ASC
    `;

    return NextResponse.json({
      success: true,
      services: services.map(s => ({
        ...s,
        expected_launch_date: s.expected_launch_date ? s.expected_launch_date.toString().split('T')[0] : null
      }))
    });
  } catch (error) {
    console.error("[Service Status API] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch service statuses" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update a single service status (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      service_key, 
      is_coming_soon, 
      coming_soon_message, 
      expected_launch_date,
      is_enabled 
    } = body;

    if (!service_key) {
      return NextResponse.json(
        { success: false, error: "service_key is required" },
        { status: 400 }
      );
    }

    // Fetch current values for audit
    const [currentService] = await sql<ServiceStatus[]>`
      SELECT * FROM service_status WHERE service_key = ${service_key}
    `;

    if (!currentService) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (typeof is_coming_soon === 'boolean') updates.is_coming_soon = is_coming_soon;
    if (typeof coming_soon_message === 'string') updates.coming_soon_message = coming_soon_message;
    if (expected_launch_date !== undefined) updates.expected_launch_date = expected_launch_date || null;
    if (typeof is_enabled === 'boolean') updates.is_enabled = is_enabled;

    // Perform update
    const [updatedService] = await sql<ServiceStatus[]>`
      UPDATE service_status
      SET 
        is_coming_soon = COALESCE(${updates.is_coming_soon ?? null}::boolean, is_coming_soon),
        coming_soon_message = COALESCE(${updates.coming_soon_message ?? null}::text, coming_soon_message),
        expected_launch_date = ${updates.expected_launch_date ?? currentService.expected_launch_date}::date,
        is_enabled = COALESCE(${updates.is_enabled ?? null}::boolean, is_enabled),
        updated_by = ${admin.id}::uuid,
        updated_at = NOW()
      WHERE service_key = ${service_key}
      RETURNING *
    `;

    // Determine action type for audit
    let action = 'updated';
    if (typeof is_coming_soon === 'boolean') {
      action = is_coming_soon ? 'coming_soon_enabled' : 'coming_soon_disabled';
    }

    // Log audit entry
    await sql`
      INSERT INTO service_status_audit (
        service_status_id, service_key, action, old_values, new_values, changed_by
      ) VALUES (
        ${updatedService.id}::uuid,
        ${service_key},
        ${action},
        ${JSON.stringify({
          is_coming_soon: currentService.is_coming_soon,
          coming_soon_message: currentService.coming_soon_message,
          expected_launch_date: currentService.expected_launch_date,
          is_enabled: currentService.is_enabled
        })}::jsonb,
        ${JSON.stringify({
          is_coming_soon: updatedService.is_coming_soon,
          coming_soon_message: updatedService.coming_soon_message,
          expected_launch_date: updatedService.expected_launch_date,
          is_enabled: updatedService.is_enabled
        })}::jsonb,
        ${admin.id}::uuid
      )
    `;

    return NextResponse.json({
      success: true,
      service: {
        ...updatedService,
        expected_launch_date: updatedService.expected_launch_date 
          ? updatedService.expected_launch_date.toString().split('T')[0] 
          : null
      }
    });
  } catch (error) {
    console.error("[Service Status API] PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update service status" },
      { status: 500 }
    );
  }
}

/**
 * POST - Bulk update service statuses (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body as { updates: Array<{ service_key: string; is_coming_soon: boolean }> };

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "updates array is required" },
        { status: 400 }
      );
    }

    const results = [];

    for (const update of updates) {
      const { service_key, is_coming_soon } = update;
      
      if (!service_key || typeof is_coming_soon !== 'boolean') continue;

      const [currentService] = await sql<ServiceStatus[]>`
        SELECT * FROM service_status WHERE service_key = ${service_key}
      `;

      if (!currentService) continue;

      const [updatedService] = await sql<ServiceStatus[]>`
        UPDATE service_status
        SET 
          is_coming_soon = ${is_coming_soon},
          updated_by = ${admin.id}::uuid,
          updated_at = NOW()
        WHERE service_key = ${service_key}
        RETURNING *
      `;

      // Log audit
      await sql`
        INSERT INTO service_status_audit (
          service_status_id, service_key, action, old_values, new_values, changed_by
        ) VALUES (
          ${updatedService.id}::uuid,
          ${service_key},
          ${is_coming_soon ? 'coming_soon_enabled' : 'coming_soon_disabled'},
          ${JSON.stringify({ is_coming_soon: currentService.is_coming_soon })}::jsonb,
          ${JSON.stringify({ is_coming_soon: updatedService.is_coming_soon })}::jsonb,
          ${admin.id}::uuid
        )
      `;

      results.push(updatedService);
    }

    return NextResponse.json({
      success: true,
      updated: results.length,
      services: results
    });
  } catch (error) {
    console.error("[Service Status API] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to bulk update service statuses" },
      { status: 500 }
    );
  }
}
