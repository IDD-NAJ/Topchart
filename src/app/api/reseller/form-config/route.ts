import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Get form configuration (public endpoint for form rendering)
export async function GET(request: NextRequest) {
  try {
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
