import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    return NextResponse.json({
      user: user ? {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        walletBalance: Number(user.wallet_balance),
        isVerified: user.is_verified,
        role: user.role,
        createdAt: user.created_at,
      } : null
    });
  } catch (error: any) {
    console.error("[Auth Session API] Error:", error);
    return NextResponse.json({
      user: null
    });
  }
}
