import { NextRequest, NextResponse } from "next/server";
import { register } from "@/lib/actions/auth";
import { shouldUseSecureCookies } from "@/lib/utils";
import { withRateLimit } from "@/lib/rate-limit";
import { validateRequest, formatZodError, registerSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimitedPOST = withRateLimit({ type: "public" })(POST);

async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("Register request for:", body.email);
    
    // Validate input
    const validation = validateRequest(registerSchema, body);
    if (!validation.success) {
      console.log("Validation failed:", formatZodError(validation.errors!));
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          errors: formatZodError(validation.errors!),
        },
        { status: 400 }
      );
    }
    
    const registerData: any = {
      email: validation.data!.email,
      password: validation.data!.password,
      firstName: validation.data!.first_name,
      lastName: validation.data!.last_name,
      referralCode: body.referralCode,
    };
    
    if (validation.data!.phone) {
      registerData.phone = validation.data!.phone;
    }
    
    console.log("Calling register for:", registerData.email);
    
    const result = await register(registerData);

    console.log("Register result: success=", result.success);

    if (result.success && result.user) {
      const response = NextResponse.json(
        { success: true, user: result.user, token: result.token, expiresAt: result.expiresAt },
        { status: 201 }
      );
      if (result.token && result.expiresAt) {
        response.cookies.set("session_token", result.token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 24 * 60 * 60,
          path: "/",
        });
      }
      return response;
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Register API error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export { rateLimitedPOST as POST };
