import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOGIN = "/login";
const ADMIN_LOGIN = "/admin/login";

const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "off",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://embed.tawk.to https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://api.paystack.co https://embed.tawk.to wss://chat.tawk.to https://va.vercel-scripts.com; frame-src https://embed.tawk.to https://checkout.paystack.com;",
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("session_token")?.value;

  const isServerAction = request.headers.get("next-action");
  if (isServerAction) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (!sessionToken) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL(LOGIN, request.url))
      );
    }
    return applySecurityHeaders(NextResponse.next());
  }

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!sessionToken) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL(ADMIN_LOGIN, request.url))
      );
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
