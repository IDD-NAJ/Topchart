import { getDatamartEnv } from "@/lib/env";
import { normalizeDatamartBaseUrl } from "@/lib/datamart";

interface TestResult {
  endpoint: string;
  method: string;
  status: number | null;
  ok: boolean;
  latencyMs: number;
  error?: string;
  data?: any;
}

async function testEndpoint(
  baseUrl: string,
  apiKey: string,
  endpoint: string,
  method: string = "GET",
  body?: any
): Promise<TestResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method,
      signal: controller.signal,
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        ...(method === "GET" ? { Accept: "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - start;
    let data: any = null;
    try {
      data = await res.json();
    } catch {}
    return {
      endpoint,
      method,
      status: res.status,
      ok: res.ok,
      latencyMs,
      data: data ? JSON.stringify(data).slice(0, 200) : null,
    };
  } catch (err: any) {
    return {
      endpoint,
      method,
      status: null,
      ok: false,
      latencyMs: Date.now() - start,
      error: err?.name === "AbortError" ? "TIMEOUT" : (err?.message || "UNKNOWN"),
    };
  }
}

async function main() {
  const env = getDatamartEnv();
  const baseUrl = normalizeDatamartBaseUrl(env.DATAMART_BASE_URL);
  const apiKey = env.API;

  console.log("=== DataMart API Validation ===");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`API Key: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`);
  console.log();

  const endpoints = [
    { endpoint: "/api/developer/balance", method: "GET", safe: true },
    { endpoint: "/api/developer/data-packages", method: "GET", safe: true },
    { endpoint: "/api/developer/data-packages?network=YELLO", method: "GET", safe: true },
    { endpoint: "/api/developer/data-packages?network=TELECEL", method: "GET", safe: true },
    { endpoint: "/api/developer/data-packages?network=AT_PREMIUM", method: "GET", safe: true },
    { endpoint: "/api/developer/usage/stats", method: "GET", safe: true },
    { endpoint: "/api/developer/delivery-tracker", method: "GET", safe: true },
    { endpoint: "/api/developer/transactions?page=1&limit=5", method: "GET", safe: true },
    { endpoint: "/api/developer/webhook/status", method: "GET", safe: true },
    { endpoint: "/api/developer/v1/withdrawals/meta/limits", method: "GET", safe: true },
    { endpoint: "/api/developer/v1/withdrawals?page=1&limit=5", method: "GET", safe: true },
  ];

  const results: TestResult[] = [];
  for (const ep of endpoints) {
    if (!ep.safe) continue;
    const result = await testEndpoint(baseUrl, apiKey, ep.endpoint, ep.method);
    results.push(result);
    const icon = result.ok ? "✓" : "✗";
    const status = result.status ?? "ERR";
    console.log(`${icon} ${result.method} ${result.endpoint} → ${status} (${result.latencyMs}ms)${result.error ? ` [${result.error}]` : ""}`);
  }

  console.log();
  console.log("=== Also testing alternate auth format ===");
  const altAuthResult = await testEndpoint(baseUrl, "", "/api/developer/balance", "GET");
  console.log(`Token auth test: ${altAuthResult.status ?? "ERR"} (${altAuthResult.latencyMs}ms)`);

  console.log();
  const passCount = results.filter(r => r.ok).length;
  const failCount = results.filter(r => !r.ok).length;
  console.log(`=== Results: ${passCount} passed, ${failCount} failed ===`);

  if (failCount === results.length) {
    console.log("\n⚠️  API is unreachable. The website scraping fallback will be used for sync.");
  }
}

main().catch(console.error);
