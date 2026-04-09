import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/actions/auth";
import { shouldUseSecureCookies } from "@/lib/utils";
import { isAdmin, ROLES } from "@/lib/roles";
import { sql } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";
import { validateRequest, formatZodError, adminLoginSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function POSTHandler(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateRequest(adminLoginSchema, body);
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

    if (!result.success || !result.user || !result.token || !result.expiresAt) {
      return NextResponse.json(
        { success: false, error: result.error || "Login failed" },
        { status: 200 }
      );
    }

    // Security: No auto-promotion - admin role must be explicitly assigned
    // This prevents privilege escalation vulnerabilities
    let currentRole = (result.user as any).role;
    
    // Log admin login attempt for audit trail
    console.log("[AUDIT] Admin login attempt", {
      userId: result.user?.id,
      email: body.email,
      timestamp: new Date().toISOString(),
      success: true
    });

    if (!isAdmin(currentRole)) {
      console.warn("[SECURITY] Unauthorized admin access attempt", {
        userId: result.user?.id,
        email: body.email,
        role: currentRole,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { success: false, error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    const response = NextResponse.json({ success: true, user: result.user }, { status: 200 });

    const cookieOpts = {
      httpOnly: true,
      secure: shouldUseSecureCookies(),
      sameSite: "lax" as const,
      expires: new Date(result.expiresAt),
      path: "/",
    };

    response.cookies.set("session_token", result.token, cookieOpts);
    response.cookies.set("admin_role", "ADMIN", cookieOpts);

    return response;
  } catch (error) {
    console.error("Admin login API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// Export POST with rate limiting
export const POST = withRateLimit({ type: "admin" })(POSTHandler);

