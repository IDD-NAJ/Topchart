import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import {
  getProducts,
  calculateUserPrice,
  USD_TO_GHS_RATE,
  DEFAULT_GIFTCARD_MARKUP,
  mapCategoryByBrand,
  type ReloadlyProduct,
} from "@/lib/reloadly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = [
  { id: "gaming", name: "Gaming", icon: "Gamepad2" },
  { id: "shopping", name: "Shopping", icon: "ShoppingCart" },
  { id: "entertainment", name: "Entertainment", icon: "Play" },
  { id: "lifestyle", name: "Lifestyle", icon: "Heart" },
  { id: "software", name: "Software", icon: "Monitor" },
  { id: "food", name: "Food & Dining", icon: "Utensils" },
];

export async function GET(request: NextRequest) {
  try {
    console.log("[API] Giftcard products request received");
    
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      console.log("[API] No session token found");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await sql`
      SELECT s.user_id FROM auth_sessions s
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      console.log("[API] Session expired");
      return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
    }

    console.log("[API] User authenticated, fetching from Reloadly");
    
    const { searchParams } = new URL(request.url);
    const countryFilter = searchParams.get("country");
    const categoryFilter = searchParams.get("category");

    const reloadlyResult = await getProducts(countryFilter || undefined, categoryFilter || undefined);

    console.log("[API] Reloadly result:", {
      success: reloadlyResult.success,
      hasData: !!reloadlyResult.data,
      error: reloadlyResult.error,
      dataLength: reloadlyResult.data?.length,
    });

    if (!reloadlyResult.success || !reloadlyResult.data) {
      console.error("[API] Failed to fetch from Reloadly:", reloadlyResult.error);
      return NextResponse.json(
        { success: false, error: reloadlyResult.error || "Failed to fetch products from Reloadly" },
        { status: 502 }
      );
    }

    const reloadlyProducts: ReloadlyProduct[] = reloadlyResult.data;

    const productIds = reloadlyProducts.map((p) => p.productId.toString());

    let dbOverrides: Record<string, { is_enabled: boolean; custom_markup_percentage: number | null; restricted_to_resellers: boolean }> = {};
    try {
      const rows = await sql`
        SELECT reloadly_product_id, is_enabled, custom_markup_percentage, restricted_to_resellers
        FROM giftcard_product_configs
        WHERE reloadly_product_id = ANY(${productIds})
      `;
      for (const row of rows as any[]) {
        dbOverrides[row.reloadly_product_id] = {
          is_enabled: row.is_enabled,
          custom_markup_percentage: row.custom_markup_percentage ? Number(row.custom_markup_percentage) : null,
          restricted_to_resellers: row.restricted_to_resellers,
        };
      }
    } catch {
    }

    const userId = sessions[0].user_id;

    const resellerCheck = await sql`
      SELECT id, commission_rate FROM reseller_profiles WHERE user_id = ${userId}
    `;
    const isReseller = resellerCheck.length > 0;
    const resellerCommissionRate = isReseller ? Number(resellerCheck[0].commission_rate) : 0;

    const products = reloadlyProducts
      .map((product) => {
        const override = dbOverrides[product.productId.toString()];
        if (override && !override.is_enabled) return null;
        if (override?.restricted_to_resellers && !isReseller) return null;

        const markup = override?.custom_markup_percentage ?? DEFAULT_GIFTCARD_MARKUP;
        const basePriceUSD = product.minRecipientDenomination;
        const category = mapCategoryByBrand(product.brandName);

        return {
          id: product.productId.toString(),
          reloadly_product_id: product.productId.toString(),
          product_name: product.productName,
          brand_name: product.brandName,
          country_code: product.countryIsoName,
          country_name: product.countryName,
          currency_code: product.currencyCode,
          currency_name: product.currencyName,
          denomination_type: product.denominationType,
          min_denomination: product.minRecipientDenomination,
          max_denomination: product.maxRecipientDenomination,
          sender_fee: product.senderFee,
          discount_percentage: product.discountPercentage,
          logo_url: product.logoUrl,
          card_type: product.cardType,
          recipient_currency_code: product.recipientCurrencyCode,
          fixed_denominations: product.fixedDenominations,
          fixed_recipient_denominations: product.fixedRecipientDenominations,
          price_ghs: calculateUserPrice(basePriceUSD, USD_TO_GHS_RATE, markup),
          markup_percentage: markup,
          is_restricted_to_resellers: override?.restricted_to_resellers || false,
          category,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        products,
        categories: CATEGORIES,
        exchange_rate: USD_TO_GHS_RATE,
        is_reseller: isReseller,
        reseller_commission_rate: resellerCommissionRate,
      },
    });
  } catch (error) {
    console.error("Get giftcard products error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
