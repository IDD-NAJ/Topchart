import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { isDatamartReachable, getReachabilityInfo, getBalance, getDatamartConfig } from "@/lib/datamart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json(
      { success: false, error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  const startTime = Date.now();

  let configOk = false;
  let configError: string | null = null;
  try {
    const config = getDatamartConfig();
    configOk = Boolean(config.baseUrl && config.apiKey);
    if (!config.baseUrl) configError = "DATAMART_BASE_URL not set";
    if (!config.apiKey) configError = "DATAMART_API_KEY not set";
  } catch (err: any) {
    configError = err?.message || "Config error";
  }

  const reachable = await isDatamartReachable();
  const reachInfo = getReachabilityInfo();

  let balanceOk = false;
  let balanceData: any = null;
  let balanceError: string | null = null;
  if (reachable) {
    try {
      const result = await getBalance();
      if (result.success && result.data) {
        balanceOk = true;
        balanceData = result.data;
      } else {
        balanceError = result.error || "Balance check failed";
      }
    } catch (err: any) {
      balanceError = err?.message || "Balance check error";
    }
  }

  const duration = Date.now() - startTime;

  return NextResponse.json({
    success: true,
    data: {
      config: {
        ok: configOk,
        error: configError,
      },
      reachability: {
        reachable,
        reason: reachInfo.reason,
        checkedAt: reachInfo.checkedAt ? new Date(reachInfo.checkedAt).toISOString() : null,
        cacheAgeMs: reachInfo.checkedAt ? Date.now() - reachInfo.checkedAt : null,
      },
      balance: {
        ok: balanceOk,
        data: balanceData,
        error: balanceError,
      },
      duration,
    },
  });
}
