import { providerRequest } from "@/lib/providers/http-client";
import { getHubnetEnv } from "@/lib/env";

export type HubnetPurchaseResult = {
  status: string;
  reference?: string;
  message?: string;
  data?: Record<string, unknown>;
};

function getConfig() {
  const env = getHubnetEnv();
  if (!env) return null;
  const baseUrl = (env.HUBNET_BASE_URL || "").replace(/\/$/, "");
  const purchasePath = env.HUBNET_PURCHASE_PATH || "/api/purchase";
  const plansPath = env.HUBNET_PLANS_PATH || "/api/plans";
  const timeoutMs = Number(env.HUBNET_TIMEOUT_MS || "12000") || 12000;
  const apiKey = env.HUBNET_API_KEY;
  return { baseUrl, purchasePath, plansPath, timeoutMs, apiKey };
}

export async function hubnetPurchase(params: {
  phoneNumber: string;
  network: string;
  capacity: string;
  idempotencyKey: string;
}): Promise<{ success: boolean; data?: HubnetPurchaseResult; error?: string }> {
  const cfg = getConfig();
  if (!cfg) return { success: false, error: "Hubnet is not configured" };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${cfg.apiKey}`,
    "X-Idempotency-Key": params.idempotencyKey,
  };

  const body = JSON.stringify({
    phoneNumber: params.phoneNumber,
    network: params.network,
    capacity: params.capacity,
  });

  const result = await providerRequest<HubnetPurchaseResult>(
    "hubnet",
    cfg.baseUrl,
    cfg.purchasePath,
    {
      method: "POST",
      headers,
      body,
      timeoutMs: cfg.timeoutMs,
      retries: 0,
    }
  );

  if (!result.success) {
    return { success: false, error: result.error?.message || "Hubnet request failed" };
  }

  const data = result.data as HubnetPurchaseResult;
  const normalized = String(data?.status || "").toLowerCase();
  if (normalized === "completed" || normalized === "success") {
    return { success: true, data: { ...data, status: "completed" } };
  }
  if (normalized === "pending" || normalized === "processing" || normalized === "queued") {
    return { success: true, data: { ...data, status: "pending" } };
  }
  return { success: false, error: data?.message || "Hubnet reported failure" };
}

export async function getHubnetPlans(params: {
  network: string;
  subcategory: "ishare" | "big_time" | string;
}): Promise<{ success: boolean; packages?: Array<{ capacity: string; price: number; providerPlanId?: string; label?: string }>; error?: string }>{
  const cfg = getConfig();
  if (!cfg) return { success: false, error: "Hubnet is not configured" };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${cfg.apiKey}`,
  };
  const query = new URLSearchParams({ network: params.network, subcategory: params.subcategory }).toString();
  const endpoint = `${cfg.plansPath}?${query}`;

  const result = await providerRequest<{ plans?: Array<Record<string, unknown>> }>(
    "hubnet",
    cfg.baseUrl,
    endpoint,
    {
      method: "GET",
      headers,
      timeoutMs: cfg.timeoutMs,
      retries: 1,
    }
  );

  if (!result.success) {
    return { success: false, error: result.error?.message || "Hubnet plans request failed" };
  }

  const raw = result.data?.plans || [];
  const packages = raw.map((p) => {
    const obj = p as Record<string, unknown>;
    const capacity = String(obj.capacity ?? obj.size ?? obj.label ?? "");
    const price = Number(obj.price ?? obj.amount ?? 0);
    const providerPlanId = typeof obj.id === "string" ? obj.id : typeof obj.planId === "string" ? obj.planId : undefined;
    const label = typeof obj.label === "string" ? obj.label : undefined;
    return { capacity, price, providerPlanId, label };
  }).filter((x) => x.capacity && !isNaN(x.price) && x.price > 0);

  return { success: true, packages };
}
