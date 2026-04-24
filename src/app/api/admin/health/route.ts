import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthStatus {
  database: string;
  apis: {
    paystack: string;
    datamart: string;
    reloadly: string;
    pvadeals: string;
    supabase_storage: string;
    nineproxy: string;
    textverified: string;
  };
  environment: {
    cronSecret: boolean;
    sessionSecret: boolean;
    appUrl: boolean;
  };
  timestamp: string;
  latency?: {
    database?: number;
    paystack?: number;
    pvadeals?: number;
  };
}

/**
 * Test Paystack API connectivity by checking balance endpoint.
 */
async function testPaystackConnectivity(): Promise<{ status: string; latencyMs?: number }> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return { status: "missing" };
  }

  const start = Date.now();
  try {
    const response = await fetch("https://api.paystack.co/balance", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    const latencyMs = Date.now() - start;

    if (response.ok) {
      return { status: "connected", latencyMs };
    } else if (response.status === 401) {
      return { status: "invalid_key" };
    } else {
      return { status: `error_${response.status}` };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return { status: "timeout" };
    }
    return { status: "error" };
  }
}

/**
 * Test PVAdeals API connectivity by checking balance endpoint.
 */
async function testPvadealsConnectivity(): Promise<{ status: string; latencyMs?: number }> {
  const apiKey = process.env.PVADEALS_API_KEY;
  if (!apiKey) {
    return { status: "missing" };
  }

  const baseUrl = process.env.PVADEALS_BASE_URL || "https://prod-v3.pvadeals.com";
  const start = Date.now();

  try {
    const response = await fetch(`${baseUrl}/v3/api/balance`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    const latencyMs = Date.now() - start;

    if (response.ok) {
      return { status: "connected", latencyMs };
    } else if (response.status === 401) {
      return { status: "invalid_key" };
    } else {
      return { status: `error_${response.status}` };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return { status: "timeout" };
    }
    return { status: "error" };
  }
}

/**
 * Test database connectivity with latency measurement.
 */
async function testDatabaseConnectivity(): Promise<{ status: string; latencyMs?: number }> {
  const start = Date.now();
  try {
    await sql`SELECT 1`;
    const latencyMs = Date.now() - start;
    return { status: "connected", latencyMs };
  } catch (error) {
    logger.error({ message: "Health check: Database failed", error });
    return { status: "error" };
  }
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const health: HealthStatus = {
    database: "unknown",
    apis: {
      paystack: "unknown",
      datamart: "unknown",
      reloadly: "unknown",
      pvadeals: "unknown",
      supabase_storage: "unknown",
      nineproxy: "unknown",
      textverified: "unknown",
    },
    environment: {
      cronSecret: Boolean(process.env.CRON_SECRET),
      sessionSecret: Boolean(process.env.SESSION_SECRET),
      appUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    },
    timestamp: new Date().toISOString(),
    latency: {},
  };

  // Run connectivity tests in parallel for better performance
  const [dbResult, paystackResult, pvadealsResult] = await Promise.all([
    testDatabaseConnectivity(),
    testPaystackConnectivity(),
    testPvadealsConnectivity(),
  ]);

  // Database
  health.database = dbResult.status;
  if (dbResult.latencyMs) health.latency!.database = dbResult.latencyMs;

  // Paystack
  health.apis.paystack = paystackResult.status;
  if (paystackResult.latencyMs) health.latency!.paystack = paystackResult.latencyMs;

  // PVAdeals
  health.apis.pvadeals = pvadealsResult.status;
  if (pvadealsResult.latencyMs) health.latency!.pvadeals = pvadealsResult.latencyMs;

  // Datamart (config check only - actual test would require more complex validation)
  health.apis.datamart = process.env.DATAMART_API_KEY ? "configured" : "missing";

  // Reloadly
  health.apis.reloadly = 
    (process.env.RELOADLY_CLIENT_ID && process.env.RELOADLY_CLIENT_SECRET) 
      ? "configured" 
      : "missing";

  // 9Proxy
  health.apis.nineproxy = process.env.NINEPROXY_API_KEY ? "configured" : "missing";

  // TextVerified
  health.apis.textverified = process.env.TEXTVERIFIED_API_KEY ? "configured" : "missing";

  // Supabase Storage - actual connectivity test
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(
        process.env.SUPABASE_URL, 
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const bucketName = process.env.SUPABASE_BUCKET_HOMEPAGE_MEDIA || "homepage-media";
      const { error } = await client.storage.getBucket(bucketName);
      health.apis.supabase_storage = error ? `error: ${error.message}` : "connected";
    } catch {
      health.apis.supabase_storage = "error";
    }
  } else {
    health.apis.supabase_storage = "missing";
  }

  // Determine overall health status
  const criticalServices = [health.database, health.apis.paystack];
  const hasErrors = criticalServices.some(s => s === "error" || s === "invalid_key");
  const hasMissing = criticalServices.some(s => s === "missing");

  return NextResponse.json({
    success: true,
    health,
    status: hasErrors ? "degraded" : hasMissing ? "partial" : "healthy",
  });
}
