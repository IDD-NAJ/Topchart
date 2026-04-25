import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (user) {
      return NextResponse.json(
        { success: true, user },
        { status: 200 }
      );
    } else {
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
