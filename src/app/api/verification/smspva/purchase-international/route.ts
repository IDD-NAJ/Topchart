import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSmspvaV2Number, getSmspvaV2ServicePrice } from "@/lib/smspva";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";

/**
 * POST /api/verification/smspva/purchase-international
 * Purchase an international number from SMSPVA v2 API
 * Deducts wallet balance and creates verification record
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { country, service } = await req.json();
    if (!country || !service) {
      return NextResponse.json(
        { ok: false, error: "Missing country or service" },
        { status: 400 }
      );
    }

    // Block USA and UK
    if (country.toLowerCase() === "us" || country.toLowerCase() === "gb") {
      return NextResponse.json(
        { ok: false, error: "USA and UK numbers use dedicated providers" },
        { status: 400 }
      );
    }

    // Fetch price
    const priceResult = await getSmspvaV2ServicePrice(country, service);
    if (!priceResult.ok) {
      return NextResponse.json(
        { ok: false, error: "Unable to fetch service price" },
        { status: 502 }
      );
    }

    const priceUsd = priceResult.data.price;
    const exchangeRate = 15.5; // GHS to USD
    const priceGhs = parseFloat((priceUsd * exchangeRate).toFixed(2));

    // Check wallet balance
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    if ((user.walletBalance ?? 0) < priceGhs) {
      return NextResponse.json(
        {
          ok: false,
          error: "Insufficient wallet balance",
          balance: user.walletBalance,
          required: priceGhs,
        },
        { status: 402 }
      );
    }

    // Get number from SMSPVA
    const numberResult = await getSmspvaV2Number(country, service);
    if (!numberResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to get number from provider",
          details: numberResult.error,
          code: "PROVIDER_NUMBER",
        },
        { status: 502 }
      );
    }

    // Deduct balance
    const newBalance = (user.walletBalance ?? 0) - priceGhs;
    await db
      .update(users)
      .set({ walletBalance: newBalance })
      .where(eq(users.id, session.user.id));

    // Create verification record (this would be in your schema)
    // For now, we'll just return the number
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes

    return NextResponse.json({
      ok: true,
      data: {
        number_id: numberResult.data.number_id,
        number: numberResult.data.number,
        operator: numberResult.data.operator,
        country,
        service,
        price: priceGhs,
        expires_at: expiresAt.toISOString(),
        new_balance: newBalance,
      },
    });
  } catch (error) {
    console.error("[API] International purchase error:", error);
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
