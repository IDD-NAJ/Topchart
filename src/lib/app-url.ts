/**
 * Centralized URL utility for production domain enforcement
 * 
 * This utility ensures all URLs use the canonical production domain (topchart.store)
 * regardless of the current deployment environment or preview URLs.
 */

/**
 * Get the canonical production app URL
 * Always returns https://topchart.store in production
 * Falls back to localhost:3000 in development
 */
export function getAppUrl(): string {
  // In production, always return the canonical domain
  if (process.env.NODE_ENV === 'production') {
    return 'https://topchart.store';
  }
  
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  
  return 'http://localhost:3000';
}

/**
 * Get the canonical origin for URL construction
 * This should be used instead of window.location.origin
 */
export function getAppOrigin(): string {
  return getAppUrl();
}

/**
 * Get the canonical domain (hostname only)
 */
export function getAppDomain(): string {
  const url = new URL(getAppUrl());
  return url.hostname;
}

/**
 * Get the canonical protocol (http or https)
 */
export function getAppProtocol(): string {
  const url = new URL(getAppUrl());
  return url.protocol.replace(':', '');
}

/**
 * Construct an absolute URL using the canonical domain
 * This should be used instead of new URL(path, window.location.origin)
 */
export function getAbsoluteUrl(path: string): string {
  const baseUrl = getAppUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Check if we're in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if we're in development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if the current host matches the canonical domain
 * This is useful for detecting if we're on a preview deployment
 */
export function isCanonicalHost(host?: string): boolean {
  if (!host) return false;
  const canonicalDomain = getAppDomain();
  return host === canonicalDomain || host === `www.${canonicalDomain}`;
}

/**
 * Get the canonical callback URL for OAuth
 * Always uses the production domain
 */
export function getOAuthCallbackUrl(): string {
  return `${getAppUrl()}/api/auth/callback/google`;
}

/**
 * Get the canonical redirect URI for Google OAuth
 */
export function getGoogleRedirectUri(): string {
  return `${getAppUrl()}/api/auth/google/callback`;
}
