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
  is_maintenance: boolean;
  maintenance_message: string | null;
  display_order: number;
  icon_name: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
  maintenance_starts_at?: string | null;
  maintenance_ends_at?: string | null;
  maintenance_auto_resume?: boolean;
}

interface ServiceStatusAudit {
  id: string;
  service_key: string;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_at: string;
  changed_by: string | null;
}

const SERVICE_HEALTH_ENDPOINTS: Record<string, string> = {
  data: "/api/purchases/plans",
  verification: "/api/verification/numbers",
  giftcards: "/api/giftcards/providers",
  exam_checker: "/api/results/checkers",
};

async function applyScheduledMaintenance() {
  try {
    await sql`
      UPDATE service_status
      SET is_maintenance = true, updated_at = NOW()
      WHERE maintenance_starts_at IS NOT NULL
        AND maintenance_ends_at IS NOT NULL
        AND NOW() BETWEEN maintenance_starts_at AND maintenance_ends_at
        AND is_maintenance = false
    `;

    await sql`
      UPDATE service_status
      SET is_maintenance = false, updated_at = NOW()
      WHERE maintenance_auto_resume = true
        AND maintenance_ends_at IS NOT NULL
        AND NOW() > maintenance_ends_at
        AND is_maintenance = true
    `;
  } catch {
  }
}

async function checkServiceHealth(serviceKey: string, request: NextRequest): Promise<{ status: "healthy" | "degraded" | "unreachable"; latencyMs: number | null; endpoint: string | null }> {
  const endpoint = SERVICE_HEALTH_ENDPOINTS[serviceKey];
  if (!endpoint) {
    return { status: "healthy", latencyMs: null, endpoint: null };
  }

  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("host") || "localhost:3000";
  const target = `${protocol}://${host}${endpoint}`;
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(target, { cache: "no-store", signal: controller.signal });
    clearTimeout(timeout);
    const latencyMs = Date.now() - start;
    if (response.ok && latencyMs <= 2000) {
      return { status: "healthy", latencyMs, endpoint };
    }
    if (response.ok) {
      return { status: "degraded", latencyMs, endpoint };
    }
    return { status: "unreachable", latencyMs, endpoint };
  } catch {
    return { status: "unreachable", latencyMs: null, endpoint };
  }
}

