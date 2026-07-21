export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { updateProfile, updatePassword } from "@/lib/actions/profile";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action, ...data } = body;

    if (action === "updatePassword") {
      const result = await updatePassword(data);
      return NextResponse.json(result);
    }

    const result = await updateProfile(data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update profile" },
      { status: 400 }
    );
  }
}
