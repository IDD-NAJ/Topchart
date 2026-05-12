import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { ROLES } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  wallet_balance: number;
  is_verified: boolean;
  role: string;
  created_at: string;
}

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
    const { action, userId, role, email, firstName, lastName, phone } = body;

    // Log admin action for audit trail
    console.log("[AUDIT] Admin management action", {
      adminId: admin.userId,
      action,
      targetUserId: userId,
      timestamp: new Date().toISOString(),
      ip: request.headers.get("x-forwarded-for") || "unknown"
    });

    switch (action) {
      case "promoteToAdmin":
        if (!userId || !role) {
          return NextResponse.json(
            { success: false, error: "User ID and role are required" },
            { status: 400 }
          );
        }

        if (role !== "ADMIN") {
          return NextResponse.json(
            { success: false, error: "Invalid role. Only ADMIN role allowed." },
            { status: 400 }
          );
        }

        // Update user role to ADMIN
        const updated = await sql`
          UPDATE users
          SET role = ${ROLES.ADMIN},
              updated_at = NOW()
          WHERE id::text = ${userId}
          RETURNING id, email, role
        ` as any[];

        if (updated.length === 0) {
          return NextResponse.json(
            { success: false, error: "User not found or update failed" },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "User promoted to admin successfully",
          user: updated[0]
        });

      case "demoteToUser":
        if (!userId) {
          return NextResponse.json(
            { success: false, error: "User ID is required" },
            { status: 400 }
          );
        }

        // Update user role to USER
        const demoted = await sql`
          UPDATE users
          SET role = ${ROLES.USER},
              updated_at = NOW()
          WHERE id::text = ${userId}
          RETURNING id, email, role
        ` as any[];

        if (demoted.length === 0) {
          return NextResponse.json(
            { success: false, error: "User not found or update failed" },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "User demoted to user role successfully",
          user: demoted[0]
        });

      case "createAdmin":
        // Create new admin user with proper validation
        if (!email || !firstName || !lastName || !phone) {
          return NextResponse.json(
            { success: false, error: "All fields are required" },
            { status: 400 }
          );
        }

        // Check if user already exists
        const existingUser = await sql`
          SELECT id FROM users WHERE LOWER(email) = ${email.toLowerCase()}
        ` as any[];

        if (existingUser.length > 0) {
          return NextResponse.json(
            { success: false, error: "User with this email already exists" },
            { status: 409 }
          );
        }

        const newUser = await sql`
          INSERT INTO users (
            id,
            email,
            first_name,
            last_name,
            phone,
            wallet_balance,
            is_verified,
            role,
            created_at,
            updated_at
          ) VALUES (
            gen_random_uuid(),
            ${email.toLowerCase()},
            ${firstName},
            ${lastName},
            ${phone || '0000000000'},
            0,
            true,
            ${ROLES.ADMIN},
            NOW(),
            NOW()
          )
          RETURNING id, email, first_name, last_name, phone, role, created_at
        ` as any[];

        return NextResponse.json({
          success: true,
          message: "Admin user created successfully",
          user: newUser[0]
        });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Admin management API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let baseQuery = `
      SELECT id, email, first_name, last_name, phone, wallet_balance, 
             is_verified, role, created_at, updated_at
      FROM users
      WHERE 1=1
    `;

    const params = [];
    
    if (search) {
      baseQuery += ` AND (
        LOWER(email) LIKE $${params.length + 1} OR
        LOWER(first_name) LIKE $${params.length + 2} OR
        LOWER(last_name) LIKE $${params.length + 3}
      )`;
      params.push(`%${search.toLowerCase()}%`);
      params.push(`%${search.toLowerCase()}%`);
      params.push(`%${search.toLowerCase()}%`);
    }

    baseQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 4} OFFSET $${params.length + 5}`;
    params.push(limit.toString());
    params.push(offset.toString());

    const users = await sql(baseQuery as any, ...params) as any[];
    
    // Get total count for pagination
    let baseCountQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
    const countParams = [];
    
    if (search) {
      baseCountQuery += ` AND (
        LOWER(email) LIKE $${countParams.length + 1} OR
        LOWER(first_name) LIKE $${countParams.length + 2} OR
        LOWER(last_name) LIKE $${countParams.length + 3}
      )`;
      countParams.push(`%${search.toLowerCase()}%`);
      countParams.push(`%${search.toLowerCase()}%`);
      countParams.push(`%${search.toLowerCase()}%`);
    }

    const countResult = await sql(baseCountQuery as any, ...countParams);
    const total = parseInt(countResult[0]?.total || "0");

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Admin users list API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
