import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllProviders } from "@/lib/providers/config";
import { isDatamartReachable, getReachabilityInfo } from "@/lib/datamart";
import { getHubnetEnv } from "@/lib/env";
import { providerRequest } from "@/lib/providers/http-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function checkDatamartHealth(): Promise<{ status: "healthy" | "unhealthy"; latency: number; error?: string }> {
  const startTime = Date.now();
  try {
    const reachable = await isDatamartReachable();
    const latency = Date.now() - startTime;
    if (reachable) {
      return { status: "healthy", latency };
    } else {
      const info = getReachabilityInfo();
      return { status: "unhealthy", latency, error: info.reason };
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    return { status: "unhealthy", latency, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function checkHubnetHealth(): Promise<{ status: "healthy" | "unhealthy"; latency: number; error?: string }> {
  const env = getHubnetEnv();
  if (!env || !env.HUBNET_API_KEY) {
    return { status: "unhealthy", latency: 0, error: "Hubnet not configured" };
  }

  const startTime = Date.now();
  try {
    const baseUrl = (env.HUBNET_BASE_URL || "").replace(/\/$/, "");
    const plansPath = env.HUBNET_PLANS_PATH || "/api/plans";
    const timeoutMs = Number(env.HUBNET_TIMEOUT_MS || "5000") || 5000;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.HUBNET_API_KEY}`,
    };

    const result = await providerRequest<{ plans?: unknown[] }>(
      "hubnet",
      baseUrl,
      `${plansPath}?network=YELLO&subcategory=ishare`,
      {
        method: "GET",
        headers,
        timeoutMs,
        retries: 0,
      }
    );

    const latency = Date.now() - startTime;
    if (result.success) {
      return { status: "healthy", latency };
    } else {
      return { status: "unhealthy", latency, error: result.error?.message || "Request failed" };
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    return { status: "unhealthy", latency, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json(
      { success: false, error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  try {
    const providers = await getAllProviders();
    const healthChecks = await Promise.all(
      providers.map(async (provider) => {
        if (provider.providerName === "datamart") {
          const health = await checkDatamartHealth();
          return {
            providerName: provider.providerName,
            ...health,
            enabled: provider.isEnabled,
            primary: provider.isPrimary,
            fallback: provider.isFallback,
          };
        } else if (provider.providerName === "hubnet") {
          const health = await checkHubnetHealth();
          return {
            providerName: provider.providerName,
            ...health,
            enabled: provider.isEnabled,
            primary: provider.isPrimary,
            fallback: provider.isFallback,
          };
        }
        return {
          providerName: provider.providerName,
          status: "unknown" as const,
          latency: 0,
          error: "Unknown provider",
          enabled: provider.isEnabled,
          primary: provider.isPrimary,
          fallback: provider.isFallback,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: healthChecks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Data Providers Health] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check provider health" },
      { status: 500 }
    );
  }
}
