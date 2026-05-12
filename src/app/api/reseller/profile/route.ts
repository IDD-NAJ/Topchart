import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) return null;

  const sessions = await sql`
    SELECT u.id, u.email, u.role FROM auth_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
    LIMIT 1
  `;

  if (!Array.isArray(sessions) || sessions.length === 0) return null;

  return sessions[0];
}

// GET - Fetch reseller profile
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get reseller profile with tier info
    const rows = await sql`
      SELECT
        r.id,
        r.business_name,
        r.business_address,
        r.business_phone,
        r.reseller_code,
        r.commission_rate::numeric,
        r.discount_rate::numeric,
        r.wallet_balance::numeric,
        r.total_sales::numeric,
        r.total_commission_earned::numeric,
        r.total_referrals::int,
        r.status,
        r.bank_account_name,
        r.bank_account_number,
        r.bank_name,
        r.created_at,
        r.logo_url,
        r.phone_verified,
        r.email_verified,
        r.kyc_status,
        r.security_score,
        r.last_login_at,
        COALESCE(rt.name, 'BRONZE') as tier_name,
        rt.benefits as tier_benefits,
        u.email as business_email
      FROM reseller_profiles r
      LEFT JOIN reseller_tiers rt ON rt.name = (
        SELECT CASE
          WHEN COALESCE(r.total_sales, 0) >= 100000 THEN 'PLATINUM'
          WHEN COALESCE(r.total_sales, 0) >= 20000 THEN 'GOLD'
          WHEN COALESCE(r.total_sales, 0) >= 5000 THEN 'SILVER'
          ELSE 'BRONZE'
        END
      )
      LEFT JOIN users u ON u.id = r.user_id
      WHERE r.user_id = ${user.id}
      LIMIT 1
    `;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Reseller profile not found" },
        { status: 404 }
      );
    }

    const profile = rows[0];

    // Get next tier info
    const nextTierRows = await sql`
      SELECT name, sales_threshold
      FROM reseller_tiers
      WHERE sales_threshold > ${profile.total_sales}
      ORDER BY sales_threshold ASC
      LIMIT 1
    `;

    const nextTier = Array.isArray(nextTierRows) && nextTierRows.length > 0
      ? nextTierRows[0]
      : null;

    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        next_tier_name: nextTier?.name,
        next_tier_threshold: nextTier?.sales_threshold,
      }
    });
  } catch (error: any) {
    console.error("Reseller profile GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update reseller profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      business_name,
      business_address,
      business_phone,
      business_email,
      bank_name,
      bank_account_name,
      bank_account_number,
      logo_url
    } = body;

    // Verify user owns the reseller profile
    const existingRows = await sql`
      SELECT id FROM reseller_profiles WHERE user_id = ${user.id} LIMIT 1
    `;

    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Reseller profile not found" },
        { status: 404 }
      );
    }

    const resellerId = existingRows[0].id;

    // Update reseller profile
    await sql`
      UPDATE reseller_profiles
      SET
        business_name = COALESCE(${business_name}, business_name),
        business_address = COALESCE(${business_address}, business_address),
        business_phone = COALESCE(${business_phone}, business_phone),
        bank_name = COALESCE(${bank_name}, bank_name),
        bank_account_name = COALESCE(${bank_account_name}, bank_account_name),
        bank_account_number = COALESCE(${bank_account_number}, bank_account_number),
        logo_url = COALESCE(${logo_url}, logo_url),
        updated_at = NOW()
      WHERE id = ${resellerId}
    `;

    // Update business email on users table if provided
    if (business_email) {
      await sql`
        UPDATE users
        SET email = ${business_email},
            updated_at = NOW()
        WHERE id = ${user.id}
      `;
    }

    // Fetch updated profile
    const updatedRows = await sql`
      SELECT
        r.id,
        r.business_name,
        r.business_address,
        r.business_phone,
        r.reseller_code,
        r.commission_rate::numeric,
        r.discount_rate::numeric,
        r.wallet_balance::numeric,
        r.total_sales::numeric,
        r.total_commission_earned::numeric,
        r.total_referrals::int,
        r.status,
        r.bank_account_name,
        r.bank_account_number,
        r.bank_name,
        r.created_at,
        r.logo_url,
        r.phone_verified,
        r.email_verified,
        r.kyc_status,
        r.security_score,
        r.last_login_at,
        COALESCE(rt.name, 'BRONZE') as tier_name,
        u.email as business_email
      FROM reseller_profiles r
      LEFT JOIN reseller_tiers rt ON rt.name = (
        SELECT CASE
          WHEN COALESCE(r.total_sales, 0) >= 100000 THEN 'PLATINUM'
          WHEN COALESCE(r.total_sales, 0) >= 20000 THEN 'GOLD'
          WHEN COALESCE(r.total_sales, 0) >= 5000 THEN 'SILVER'
          ELSE 'BRONZE'
        END
      )
      LEFT JOIN users u ON u.id = r.user_id
      WHERE r.id = ${resellerId}
      LIMIT 1
    `;

    return NextResponse.json({
      success: true,
      profile: updatedRows[0],
      message: "Profile updated successfully"
    });
  } catch (error: any) {
    console.error("Reseller profile PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
