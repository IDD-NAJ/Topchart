import { NextRequest, NextResponse } from "next/server";
import { register } from "@/lib/actions/auth";
import { withRateLimit } from "@/lib/rate-limit";
import { validateRequest, formatZodError, registerSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimitedPOST = withRateLimit({ type: "public" })(POST);

async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateRequest(registerSchema, body);
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
    
    const result = await register(registerData);

    if (result.success) {
      return NextResponse.json(
        { success: true, user: result.user },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export { rateLimitedPOST as POST };
