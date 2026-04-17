#!/usr/bin/env node
/**
 * Diagnostic script to test all external service connections
 * Run with: npx tsx src/scripts/diagnose-connections.ts
 */

import { sql } from "@/lib/db";
import { getReloadlyEnv } from "@/lib/env";
import { getDatamartEnv } from "@/lib/env";

interface TestResult {
  name: string;
  status: "pass" | "fail" | "skip";
  message: string;
  latency?: number;
  error?: string;
}

async function testDatabase(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const result = await sql`SELECT 1 as test, now() as time`;
    const latency = Date.now() - startTime;
    return {
      name: "Database (Neon PostgreSQL)",
      status: "pass",
      message: `Connected successfully. Server time: ${result[0]?.time}`,
      latency,
    };
  } catch (error) {
    return {
      name: "Database (Neon PostgreSQL)",
      status: "fail",
      message: "Failed to connect to database",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function testReloadlyAuth(): Promise<TestResult> {
  try {
    const env = getReloadlyEnv();
    const startTime = Date.now();
    
    const authUrl = env.RELOADLY_AUTH_URL || "https://auth.reloadly.com/oauth/token";
    const baseUrl = env.RELOADLY_BASE_URL || env.RELOADLY_API_BASE_URL || "https://airtime.reloadly.com";
    
    // Check if credentials are present
    if (!env.RELOADLY_CLIENT_ID || !env.RELOADLY_CLIENT_SECRET) {
      return {
        name: "Reloadly (Airtime API)",
        status: "skip",
        message: "Credentials not configured",
      };
    }
    
    // Try to authenticate
    const response = await fetch(authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: env.RELOADLY_CLIENT_ID,
        client_secret: env.RELOADLY_CLIENT_SECRET,
        grant_type: "client_credentials",
        audience: baseUrl.replace(/\/$/, ""),
      }),
    });
    
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      return {
        name: "Reloadly (Airtime API)",
        status: "pass",
        message: `Authenticated successfully. Token expires in ${data.expires_in}s`,
        latency,
      };
    } else {
      const error = await response.json();
      return {
        name: "Reloadly (Airtime API)",
        status: "fail",
        message: `Authentication failed: ${error.errorCode || response.statusText}`,
        latency,
        error: JSON.stringify(error),
      };
    }
  } catch (error) {
    return {
      name: "Reloadly (Airtime API)",
      status: "fail",
      message: "Failed to connect to Reloadly",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function testDataMart(): Promise<TestResult> {
  try {
    const env = getDatamartEnv();
    const startTime = Date.now();
    
    if (!env.DATAMART_API_KEY) {
      return {
        name: "DataMart API",
        status: "skip",
        message: "API key not configured",
      };
    }
    
    const baseUrl = env.DATAMART_BASE_URL || "https://api.datamartgh.shop";
    
    // Test the /me endpoint
    const response = await fetch(`${baseUrl}/api/v1/me/`, {
      headers: {
        Authorization: `Token ${env.DATAMART_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      return {
        name: "DataMart API",
        status: "pass",
        message: `Connected. User: ${data.email || data.username || "Unknown"}`,
        latency,
      };
    } else {
      return {
        name: "DataMart API",
        status: "fail",
        message: `API error: ${response.status} ${response.statusText}`,
        latency,
      };
    }
  } catch (error) {
    return {
      name: "DataMart API",
      status: "fail",
      message: "Failed to connect to DataMart",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function printResults(results: TestResult[]) {
  console.log("\n" + "=".repeat(70));
  console.log("CONNECTION DIAGNOSTIC RESULTS");
  console.log("=".repeat(70));
  console.log(`Timestamp: ${new Date().toISOString()}\n`);
  
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const result of results) {
    const icon = result.status === "pass" ? "✓" : result.status === "skip" ? "○" : "✗";
    const color = result.status === "pass" ? "\x1b[32m" : result.status === "skip" ? "\x1b[33m" : "\x1b[31m";
    const reset = "\x1b[0m";
    
    console.log(`${color}${icon}${reset} ${result.name}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    console.log(`   Message: ${result.message}`);
    
    if (result.latency) {
      console.log(`   Latency: ${result.latency}ms`);
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error.substring(0, 200)}`);
    }
    
    console.log();
    
    if (result.status === "pass") passed++;
    else if (result.status === "fail") failed++;
    else skipped++;
  }
  
  console.log("=".repeat(70));
  console.log(`Summary: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log("=".repeat(70) + "\n");
  
  // Exit code based on results
  process.exit(failed > 0 ? 1 : 0);
}

async function main() {
  console.log("Running connection diagnostics...\n");
  
  const results: TestResult[] = [];
  
  // Test database first (required)
  results.push(await testDatabase());
  
  // Test Reloadly (optional - has fallback)
  results.push(await testReloadlyAuth());
  
  // Test DataMart (required for airtime/data)
  results.push(await testDataMart());
  
  printResults(results);
}

main().catch((error) => {
  console.error("Diagnostic script failed:", error);
  process.exit(1);
});
