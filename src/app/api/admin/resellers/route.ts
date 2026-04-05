import { NextRequest, NextResponse } from "next/server";
import { sql, sqlUnsafe } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - List all resellers and applications
export async function GET(request: NextRequest) {
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
    
    // Get pending applications
    const applications = await sql`
      SELECT 
        ra.*,
        u.email as user_email,
        u.first_name,
        u.last_name
      FROM reseller_applications ra
      JOIN users u ON ra.user_id = u.id
      WHERE ra.application_status = 'pending'
      ORDER BY ra.created_at DESC
    `;
    
    // Get active resellers
    let resellerQuery = `
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
      WHERE 1=1
    `;
    
    if (status !== "all") {
      resellerQuery += ` AND rp.status = '${status}'`;
    }
    
    if (search) {
      resellerQuery += ` AND (
        LOWER(u.email) LIKE '%${search.toLowerCase()}%' OR
        LOWER(rp.business_name) LIKE '%${search.toLowerCase()}%'
      )`;
    }
    
    resellerQuery += ` ORDER BY rp.total_sales DESC`;
    
    const resellers = await sqlUnsafe(resellerQuery);
    
    return NextResponse.json({
      success: true,
      applications,
      resellers,
      stats: {
        pendingApplications: applications.length,
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

// PATCH - Update reseller rates
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { success: false, error: admin.error },
        { status: admin.status }
      );
    }
    
    const body = await request.json();
    const { reseller_id, commission_rate, discount_rate, status } = body;
    
    if (!reseller_id) {
      return NextResponse.json(
        { success: false, error: "Reseller ID is required" },
        { status: 400 }
      );
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (commission_rate !== undefined) {
      updates.push(`commission_rate = ${commission_rate}`);
    }
    
    if (discount_rate !== undefined) {
      updates.push(`discount_rate = ${discount_rate}`);
    }
    
    if (status !== undefined) {
      updates.push(`status = '${status}'`);
    }
    
    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No updates provided" },
        { status: 400 }
      );
    }
    
    const query = `
      UPDATE reseller_profiles
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = '${reseller_id}'
      RETURNING *
    `;
    
    const updated = await sqlUnsafe(query);
    
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
