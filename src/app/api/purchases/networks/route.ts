export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

function getDbPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}

export const revalidate = 3600; // Cache for 1 hour
export const runtime = "nodejs";

type Network = {
  id: string;
  name: string;
  bundle_count: number;
};

export async function GET(request: NextRequest) {
  const pool = getDbPool();

  try {
    // Get distinct networks from data_bundles table with their names
    const result = await pool.query(`
      SELECT 
        network_id as id,
        COUNT(*) as bundle_count
      FROM data_bundles
      WHERE "isActive" = true
      GROUP BY network_id
      ORDER BY bundle_count DESC
    `);

    // Map network IDs to friendly names
    const networkNames: Record<string, string> = {
      "a1b2c3d4-0001-0000-0000-000000000001": "MTN",
      "a1b2c3d4-0002-0000-0000-000000000002": "AirtelTigo",
      "a1b2c3d4-0003-0000-0000-000000000003": "Telecel",
    };

    const networks: Network[] = result.rows.map((row: any) => ({
      id: row.id,
      name: networkNames[row.id] || row.id,
      bundle_count: parseInt(row.bundle_count, 10),
    }));

    console.log(`[v0] Returned ${networks.length} networks`);

    return NextResponse.json({
      success: true,
      data: networks,
    });
  } catch (error) {
    console.error("[v0] Networks API error:", error);
    const err = error as any;

    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch networks" },
      { status: 500 }
    );
  } finally {
    pool.end();
  }
}
