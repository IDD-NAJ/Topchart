import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const jobs = await sql`
      SELECT id, title, location, type, department, description, requirements, sort_order
      FROM jobs
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, created_at DESC
    `;

    return NextResponse.json(
      {
        success: true,
        jobs: jobs || [],
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Jobs fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load jobs" },
      { status: 500 }
    );
  }
}
