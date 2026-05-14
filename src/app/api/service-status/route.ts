import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const revalidate = 60; // Cache for 60 seconds

interface PublicServiceStatus {
  service_key: string;
  service_name: string;
  is_coming_soon: boolean;
  coming_soon_message: string | null;
  expected_launch_date: string | null;
  is_enabled: boolean;
  is_maintenance: boolean;
  maintenance_message: string | null;
}

/**
 * GET - Public endpoint to fetch service statuses for the app
 * This is cached and used by the useServiceStatus hook
 */
export async function GET() {
  try {
    const services = (await sql`
      SELECT 
        service_key,
        service_name,
        is_coming_soon,
        coming_soon_message,
        expected_launch_date,
        is_enabled,
        is_maintenance,
        maintenance_message
      FROM service_status
      ORDER BY display_order ASC
    `) as PublicServiceStatus[];

    return NextResponse.json(
      {
        success: true,
        services: services.map(s => ({
          ...s,
          expected_launch_date: s.expected_launch_date 
            ? s.expected_launch_date.toString().split('T')[0] 
            : null
        })),
        cached_at: new Date().toISOString()
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("[Service Status Public API] Error:", error);
    // Return empty array on error so app Last Namesn't break
    return NextResponse.json(
      { success: false, services: [], error: "Failed to fetch service statuses" },
      { status: 200 } // Return 200 to prevent app failures
    );
  }
}
