import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOGIN = "/login";
const ADMIN_LOGIN = "/admin/login";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("session_token")?.value;

  // Protect dashboard: require authenticated session
  if (pathname.startsWith("/dashboard")) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL(LOGIN, request.url));
    }
    return NextResponse.next();
  }

  // Protect admin routes (except /admin/login): require session AND admin_role cookie
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN, request.url));
    }
    const adminRole = request.cookies.get("admin_role")?.value;
    if (adminRole !== "ADMIN") {
      return NextResponse.redirect(new URL(ADMIN_LOGIN, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};