/**
 * GET - Fetch all service statuses (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeAudit = searchParams.get("includeAudit") === "true";
    const includeHealth = searchParams.get("includeHealth") === "true";

    await applyScheduledMaintenance();

    const services = (await sql`
      SELECT 
        id, service_key, service_name, description,
        is_coming_soon, coming_soon_message, expected_launch_date,
        is_enabled, is_maintenance, maintenance_message,
        display_order, icon_name,
        maintenance_starts_at, maintenance_ends_at, maintenance_auto_resume,
        created_at, updated_at, updated_by
      FROM service_status
      ORDER BY display_order ASC, service_name ASC
    `) as ServiceStatus[];

    const audits = includeAudit
      ? (await sql`
          SELECT id, service_key, action, old_values, new_values, changed_at, changed_by
          FROM service_status_audit
          ORDER BY changed_at DESC
          LIMIT 100
        `) as ServiceStatusAudit[]
      : [];

    const health = includeHealth
      ? await Promise.all(
          services.map(async (service) => ({
            service_key: service.service_key,
            ...(await checkServiceHealth(service.service_key, request)),
          }))
        )
      : [];

    return NextResponse.json({
      success: true,
      services: services.map(s => ({
        ...s,
        expected_launch_date: s.expected_launch_date ? s.expected_launch_date.toString().split('T')[0] : null,
        maintenance_starts_at: s.maintenance_starts_at ? new Date(s.maintenance_starts_at).toISOString() : null,
        maintenance_ends_at: s.maintenance_ends_at ? new Date(s.maintenance_ends_at).toISOString() : null,
      })),
      audits,
      health,
    });
  } catch (error) {
    console.error("[Service Status API] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch service statuses" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const serviceKey = String(body.service_key || "").trim().toLowerCase();
    const serviceName = String(body.service_name || "").trim();
    const description = String(body.description || "").trim() || null;
    const iconName = String(body.icon_name || "").trim() || null;

    if (!serviceKey || !serviceName) {
      return NextResponse.json({ success: false, error: "service_key and service_name are required" }, { status: 400 });
    }

    const inserted = (await sql`
      INSERT INTO service_status (
        service_key, service_name, description, icon_name,
        is_enabled, is_coming_soon, is_maintenance, display_order, updated_by
      ) VALUES (
        ${serviceKey}, ${serviceName}, ${description}, ${iconName},
        true, false, false,
        COALESCE((SELECT MAX(display_order) + 1 FROM service_status), 1),
        ${admin.userId}::uuid
      )
      ON CONFLICT (service_key) DO NOTHING
      RETURNING *
    `) as ServiceStatus[];

    if (!inserted.length) {
      return NextResponse.json({ success: false, error: "Service key already exists" }, { status: 409 });
    }

    await sql`
      INSERT INTO service_status_audit (
        service_status_id, service_key, action, old_values, new_values, changed_by
      ) VALUES (
        ${inserted[0].id}::uuid,
        ${serviceKey},
        'created',
        NULL,
        ${JSON.stringify({ service_name: serviceName, description, icon_name: iconName })}::jsonb,
        ${admin.userId}::uuid
      )
    `;

    return NextResponse.json({ success: true, service: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error("[Service Status API] PUT error:", error);
    return NextResponse.json({ success: false, error: "Failed to create service" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const serviceKey = String(body.service_key || "").trim();
    if (!serviceKey) {
      return NextResponse.json({ success: false, error: "service_key is required" }, { status: 400 });
    }

    const existing = (await sql`
      SELECT * FROM service_status WHERE service_key = ${serviceKey} LIMIT 1
    `) as ServiceStatus[];
    if (!existing.length) {
      return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });
    }

    await sql`DELETE FROM service_status WHERE service_key = ${serviceKey}`;

    return NextResponse.json({ success: true, deleted: serviceKey });
  } catch (error) {
    console.error("[Service Status API] DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete service" }, { status: 500 });
  }
}

/**
 * PATCH - Update a single service status (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      service_key, 
      is_coming_soon, 
      coming_soon_message, 
      expected_launch_date,
      is_enabled,
      is_maintenance,
      maintenance_message,
      maintenance_starts_at,
      maintenance_ends_at,
      maintenance_auto_resume,
    } = body;

    if (!service_key) {
      return NextResponse.json(
        { success: false, error: "service_key is required" },
        { status: 400 }
      );
    }

    // Fetch current values for audit
    const [currentService] = (await sql`
      SELECT * FROM service_status WHERE service_key = ${service_key}
    `) as ServiceStatus[];

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
    if (typeof is_maintenance === 'boolean') updates.is_maintenance = is_maintenance;
    if (typeof maintenance_message === 'string') updates.maintenance_message = maintenance_message;
    if (maintenance_starts_at !== undefined) updates.maintenance_starts_at = maintenance_starts_at || null;
    if (maintenance_ends_at !== undefined) updates.maintenance_ends_at = maintenance_ends_at || null;
    if (typeof maintenance_auto_resume === 'boolean') updates.maintenance_auto_resume = maintenance_auto_resume;

    // Perform update
    const [updatedService] = (await sql`
      UPDATE service_status
      SET 
        is_coming_soon = COALESCE(${updates.is_coming_soon ?? null}::boolean, is_coming_soon),
        coming_soon_message = COALESCE(${updates.coming_soon_message ?? null}::text, coming_soon_message),
        expected_launch_date = ${updates.expected_launch_date ?? currentService.expected_launch_date}::date,
        is_enabled = COALESCE(${updates.is_enabled ?? null}::boolean, is_enabled),
        is_maintenance = COALESCE(${updates.is_maintenance ?? null}::boolean, is_maintenance),
        maintenance_message = COALESCE(${updates.maintenance_message ?? null}::text, maintenance_message),
        maintenance_starts_at = ${updates.maintenance_starts_at ?? currentService.maintenance_starts_at ?? null}::timestamptz,
        maintenance_ends_at = ${updates.maintenance_ends_at ?? currentService.maintenance_ends_at ?? null}::timestamptz,
        maintenance_auto_resume = COALESCE(${updates.maintenance_auto_resume ?? null}::boolean, maintenance_auto_resume),
        updated_by = ${admin.userId}::uuid,
        updated_at = NOW()
      WHERE service_key = ${service_key}
      RETURNING *
    `) as ServiceStatus[];

    // Determine action type for audit
    let action = 'updated';
    if (typeof is_coming_soon === 'boolean') {
      action = is_coming_soon ? 'coming_soon_enabled' : 'coming_soon_disabled';
    }
    if (typeof is_enabled === 'boolean') {
      action = is_enabled ? 'service_enabled' : 'service_disabled';
    }
    if (typeof is_maintenance === 'boolean') {
      action = is_maintenance ? 'maintenance_enabled' : 'maintenance_disabled';
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
          is_enabled: currentService.is_enabled,
          is_maintenance: currentService.is_maintenance,
          maintenance_message: currentService.maintenance_message
        })}::jsonb,
        ${JSON.stringify({
          is_coming_soon: updatedService.is_coming_soon,
          coming_soon_message: updatedService.coming_soon_message,
          expected_launch_date: updatedService.expected_launch_date,
          is_enabled: updatedService.is_enabled,
          is_maintenance: updatedService.is_maintenance,
          maintenance_message: updatedService.maintenance_message,
          maintenance_starts_at: updatedService.maintenance_starts_at,
          maintenance_ends_at: updatedService.maintenance_ends_at,
          maintenance_auto_resume: updatedService.maintenance_auto_resume
        })}::jsonb,
        ${admin.userId}::uuid
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
    if (!admin.ok) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body as {
      updates: Array<{
        service_key: string;
        is_coming_soon?: boolean;
        is_enabled?: boolean;
        is_maintenance?: boolean;
      }>;
    };

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "updates array is required" },
        { status: 400 }
      );
    }

    const results = [];

    for (const update of updates) {
      const { service_key, is_coming_soon, is_enabled, is_maintenance } = update;
      
      if (
        !service_key ||
        (
          typeof is_coming_soon !== 'boolean' &&
          typeof is_enabled !== 'boolean' &&
          typeof is_maintenance !== 'boolean'
        )
      ) {
        continue;
      }

      const [currentService] = (await sql`
        SELECT * FROM service_status WHERE service_key = ${service_key}
      `) as ServiceStatus[];

      if (!currentService) continue;

      const [updatedService] = (await sql`
        UPDATE service_status
        SET 
          is_coming_soon = COALESCE(${typeof is_coming_soon === 'boolean' ? is_coming_soon : null}::boolean, is_coming_soon),
          is_enabled = COALESCE(${typeof is_enabled === 'boolean' ? is_enabled : null}::boolean, is_enabled),
          is_maintenance = COALESCE(${typeof is_maintenance === 'boolean' ? is_maintenance : null}::boolean, is_maintenance),
          updated_by = ${admin.userId}::uuid,
          updated_at = NOW()
        WHERE service_key = ${service_key}
        RETURNING *
      `) as ServiceStatus[];

      // Log audit
      await sql`
        INSERT INTO service_status_audit (
          service_status_id, service_key, action, old_values, new_values, changed_by
        ) VALUES (
          ${updatedService.id}::uuid,
          ${service_key},
          'bulk_updated',
          ${JSON.stringify({
            is_coming_soon: currentService.is_coming_soon,
            is_enabled: currentService.is_enabled,
            is_maintenance: currentService.is_maintenance,
          })}::jsonb,
          ${JSON.stringify({
            is_coming_soon: updatedService.is_coming_soon,
            is_enabled: updatedService.is_enabled,
            is_maintenance: updatedService.is_maintenance,
          })}::jsonb,
          ${admin.userId}::uuid
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
