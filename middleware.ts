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
    `${appProtocol}//www.${appDomain}`,
    `${appProtocol}//api.${appDomain}`,
    "https://*.tawk.to",
    "https://va.tawk.to",
    "https://embed.tawk.to",
    "wss://*.tawk.to",
    "https://accounts.google.com",
    "https://oauth2.googleapis.com",
    "https://www.googleapis.com"
  ];

  // Only allow the canonical production domain
  // Do NOT allow preview deployment URLs

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
      "img-src 'self' data: blob: https://*.supabase.co https://cibtsrkdatuymjpzcfol.supabase.co https://*.tawk.to https://va.tawk.to",
      "media-src 'self' blob: https://*.supabase.co https://cibtsrkdatuymjpzcfol.supabase.co",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.tawk.to https://va.tawk.to https://embed.tawk.to",
      "style-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://*.tawk.to https://va.tawk.to",
      "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.tawk.to https://va.tawk.to",
      "font-src 'self' https://fonts.gstatic.com data:",
      "frame-src 'self' https://*.tawk.to https://va.tawk.to",
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
  const host = request.headers.get("host") || "";
  
  console.log('[Middleware] Request:', pathname, 'Host:', host);
  
  // Force HTTPS in production
  if (process.env.NODE_ENV === "production" && request.nextUrl.protocol === "http:") {
    const secureUrl = new URL(request.url);
    secureUrl.protocol = "https";
    return NextResponse.redirect(secureUrl.toString(), 301);
  }
  
  // Check session token
  const sessionToken = request.cookies.get("session_token")?.value;
  const hasSession = Boolean(sessionToken);

  // Check for auth loading state (temporary cookie set during auth flow)
  const authLoading = request.cookies.get("auth_loading")?.value;
  const isAuthLoading = Boolean(authLoading);

  console.log('[Middleware] Session token:', !!sessionToken, 'Auth loading:', isAuthLoading);

  const isServerAction = request.headers.get("next-action");
  if (isServerAction) {
    return NextResponse.next();
  }

  // Dashboard protection
  if (pathname.startsWith("/dashboard")) {
    // Allow access if auth is loading (to prevent redirect loops during auth flow)
    if (!hasSession && !isAuthLoading) {
      console.log('[Middleware] No session and not loading, redirecting to login');
      return applySecurityHeaders(
        NextResponse.redirect(new URL(LOGIN, request.url)),
        request
      );
    }
    console.log('[Middleware] Has session or auth loading, allowing access');
  }

  // Admin protection
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!hasSession && !isAuthLoading) {
      console.log('[Middleware] Admin: No session and not loading, redirecting to admin login');
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
    "/((?!api|_next/static|_next/image|favicon.ico|logo.svg|icon.png).*)",
  ],
};
