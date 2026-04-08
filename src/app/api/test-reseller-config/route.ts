import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Get form configuration (no auth required for testing)
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 API DEBUG: Test GET endpoint called");

    // Get form config
    const configResult = await sql`
      SELECT config_value FROM system_config
      WHERE config_key = 'reseller_form_config'
    `;
    console.log("🔍 API DEBUG: Raw config from database:", configResult);

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
    
    console.log("🔍 API DEBUG: Final config being returned:", config);

    return NextResponse.json({
      success: true,
      config,
      customFields: fieldsResult
    });
  } catch (error) {
    console.error("🔍 API DEBUG: Reseller form config GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update form configuration (no auth required for testing)
export async function PUT(request: NextRequest) {
  try {
    console.log("🔍 API DEBUG: Test PUT endpoint called");

    const body = await request.json();
    const { config } = body;
    console.log("🔍 API DEBUG: Received config to save:", config);

    if (!config) {
      return NextResponse.json(
        { success: false, error: "Config is required" },
        { status: 400 }
      );
    }

    // Check current config before update
    const currentConfigResult = await sql`
      SELECT config_value FROM system_config
      WHERE config_key = 'reseller_form_config'
    `;
    console.log("🔍 API DEBUG: Current config in database:", currentConfigResult[0]?.config_value);

    // Update config
    await sql`
      INSERT INTO system_config (config_key, config_value, updated_by, updated_at)
      VALUES ('reseller_form_config', ${JSON.stringify(config)}::jsonb, 
              (SELECT id FROM users WHERE email = 'najeebiddrisu79@gmail.com' LIMIT 1), NOW())
      ON CONFLICT (config_key)
      DO UPDATE SET 
        config_value = ${JSON.stringify(config)}::jsonb,
        updated_by = (SELECT id FROM users WHERE email = 'najeebiddrisu79@gmail.com' LIMIT 1),
        updated_at = NOW()
    `;

    // Verify the update
    const verifyResult = await sql`
      SELECT config_value FROM system_config
      WHERE config_key = 'reseller_form_config'
    `;
    console.log("🔍 API DEBUG: Config after save:", verifyResult[0]?.config_value);

    return NextResponse.json({
      success: true,
      message: "Configuration updated successfully"
    });
  } catch (error) {
    console.error("🔍 API DEBUG: Reseller form config PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
