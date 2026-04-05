import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Get form configuration
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }

    // Get form config
    const configResult = await sql`
      SELECT config_value FROM system_config
      WHERE config_key = 'reseller_form_config'
    `;

    // Get custom fields
    const fieldsResult = await sql`
      SELECT * FROM custom_form_fields
      WHERE is_enabled = true
      ORDER BY sort_order ASC
    `;

    const config = configResult[0]?.config_value || {
      business_name: { enabled: true, required: true },
      business_address: { enabled: true, required: false },
      business_phone: { enabled: true, required: false },
      business_email: { enabled: true, required: false },
      business_type: { enabled: true, required: false },
      application_fee: 100.00,
      currency: "GHS",
      require_payment_before_approval: true
    };

    return NextResponse.json({
      success: true,
      config,
      customFields: fieldsResult
    });
  } catch (error) {
    console.error("Reseller form config GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update form configuration
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }

    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        { success: false, error: "Config is required" },
        { status: 400 }
      );
    }

    // Update config
    await sql`
      INSERT INTO system_config (config_key, config_value, updated_by, updated_at)
      VALUES ('reseller_form_config', ${JSON.stringify(config)}::jsonb, ${admin.userId}, NOW())
      ON CONFLICT (config_key)
      DO UPDATE SET 
        config_value = ${JSON.stringify(config)}::jsonb,
        updated_by = ${admin.userId},
        updated_at = NOW()
    `;

    return NextResponse.json({
      success: true,
      message: "Configuration updated successfully"
    });
  } catch (error) {
    console.error("Reseller form config PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add custom field
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }

    const body = await request.json();
    const { field } = body;

    if (!field || !field.field_name || !field.field_label || !field.field_type) {
      return NextResponse.json(
        { success: false, error: "Field name, label, and type are required" },
        { status: 400 }
      );
    }

    const newField = await sql`
      INSERT INTO custom_form_fields (
        field_name, field_label, field_type, field_options,
        is_required, is_enabled, placeholder, help_text, sort_order
      ) VALUES (
        ${field.field_name},
        ${field.field_label},
        ${field.field_type},
        ${JSON.stringify(field.field_options || [])}::jsonb,
        ${field.is_required || false},
        ${field.is_enabled !== false},
        ${field.placeholder || null},
        ${field.help_text || null},
        ${field.sort_order || 0}
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      field: newField[0]
    });
  } catch (error) {
    console.error("Reseller form config POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
