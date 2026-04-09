import { NextRequest, NextResponse } from "next/server";
import { sql, sqlUnsafe } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { sendResellerApprovalEmail, sendResellerRejectionEmail } from "@/lib/email";
import { finalizeResellerApplicationPayment } from "@/lib/reseller-payment";
import { withRateLimit } from "@/lib/rate-limit";
import { validateRequest, formatZodError, resellerApplicationUpdateSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - List all resellers and applications
async function GETHandler(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    
    // Get all applications (not just pending)
    let applications: any[] = [];
    try {
      applications = await sql`
        SELECT 
          ra.*,
          u.email as user_email,
          u.first_name,
          u.last_name
        FROM reseller_applications ra
        JOIN users u ON ra.user_id = u.id
        ORDER BY ra.created_at DESC
      `;
    } catch { applications = []; }
    
    // Get active resellers with parameterized queries
    let resellers: any[] = [];
    try {
      if (status !== "all" && search) {
        resellers = await sql`
          SELECT 
            rp.*,
            u.email as user_email,
            u.first_name,
            u.last_name,
            rt.display_name as tier_name
          FROM reseller_profiles rp
          JOIN users u ON rp.user_id = u.id
          LEFT JOIN reseller_tiers rt ON rt.name = (
            SELECT CASE 
              WHEN rp.total_sales >= 100000 THEN 'PLATINUM'
              WHEN rp.total_sales >= 20000 THEN 'GOLD'
              WHEN rp.total_sales >= 5000 THEN 'SILVER'
              ELSE 'BRONZE'
            END
          )
          WHERE rp.status = ${status}
          AND (
            LOWER(u.email) LIKE ${'%' + search.toLowerCase() + '%'} OR
            LOWER(rp.business_name) LIKE ${'%' + search.toLowerCase() + '%'}
          )
          ORDER BY rp.total_sales DESC
        `;
      } else if (status !== "all") {
        resellers = await sql`
          SELECT 
            rp.*,
            u.email as user_email,
            u.first_name,
            u.last_name,
            rt.display_name as tier_name
          FROM reseller_profiles rp
          JOIN users u ON rp.user_id = u.id
          LEFT JOIN reseller_tiers rt ON rt.name = (
            SELECT CASE 
              WHEN rp.total_sales >= 100000 THEN 'PLATINUM'
              WHEN rp.total_sales >= 20000 THEN 'GOLD'
              WHEN rp.total_sales >= 5000 THEN 'SILVER'
              ELSE 'BRONZE'
            END
          )
          WHERE rp.status = ${status}
          ORDER BY rp.total_sales DESC
        `;
      } else if (search) {
        resellers = await sql`
          SELECT 
            rp.*,
            u.email as user_email,
            u.first_name,
            u.last_name,
            rt.display_name as tier_name
          FROM reseller_profiles rp
          JOIN users u ON rp.user_id = u.id
          LEFT JOIN reseller_tiers rt ON rt.name = (
            SELECT CASE 
              WHEN rp.total_sales >= 100000 THEN 'PLATINUM'
              WHEN rp.total_sales >= 20000 THEN 'GOLD'
              WHEN rp.total_sales >= 5000 THEN 'SILVER'
              ELSE 'BRONZE'
            END
          )
          WHERE (
            LOWER(u.email) LIKE ${'%' + search.toLowerCase() + '%'} OR
            LOWER(rp.business_name) LIKE ${'%' + search.toLowerCase() + '%'}
          )
          ORDER BY rp.total_sales DESC
        `;
      } else {
        resellers = await sql`
          SELECT 
            rp.*,
            u.email as user_email,
            u.first_name,
            u.last_name,
            rt.display_name as tier_name
          FROM reseller_profiles rp
          JOIN users u ON rp.user_id = u.id
          LEFT JOIN reseller_tiers rt ON rt.name = (
            SELECT CASE 
              WHEN rp.total_sales >= 100000 THEN 'PLATINUM'
              WHEN rp.total_sales >= 20000 THEN 'GOLD'
              WHEN rp.total_sales >= 5000 THEN 'SILVER'
              ELSE 'BRONZE'
            END
          )
          ORDER BY rp.total_sales DESC
        `;
      }
    } catch { resellers = []; }
    
    return NextResponse.json({
      success: true,
      applications,
      resellers,
      stats: {
        pendingApplications: applications.filter((a: any) => a.application_status === 'pending').length,
        totalResellers: resellers.length,
        activeResellers: resellers.filter((r: any) => r.status === 'active').length
      }
    });
    
  } catch (error) {
    console.error("Admin resellers GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update reseller rates or handle application actions
async function PATCHHandler(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validation = validateRequest(resellerApplicationUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          errors: formatZodError(validation.errors!),
        },
        { status: 400 }
      );
    }
    
    const { application_id, status, rejection_reason } = validation.data!;
    const { reseller_id, action, commission_rate, discount_rate } = body;
    
    // Handle application actions
    if (application_id && action) {
      // Get application details
      const applications = await sql`
        SELECT * FROM reseller_applications WHERE id = ${application_id}
      `;
      
      if (applications.length === 0) {
        return NextResponse.json(
          { success: false, error: "Application not found" },
          { status: 404 }
        );
      }
      
      const application = applications[0];
      
      if (action === "approve") {
        // Check if payment is confirmed
        if (application.payment_status !== "paid") {
          return NextResponse.json(
            { success: false, error: "Payment must be confirmed before approval" },
            { status: 400 }
          );
        }
        
        const txRows = await sql`
          SELECT id
          FROM transactions
          WHERE metadata->>'application_id' = ${application_id}
            AND (type = 'reseller_application' OR metadata->>'payment_type' = 'reseller_application')
          ORDER BY created_at DESC
          LIMIT 1
        `;
        const transactionId = (txRows[0] as { id?: string } | undefined)?.id;
        if (!transactionId) {
          return NextResponse.json(
            { success: false, error: "No payment transaction found for this application" },
            { status: 400 }
          );
        }
        const finalized = await finalizeResellerApplicationPayment({
          transactionId,
          actor: "admin",
          reason: "admin_manual_approve_paid_application",
        });
        if (!finalized.ok) {
          return NextResponse.json(
            { success: false, error: finalized.message },
            { status: 400 }
          );
        }
        
        // Get applicant email for notification
        const userRows = await sql`SELECT email FROM users WHERE id = ${application.user_id}`;
        const userEmail = (userRows[0] as { email: string })?.email;
        if (userEmail && finalized.resellerCode) {
          sendResellerApprovalEmail(userEmail, application.business_name, finalized.resellerCode).catch(() => {});
        }
        
        return NextResponse.json({
          success: true,
          message: finalized.message
        });
      }
      
      if (action === "reject") {
        if (!rejection_reason?.trim()) {
          return NextResponse.json(
            { success: false, error: "Rejection reason is required" },
            { status: 400 }
          );
        }
        
        await sql`
          UPDATE reseller_applications
          SET application_status = 'rejected', 
              rejection_reason = ${rejection_reason.trim()}, 
              updated_at = NOW()
          WHERE id = ${application_id}
        `;
        
        // Get applicant email for notification
        const userRows = await sql`SELECT email FROM users WHERE id = ${application.user_id}`;
        const userEmail = (userRows[0] as { email: string })?.email;
        if (userEmail) {
          sendResellerRejectionEmail(userEmail, application.business_name, rejection_reason.trim()).catch(() => {});
        }
        
        return NextResponse.json({
          success: true,
          message: "Application rejected successfully"
        });
      }
      
      if (action === "confirm_payment") {
        const txRows = await sql`
          SELECT id
          FROM transactions
          WHERE metadata->>'application_id' = ${application_id}
            AND (type = 'reseller_application' OR metadata->>'payment_type' = 'reseller_application')
          ORDER BY created_at DESC
          LIMIT 1
        `;
        const transactionId = (txRows[0] as { id?: string } | undefined)?.id;
        if (!transactionId) {
          return NextResponse.json(
            { success: false, error: "No payment transaction found for this application" },
            { status: 400 }
          );
        }
        const finalized = await finalizeResellerApplicationPayment({
          transactionId,
          applicationId: application_id,
          actor: "admin",
          reason: "admin_application_payment_confirmation",
        });
        if (!finalized.ok) {
          return NextResponse.json(
            { success: false, error: finalized.message },
            { status: 400 }
          );
        }
        return NextResponse.json({
          success: true,
          message: finalized.message
        });
      }
      
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }
    
    // Handle reseller profile updates
    if (!reseller_id) {
      return NextResponse.json(
        { success: false, error: "Reseller ID or Application ID with action is required" },
        { status: 400 }
      );
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (commission_rate !== undefined) {
      updates.push(`commission_rate = $${paramIndex}`);
      values.push(commission_rate);
      paramIndex++;
    }
    
    if (discount_rate !== undefined) {
      updates.push(`discount_rate = $${paramIndex}`);
      values.push(discount_rate);
      paramIndex++;
    }
    
    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No updates provided" },
        { status: 400 }
      );
    }
    
    values.push(reseller_id);
    
    const query = `
      UPDATE reseller_profiles
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const updated = await sqlUnsafe(query, values);
    
    return NextResponse.json({
      success: true,
      reseller: updated[0]
    });
    
  } catch (error) {
    console.error("Admin reseller PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Suspend reseller
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const resellerId = searchParams.get("id");
    
    if (!resellerId) {
      return NextResponse.json(
        { success: false, error: "Reseller ID is required" },
        { status: 400 }
      );
    }
    
    await sql`
      UPDATE reseller_profiles
      SET status = 'suspended', updated_at = NOW()
      WHERE id = ${resellerId}
    `;
    
    return NextResponse.json({
      success: true,
      message: "Reseller suspended successfully"
    });
    
  } catch (error) {
    console.error("Admin reseller DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Export GET, PATCH, and DELETE with rate limiting
export const GET = withRateLimit({ type: "admin" })(GETHandler);
export const PATCH = withRateLimit({ type: "admin" })(PATCHHandler);
