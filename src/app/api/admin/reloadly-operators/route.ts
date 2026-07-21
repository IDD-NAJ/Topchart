export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getOperators, getOperatorsByCountry } from "@/lib/reloadly";
import { _RELOADLY_OPERATORS, getNetworkName } from "@/lib/reloadly-networks";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country") || "GH";
    const localOnly = searchParams.get("localOnly") === "true";

    if (localOnly) {
      // Return only the local  operator mappings
      return NextResponse.json({
        success: true,
        data: Object.entries(_RELOADLY_OPERATORS).map(([key, op]) => ({
          network: key,
          id: op.id,
          name: op.name,
          shortNames: op.shortNames,
          phonePrefixes: op.phonePrefixes,
          color: op.color,
        })),
        source: "local",
      });
    }

    // Fetch operators from Reloadly API
    const result = country === "GH"
      ? await getOperators()
      : await getOperatorsByCountry(country, { includeBundles: true, includeData: true, includePin: true });

    if (result.success && result.data) {
      const operators = Array.isArray(result.data) ? result.data : ((result.data as { content?: unknown[] }).content || []) as Record<string, unknown>[];
      // Enhance with local network mapping
      const enhancedOperators = operators.map((op) => {
        const opId = (op as Record<string, unknown>).id as number | undefined ?? (op as Record<string, unknown>).operatorId as number | undefined;
        const localNetwork = opId ? getNetworkName(opId) : null;
        return {
          ...op,
          mappedNetwork: localNetwork,
          isMapped: !!localNetwork,
        };
      });

      return NextResponse.json({
        success: true,
        data: enhancedOperators,
        source: "api",
        countryCode: country,
        mappedCount: enhancedOperators.filter((o) => o.isMapped).length,
      });
    }

    // Fallback to local mappings if API fails
    return NextResponse.json({
      success: true,
      data: Object.entries(_RELOADLY_OPERATORS).map(([key, op]) => ({
        network: key,
        id: op.id,
        name: op.name,
        shortNames: op.shortNames,
        phonePrefixes: op.phonePrefixes,
        color: op.color,
      })),
      source: "local",
      warning: `API fetch failed: ${result.error}. Showing local mappings only.`,
    });
  } catch (error) {
    console.error("Reloadly operators fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
