#!/usr/bin/env node
/**
 * Diagnostic script to test all external service connections
 * Run with: npx tsx src/scripts/diagnose-connections.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../.env.local") });

import { sql } from "@/lib/db";
import { getConfig } from "@/lib/config";

interface TestResult {
  name: string;
  status: "pass" | "fail" | "skip";
  message: string;
  latency?: number;
  error?: string;
  config?: {
    selectedVars?: string[];
    missingVars?: string[];
    hasDefaults?: boolean;
  };
}

async function testDatabase(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const config = getConfig();
    const selectedVars = [config.database.source];
    
    const result = await sql`SELECT 1 as test, now() as time`;
    const latency = Date.now() - startTime;
    return {
      name: "Database (Neon PostgreSQL)",
      status: "pass",
      message: `Connected successfully. Server time: ${result[0]?.time}`,
      latency,
      config: { selectedVars },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const missingVars = errorMessage.includes("Missing required environment variables")
      ? errorMessage.split(": ")[1]?.split(" | ") || []
      : [];
    
    return {
      name: "Database (Neon PostgreSQL)",
      status: "fail",
      message: "Failed to connect to database",
      error: errorMessage,
      config: { missingVars },
    };
  }
}

async function testReloadlyAuth(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const config = getConfig();
    
    if (!config.reloadly) {
      return {
        name: "Reloadly (Airtime API)",
        status: "skip",
        message: "Credentials not configured",
        config: { missingVars: ["RELOADLY_CLIENT_ID", "RELOADLY_CLIENT_SECRET"] },
      };
    }
    
    const selectedVars = ["RELOADLY_CLIENT_ID", "RELOADLY_CLIENT_SECRET"];
    if (config.reloadly.baseUrl !== "https://topups.reloadly.com") {
      selectedVars.push("RELOADLY_BASE_URL");
    }
    if (config.reloadly.authUrl !== "https://auth.reloadly.com/oauth/token") {
      selectedVars.push("RELOADLY_AUTH_URL");
    }
    
    const response = await fetch(config.reloadly.authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: config.reloadly.clientId,
        client_secret: config.reloadly.clientSecret,
        grant_type: "client_credentials",
        audience: config.reloadly.audience,
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
        config: { selectedVars, hasDefaults: config.reloadly.baseUrl === "https://topups.reloadly.com" },
      };
    } else {
      const error = await response.json();
      return {
        name: "Reloadly (Airtime API)",
        status: "fail",
        message: `Authentication failed: ${error.errorCode || response.statusText}`,
        latency,
        error: JSON.stringify(error),
        config: { selectedVars },
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const missingVars = errorMessage.includes("Missing required environment variables")
      ? errorMessage.split(": ")[1]?.split(", ") || []
      : [];
    
    return {
      name: "Reloadly (Airtime API)",
      status: "fail",
      message: "Failed to connect to Reloadly",
      error: errorMessage,
      config: { missingVars },
    };
  }
}

async function testDataMart(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const config = getConfig();
    
    if (!config.datamart) {
      return {
        name: "DataMart API",
        status: "skip",
        message: "API key not configured",
        config: { missingVars: ["DATAMART_API_KEY"] },
      };
    }
    
    const selectedVars = ["DATAMART_API_KEY"];
    if (config.datamart.baseUrl !== "https://api.datamartgh.shop") {
      selectedVars.push("DATAMART_BASE_URL");
    }
    
    const response = await fetch(`${config.datamart.baseUrl}/api/developer/balance`, {
      headers: {
        "X-API-Key": config.datamart.apiKey,
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
        config: { selectedVars, hasDefaults: config.datamart.baseUrl === "https://api.datamartgh.shop" },
      };
    } else {
      return {
        name: "DataMart API",
        status: "fail",
        message: `API error: ${response.status} ${response.statusText}`,
        latency,
        config: { selectedVars },
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const missingVars = errorMessage.includes("Missing required environment variables")
      ? errorMessage.split(": ")[1]?.split(", ") || []
      : [];
    
    return {
      name: "DataMart API",
      status: "fail",
      message: "Failed to connect to DataMart",
      error: errorMessage,
      config: { missingVars },
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
    
    if (result.config) {
      if (result.config.selectedVars && result.config.selectedVars.length > 0) {
        console.log(`   Selected env vars: ${result.config.selectedVars.join(", ")}`);
      }
      if (result.config.missingVars && result.config.missingVars.length > 0) {
        console.log(`   Missing env vars: ${result.config.missingVars.join(", ")}`);
      }
      if (result.config.hasDefaults !== undefined) {
        console.log(`   Using defaults: ${result.config.hasDefaults ? "Yes" : "No"}`);
      }
    }
    
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
  
  // Exit code based on results - only fail if database fails (required)
  const databaseFailed = results.find(r => r.name.includes("Database"))?.status === "fail";
  process.exit(databaseFailed ? 1 : 0);
}

async function main() {
  console.log("Running connection diagnostics...");
  console.log("Loading environment from .env.local...\n");
  
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
