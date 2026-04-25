import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  const startTime = Date.now();
  
  try {
    const result = await sql`SELECT 1 as health_check, now() as server_time`;
    const latency = Date.now() - startTime;
    
    return NextResponse.json({
      status: "healthy",
      latency_ms: latency,
      server_time: result[0]?.server_time,
      message: "Database connection successful"
    }, { status: 200 });
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    console.error("[Health Check] Database error:", error);
    
    return NextResponse.json({
      status: "unhealthy",
      latency_ms: latency,
      error: errorMessage,
      code: (error as any)?.code || "UNKNOWN",
      message: "Database connection failed"
    }, { status: 503 });
  }
}
