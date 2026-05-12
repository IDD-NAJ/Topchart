import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { cookies } from "next/headers";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory store for rate limiting (simple implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIP || req.headers.get("cf-connecting-ip") || "unknown";
  return ip;
}

async function getUserId(req: NextRequest): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    
    if (!sessionToken) return null;
    
    const sessions = await sql`
      SELECT user_id FROM auth_sessions
      WHERE token = ${sessionToken} AND expires_at > NOW()
      LIMIT 1
    `;
    
    if (sessions.length === 0) return null;
    
    return sessions[0].user_id as string;
  } catch {
    return null;
  }
}

async function logRateLimitViolation(
  identifier: string,
  endpoint: string,
  limit: number,
  windowMs: number
): Promise<void> {
  try {
    await sql`
      INSERT INTO rate_limit_violations (reseller_id, ip_address, endpoint, limit, window_ms, created_at)
      VALUES (NULL, ${identifier}, ${endpoint}, ${limit}, ${windowMs}, NOW())
    `;
  } catch (error) {
    console.error("Failed to log rate limit violation:", error);
  }
}

function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || record.resetTime < now) {
    // New window
    const newRecord = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newRecord);
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: newRecord.resetTime,
    };
  }

  // Existing window
  if (record.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: record.resetTime,
    };
  }

  record.count++;
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - record.count,
    reset: record.resetTime,
  };
}

// Default configurations
const defaultConfigs: Record<string, RateLimitConfig> = {
  // Public endpoints - stricter limits
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  // Authenticated API endpoints - more lenient
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 500,
  },
  // Admin endpoints - stricter
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200,
  },
  // Payment endpoints - very strict
  payment: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
  },
  // OAuth endpoints - strict to prevent abuse
  oauth: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  },
};

export function withRateLimit(config?: Partial<RateLimitConfig> & { type?: keyof typeof defaultConfigs }) {
  const mergedConfig: RateLimitConfig = config?.type 
    ? { ...defaultConfigs[config.type], ...config }
    : {
        windowMs: 60 * 1000,
        maxRequests: 100,
        ...config,
      };

  return function<T extends NextRequest>(
    handler: (req: T) => Promise<NextResponse>
  ): (req: T) => Promise<NextResponse> {
    return async (req: T): Promise<NextResponse> => {
      const userId = await getUserId(req);
      const ip = getClientIP(req);
      
      const key = userId ? `user:${userId}` : `ip:${ip}`;
      const keyWithEndpoint = `${key}:${req.nextUrl.pathname}`;
      
      const result = checkRateLimit(keyWithEndpoint, mergedConfig);
      
      if (!result.success) {
        await logRateLimitViolation(
          userId || ip,
          req.nextUrl.pathname,
          mergedConfig.maxRequests,
          mergedConfig.windowMs
        );
        
        return NextResponse.json(
          {
            success: false,
            error: "Too many requests. Please try again later.",
            retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
          },
          {
            status: 429,
            headers: {
              "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
              "X-RateLimit-Limit": result.limit.toString(),
              "X-RateLimit-Remaining": result.remaining.toString(),
              "X-RateLimit-Reset": result.reset.toString(),
            },
          }
        );
      }
      
      const response = await handler(req);
      response.headers.set("X-RateLimit-Limit", result.limit.toString());
      response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
      response.headers.set("X-RateLimit-Reset", result.reset.toString());
      
      return response;
    };
  };
}

// Helper function to get rate limit info without enforcing
export function getRateLimitInfo(key: string): { count: number; resetTime: number } | null {
  return rateLimitStore.get(key) || null;
}
