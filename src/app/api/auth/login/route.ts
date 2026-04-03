import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/actions/auth";
import { shouldUseSecureCookies } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await login({
      email: body.email,
      password: body.password,
    });

    if (result.success && result.user && result.token && result.expiresAt) {
      const response = NextResponse.json({ success: true, user: result.user }, { status: 200 });

        // Set cookie on the response (this is what the browser receives)
        response.cookies.set("session_token", result.token, {
          httpOnly: true,
          secure: shouldUseSecureCookies(),
          sameSite: "lax",
          expires: new Date(result.expiresAt),
          path: "/",
        });
      
      return response;
    } else {
      // Return 200 with success: false so the client
      // can handle validation/auth errors without
      // triggering browser-level 400 errors.
      return NextResponse.json(
        { success: false, error: result.error || "Login failed" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
