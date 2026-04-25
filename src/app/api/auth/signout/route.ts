import { NextRequest, NextResponse } from "next/server";
import { Auth } from "@auth/core";
import { authConfig } from "@/lib/auth.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const url = new URL("/api/auth/signout", request.url);
    const authRequest = new Request(url, {
      method: "POST",
      headers: request.headers,
    });

    const response = await Auth(authRequest, authConfig);
    
    // Convert Response to NextResponse
    const nextResponse = NextResponse.json(
      { success: true },
      { status: response.status }
    );

    // Copy cookies (to clear the session cookie)
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        nextResponse.headers.append(key, value);
      }
    });

    return nextResponse;
  } catch (error) {
    console.error("Signout error:", error);
    // Even if there's an error, try to clear the cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("next-auth.session-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }
}
