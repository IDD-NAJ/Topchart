import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOGIN = "/login";
const ADMIN_LOGIN = "/admin/login";

function getSecurityHeaders(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://topchart.store";
  const url = new URL(appUrl);
  const appDomain = url.hostname;
  const appProtocol = url.protocol; // http: or https:
  
  const connectSources = [
    "'self'",
    "https://*.supabase.co",
    "https://cibtsrkdatuymjpzcfol.supabase.co",
    `${appProtocol}//${appDomain}`,
    `${appProtocol}//api.${appDomain}`,
    "https://*.tawk.to",
    "https://va.tawk.to",
    "wss://*.tawk.to",
    "https://accounts.google.com",
    "https://oauth2.googleapis.com",
    "https://www.googleapis.com"
  ];

  // If we are on a subdomain (like netlify), allow it too
  const host = request.headers.get("host") || "";
  if (host && !host.includes(appDomain)) {
    connectSources.push(`https://${host}`);
    connectSources.push(`http://${host}`);
  }

  return {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-DNS-Prefetch-Control": "off",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": [
      "default-src 'self'",
      `connect-src ${connectSources.join(" ")}`,
      "img-src 'self' data: blob: https://*.supabase.co https://cibtsrkdatuymjpzcfol.supabase.co https://*.tawk.to",
      "media-src 'self' blob: https://*.supabase.co https://cibtsrkdatuymjpzcfol.supabase.co",
      "script-src 'self' 'unsafe-inline' https://*.tawk.to",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "frame-src 'self' https://*.tawk.to",
      "child-src 'self' blob: https://*.tawk.to",
      "worker-src 'self' blob:",
    ].join("; "),
  };
}

function applySecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const headers = getSecurityHeaders(request);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check session token
  const sessionToken = request.cookies.get("session_token")?.value;
  const hasSession = Boolean(sessionToken);

  const isServerAction = request.headers.get("next-action");
  if (isServerAction) {
    return NextResponse.next();
  }

  // Dashboard protection
  if (pathname.startsWith("/dashboard")) {
    if (!hasSession) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL(LOGIN, request.url)),
        request
      );
    }
  }

  // Admin protection
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!hasSession) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL(ADMIN_LOGIN, request.url)),
        request
      );
    }
    
    // We cannot easily check the role from DB in edge middleware without a DB call
    // But we can check if it's stored in a secure cookie or just rely on the API checks.
    // For now, ensure session exists and redirect if not.
    // The individual admin pages and APIs will perform strict role checks via requireAdmin()
  }

  return applySecurityHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};
