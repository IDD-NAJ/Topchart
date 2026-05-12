import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/actions/auth";
import { shouldUseSecureCookies } from "@/lib/utils";
import { withRateLimit } from "@/lib/rate-limit";
import { validateRequest, formatZodError, loginSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const rateLimitedPOST = withRateLimit({ type: "public" })(POST);

async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateRequest(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          errors: formatZodError(validation.errors!),
        },
        { status: 400 }
      );
    }
    
    const result = await login({
      email: validation.data!.email,
      password: validation.data!.password,
    });

    if (result.success && result.user && result.token && result.expiresAt) {
      const response = NextResponse.json({ success: true, user: result.user, token: result.token, expiresAt: result.expiresAt }, { status: 200 });

        // Set cookie on the response (this is what the browser receives)
        response.cookies.set("session_token", result.token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 24 * 60 * 60,
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

export { rateLimitedPOST as POST };
