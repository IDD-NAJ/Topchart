import crypto from "crypto";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const OAUTH_TIMEOUT_MS = 15000;
const TOKEN_ENCRYPTION_KEY = process.env.AUTH_SECRET || process.env.SESSION_SECRET || "";

interface OAuthState {
  nonce: string;
  pkceVerifier: string;
  callbackUrl: string;
  timestamp: number;
}

interface GoogleTokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

interface GoogleIdTokenPayload {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
  nonce?: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export interface VerifiedGoogleUser {
  sub: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  picture?: string;
}

function encryptToken(token: string): string {
  if (!TOKEN_ENCRYPTION_KEY) return token;
  try {
    const key = crypto.createHash("sha256").update(TOKEN_ENCRYPTION_KEY).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch {
    return token;
  }
}

export function decryptToken(encrypted: string): string {
  if (!TOKEN_ENCRYPTION_KEY) return encrypted;
  try {
    const parts = encrypted.split(":");
    if (parts.length !== 3) return encrypted;
    const key = crypto.createHash("sha256").update(TOKEN_ENCRYPTION_KEY).digest();
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encryptedData = parts[2];
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return encrypted;
  }
}

export function generateOAuthState(callbackUrl: string): { state: string; verifier: string; challenge: string } {
  const nonce = crypto.randomBytes(24).toString("hex");
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");

  const payload: OAuthState = {
    nonce,
    pkceVerifier: verifier,
    callbackUrl,
    timestamp: Date.now(),
  };

  const state = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { state, verifier, challenge };
}

export function parseOAuthState(state: string): OAuthState | null {
  try {
    const payload: OAuthState = JSON.parse(Buffer.from(state, "base64url").toString());
    if (!payload.nonce || !payload.pkceVerifier || !payload.timestamp) return null;
    if (Date.now() - payload.timestamp > 10 * 60 * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OAUTH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  verifier: string
): Promise<{ tokens: GoogleTokenResponse; error?: string }> {
  const env = getGoogleEnv();
  if (!env) return { tokens: {} as GoogleTokenResponse, error: "Google Auth not configured" };

  try {
    const response = await fetchWithTimeout(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.clientId,
        client_secret: env.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[GoogleOAuth] Token exchange failed:", response.status, errorText);
      return { tokens: {} as GoogleTokenResponse, error: "Token exchange failed" };
    }

    const tokens: GoogleTokenResponse = await response.json();
    return { tokens };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { tokens: {} as GoogleTokenResponse, error: "Token exchange timed out" };
    }
    console.error("[GoogleOAuth] Token exchange error:", error);
    return { tokens: {} as GoogleTokenResponse, error: "Token exchange error" };
  }
}

async function getGoogleCerts(): Promise<Record<string, string>> {
  try {
    const response = await fetchWithTimeout(GOOGLE_CERTS_URL, { method: "GET" });
    if (!response.ok) return {};
    const data = await response.json();
    const certs: Record<string, string> = {};
    for (const key of data.keys || []) {
      if (key.kid && key.n && key.e) {
        const modulus = Buffer.from(key.n, "base64url");
        const exponent = Buffer.from(key.e, "base64url");
        const cert = crypto.createPublicKey({
          key: { kty: "RSA", n: modulus.toString("base64url"), e: exponent.toString("base64url") },
          format: "jwk",
        });
        certs[key.kid] = cert.export({ type: "spki", format: "pem" }).toString();
      }
    }
    return certs;
  } catch {
    return {};
  }
}

export async function verifyIdToken(
  idToken: string,
  expectedNonce: string
): Promise<GoogleIdTokenPayload | null> {
  try {
    const [headerB64] = idToken.split(".");
    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());
    const kid = header.kid;

    const certs = await getGoogleCerts();
    const pem = certs[kid];
    if (!pem) {
      console.error("[GoogleOAuth] No matching key found for kid:", kid);
      return null;
    }

    const verifier = crypto.createVerify("RSA-SHA256");
    const parts = idToken.split(".");
    verifier.update(`${parts[0]}.${parts[1]}`);
    const signature = Buffer.from(parts[2], "base64url");

    if (!verifier.verify(pem, signature)) {
      console.error("[GoogleOAuth] ID token signature verification failed");
      return null;
    }

    const payload: GoogleIdTokenPayload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString()
    );

    const env = getGoogleEnv();
    if (!env) return null;

    if (payload.aud !== env.clientId) {
      console.error("[GoogleOAuth] ID token audience mismatch:", payload.aud);
      return null;
    }

    if (payload.iss !== "accounts.google.com" && payload.iss !== "https://accounts.google.com") {
      console.error("[GoogleOAuth] ID token issuer mismatch:", payload.iss);
      return null;
    }

    if (payload.exp < Date.now() / 1000) {
      console.error("[GoogleOAuth] ID token expired");
      return null;
    }

    if (expectedNonce && payload.nonce !== expectedNonce) {
      console.error("[GoogleOAuth] ID token nonce mismatch");
      return null;
    }

    return payload;
  } catch (error) {
    console.error("[GoogleOAuth] ID token verification error:", error);
    return null;
  }
}

export async function fetchUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
  try {
    const response = await fetchWithTimeout(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export function getAppOrigin(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (envUrl) return envUrl;
  
  // Fallback to checking headers only in development
  if (process.env.NODE_ENV === 'development') {
    const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    if (forwardedProto && forwardedHost) {
      return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, "");
    }
    const origin = request.headers.get("origin") || new URL(request.url).origin;
    if (origin && origin !== "null") return origin.replace(/\/+$/, "");
  }
  
  // In production, always return the canonical domain
  return "https://topchart.store";
}

export function getGoogleRedirectUri(request: Request): string {
  const origin = getAppOrigin(request);
  const redirectUri = `${origin}/api/auth/google/callback`;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[GoogleOAuth] Redirect URI:', redirectUri);
    console.log('[GoogleOAuth] App Origin:', origin);
  }
  
  return redirectUri;
}

export function getGoogleEnv(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export { encryptToken };
export type { GoogleTokenResponse, GoogleIdTokenPayload, GoogleUserInfo };
