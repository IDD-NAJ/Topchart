import { getCurrentUser, type User } from "@/lib/actions/auth";
import { NextResponse } from "next/server";

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export function unauthorizedResponse(message = "Authentication required") {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}
