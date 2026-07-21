export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

// Direct database connection for data bundle queries
function getDbPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}

export const revalidate = 60;
export const runtime = "nodejs";

type Plan = {
  id: string;
  size_label: string;
  validity_label: string;
  price: number;
  name: string;
  sizeMb: number;
  validityDays: number | null;
  network_id: string;
  isPopular: boolean;
  isActive: boolean;
  isFeatured: boolean;
};

export async function GET(request: NextRequest) {
  const pool = getDbPool();
  
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get("network");

    console.log("[v0] Fetching plans for network:", network || "all");

    // Query data bundles from database
    let query = `
      SELECT 
        id,
        name,
        "sizeMb",
        "validityHours",
        price,
        network_id,
        "isPopular",
        "isActive",
        "isFeatured"
      FROM data_bundles
      WHERE "isActive" = true
    `;
    const params: unknown[] = [];

    if (network) {
      query += ` AND network_id = $1`;
      params.push(network.toUpperCase());
    }

    query += ` ORDER BY network_id, price ASC`;

    const result = await pool.query(query, params);
    const plans: Plan[] = result.rows.map((row: any) => {
      const validityDays =
        row.validityHours != null ? Math.round(row.validityHours / 24) : null;
      return {
      id: row.id,
      size_label: row.name,
      validity_label: validityDays ? `${validityDays} days` : "N/A",
      price: parseFloat(row.price),
      name: row.name,
      sizeMb: row.sizeMb,
      validityDays,
      network_id: row.network_id,
      isPopular: row.isPopular,
      isActive: row.isActive,
      isFeatured: row.isFeatured,
      };
    });

    console.log(`[v0] Returned ${plans.length} plans`);

    return NextResponse.json({
      success: true,
      data: plans,
      stale: false,
      fromCache: true,
    });
  } catch (error) {
    console.error("[v0] Plans API error:", error);
    const err = error as any;
    
    if (err?.code === "42P01") {
      return NextResponse.json(
        { success: false, error: "Data bundles table not found" },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch plans" },
      { status: 500 }
    );
  } finally {
    pool.end();
  }
}
