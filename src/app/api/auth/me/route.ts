import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/actions/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const hasToken = !!token;

    console.log("[api/auth/me] cookie check:", {
      hasToken,
      tokenPrefix: hasToken ? token.slice(0, 8) + "..." : null,
      userAgent: request.headers.get("user-agent")?.slice(0, 40),
    });

    const user = await getCurrentUser();

    if (user) {
      return NextResponse.json(
        { success: true, user },
        { status: 200 }
      );
    } else {
      console.log("[api/auth/me] getCurrentUser returned null");
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Get current user API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
