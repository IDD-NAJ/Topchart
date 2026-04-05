import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sql, sqlUnsafe } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { withCSRFProtection } from "@/lib/csrf-middleware";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Check application status or list applications (admin)
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const isAdmin = admin.ok;
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    
    // Admin can see all applications
    if (isAdmin) {
      let query = `
        SELECT 
          ra.*,
          u.email as user_email,
          u.first_name,
          u.last_name,
          reviewer.email as reviewer_email
        FROM reseller_applications ra
        JOIN users u ON ra.user_id = u.id
        LEFT JOIN users reviewer ON ra.reviewed_by = reviewer.id
        WHERE 1=1
      `;
      
      if (status !== "all") {
        query += ` AND ra.application_status = '${status}'`;
      }
      
      query += ` ORDER BY ra.created_at DESC`;
      
      const applications = await sqlUnsafe(query);
      
      return NextResponse.json({ success: true, applications });
    }
    
    // Regular users can only see their own application
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const sessions = await sql`
      SELECT u.id FROM auth_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
      LIMIT 1
    `;
    
    if (!sessions.length) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = (sessions[0] as { id: string }).id;
    
    const application = await sql`
      SELECT * FROM reseller_applications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    return NextResponse.json({ 
      success: true, 
      application: application[0] || null 
    });
    
  } catch (error) {
    console.error("Reseller applications GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Submit new application
export const POST = withCSRFProtection(async (request: NextRequest) => {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const sessions = await sql`
      SELECT u.id, u.email FROM auth_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
      LIMIT 1
    `;
    
    if (!sessions.length) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const user = sessions[0] as { id: string; email: string };
    
    const body = await request.json();
    const {
      business_name,
      business_address,
      business_phone,
      business_email,
      business_type,
      ...customFields
    } = body;
    
    // Validate required fields
    if (!business_name) {
      return NextResponse.json(
        { success: false, error: "Business name is required" },
        { status: 400 }
      );
    }
    
    // Check if user already has a pending or approved application
    const existingApp = await sql`
      SELECT * FROM reseller_applications
      WHERE user_id = ${user.id}
      AND application_status IN ('pending', 'approved')
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    if (existingApp.length > 0) {
      const app = existingApp[0] as any;
      if (app.application_status === "pending") {
        return NextResponse.json(
          { success: false, error: "You already have a pending application" },
          { status: 409 }
        );
      }
      if (app.application_status === "approved") {
        return NextResponse.json(
          { success: false, error: "You are already a reseller" },
          { status: 409 }
        );
      }
    }
    
    // Get application fee from config
    const configResult = await sql`
      SELECT config_value->>'application_fee' as fee, config_value->>'currency' as currency
      FROM system_config WHERE config_key = 'reseller_form_config'
    `;
    const applicationFee = configResult[0]?.fee ? parseFloat(configResult[0].fee) : 100.00;
    
    // Create new application with custom fields
    const application = await sql`
      INSERT INTO reseller_applications (
        user_id,
        business_name,
        business_address,
        business_phone,
        business_email,
        business_type,
        custom_fields,
        application_status,
        application_fee,
        payment_status
      ) VALUES (
        ${user.id},
        ${business_name},
        ${business_address || null},
        ${business_phone || null},
        ${business_email || null},
        ${business_type || null},
        ${JSON.stringify(customFields)}::jsonb,
        'pending',
        ${applicationFee},
        'pending'
      )
      RETURNING *
    `;
    
    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      application: application[0]
    });
    
  } catch (error) {
    console.error("Reseller application POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});

// PATCH - Update application status (admin only)
export const PATCH = withCSRFProtection(async (request: NextRequest) => {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { application_id, status, rejection_reason, confirm_payment } = body;
    
    if (!application_id) {
      return NextResponse.json(
        { success: false, error: "Application ID is required" },
        { status: 400 }
      );
    }
    
    // Handle payment confirmation
    if (confirm_payment) {
      const updated = await sql`
        UPDATE reseller_applications
        SET 
          payment_status = 'paid',
          updated_at = NOW()
        WHERE id = ${application_id}
        RETURNING *
      `;
      
      return NextResponse.json({
        success: true,
        message: "Payment confirmed",
        application: updated[0]
      });
    }
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status. Must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }
    
    // Get application details
    const application = await sql`
      SELECT * FROM reseller_applications
      WHERE id = ${application_id}
    `;
    
    if (application.length === 0) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }
    
    const app = application[0] as any;
    
    // Check if payment is required before approval
    const configResult = await sql`
      SELECT config_value->>'require_payment_before_approval' as require_payment
      FROM system_config WHERE config_key = 'reseller_form_config'
    `;
    const requirePayment = configResult[0]?.require_payment === 'true';
    
    if (status === 'approved' && requirePayment && app.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, error: "Cannot approve: Payment not confirmed for this application" },
        { status: 400 }
      );
    }
    
    // Update application status
    const updated = await sql`
      UPDATE reseller_applications
      SET 
        application_status = ${status},
        reviewed_by = ${admin.userId},
        reviewed_at = NOW(),
        rejection_reason = ${rejection_reason || null},
        updated_at = NOW()
      WHERE id = ${application_id}
      RETURNING *
    `;
    
    // If approved, create reseller profile
    if (status === 'approved') {
      const existingProfile = await sql`
        SELECT * FROM reseller_profiles
        WHERE user_id = ${app.user_id}
      `;
      
      if (existingProfile.length === 0) {
        // Generate reseller code
        const resellerCode = `RSL${Date.now().toString(36).toUpperCase()}`;
        
        await sql`
          INSERT INTO reseller_profiles (
            user_id,
            business_name,
            business_address,
            business_phone,
            reseller_code,
            commission_rate,
            discount_rate,
            wallet_balance,
            status
          ) VALUES (
            ${app.user_id},
            ${app.business_name},
            ${app.business_address || null},
            ${app.business_phone || null},
            ${resellerCode},
            5.00,
            10.00,
            0.00,
            'active'
          )
        `;
        
        // Update user role to RESELLER
        await sql`
          UPDATE users
          SET role = 'RESELLER'
          WHERE id = ${app.user_id}
        `;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Application ${status}`,
      application: updated[0]
    });
    
  } catch (error) {
    console.error("Reseller application PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
});
