import { NextRequest, NextResponse } from "next/server";
import { getSmspvaV2Operators, getSmspvaV2ServicePrice, SMSPVA_SERVICES } from "@/lib/smspva";

/**
 * GET /api/verification/smspva/international?country=ru&service=opt6
 * Fetch available international numbers from SMSPVA v2 API
 * Supports all countries except USA and UK
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");
    const service = searchParams.get("service");

    if (!country) {
      return NextResponse.json(
        { ok: false, error: "Missing country parameter" },
        { status: 400 }
      );
    }

    // Block USA and UK — they use their own providers
    if (country.toLowerCase() === "us" || country.toLowerCase() === "gb") {
      return NextResponse.json(
        { ok: false, error: "USA and UK numbers use dedicated providers" },
        { status: 400 }
      );
    }

    // If specific service is requested, fetch price and count
    if (service) {
      const priceResult = await getSmspvaV2ServicePrice(country, service);
      if (!priceResult.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: `Unable to fetch pricing for ${service} in ${country}`,
            details: priceResult.error,
          },
          { status: 502 }
        );
      }
      return NextResponse.json({
        ok: true,
        data: priceResult.data,
      });
    }

    // Fetch all operators for the country
    const operatorsResult = await getSmspvaV2Operators(country);
    if (!operatorsResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Unable to fetch operators for ${country}`,
          details: operatorsResult.error,
        },
        { status: 502 }
      );
    }

    // Map operators to services by operator ID, then fetch prices
    const services = SMSPVA_SERVICES.slice(0, 10); // Use first 10 services for demo
    const operatorMap = new Map(operatorsResult.data.map(op => [op.id, op]));

    // Fetch price for first operator/service combo to estimate
    const firstOp = operatorsResult.data[0];
    let basePrice = 0.12; // Default base price

    if (firstOp) {
      const priceResult = await getSmspvaV2ServicePrice(country, firstOp.id);
      if (priceResult.ok) {
        basePrice = priceResult.data.price;
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        country,
        operators: operatorsResult.data,
        operatorCount: operatorsResult.data.length,
        availableServices: services.length,
        basePrice,
      },
    });
  } catch (error) {
    console.error("[API] International numbers error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
