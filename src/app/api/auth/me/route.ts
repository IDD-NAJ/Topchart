import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    return NextResponse.json({
      success: true,
      user: user ? {
        id: user.id,
        email: user.email,
        phone: user.phone,
        first_name: user.first_name,
        last_name: user.last_name,
        wallet_balance: user.wallet_balance,
        is_verified: user.is_verified,
        role: user.role,
        referral_code: user.referral_code,
        created_at: user.created_at,
      } : null
    });
  } catch (error: any) {
    console.error("[Auth Me API] Error:", error);
    return NextResponse.json({
      success: true,
      user: null
    });
  }
}
