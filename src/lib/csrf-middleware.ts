import { NextRequest, NextResponse } from "next/server";

export function withCSRFProtection(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
      const csrfHeader = req.headers.get("X-CSRF-Token");
      const csrfCookie = req.cookies.get("csrf-token")?.value;

      if (!csrfHeader || !csrfCookie) {
        return NextResponse.json(
          { success: false, error: "CSRF token missing" },
          { status: 419 }
        );
      }

      if (csrfHeader !== csrfCookie) {
        return NextResponse.json(
          { success: false, error: "Invalid CSRF token" },
          { status: 419 }
        );
      }
    }

    return handler(req);
  };
}
