import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await sql`
      SELECT s.user_id FROM auth_sessions s
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
    }

    const userId = sessions[0].user_id;

    const favorites = await sql`
      SELECT 
        id,
        reloadly_product_id,
        product_name,
        brand_name,
        logo_url,
        price_ghs,
        currency,
        category,
        country_code,
        created_at
      FROM giftcard_favorites
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      success: true,
      data: {
        favorites: favorites as any[],
      },
    });
  } catch (error) {
    console.error("Get favorites error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await sql`
      SELECT s.user_id FROM auth_sessions s
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
    }

    const userId = sessions[0].user_id;
    const body = await request.json();
    const { 
      reloadly_product_id,
      product_name,
      brand_name,
      logo_url,
      price_ghs,
      currency,
      category,
      country_code,
    } = body;

    if (!reloadly_product_id || !product_name || !brand_name) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    try {
      await sql`
        INSERT INTO giftcard_favorites (
          user_id,
          reloadly_product_id,
          product_name,
          brand_name,
          logo_url,
          price_ghs,
          currency,
          category,
          country_code
        ) VALUES (
          ${userId},
          ${reloadly_product_id},
          ${product_name},
          ${brand_name},
          ${logo_url || null},
          ${price_ghs || null},
          ${currency || null},
          ${category || null},
          ${country_code || null}
        )
      `;
    } catch (err: any) {
      if (err.code === '23505') {
        return NextResponse.json(
          { success: false, error: "Product already in favorites" },
          { status: 409 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      success: true,
      message: "Added to favorites",
    });
  } catch (error) {
    console.error("Add favorite error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add to favorites" },
      { status: 500 }
    );
  }
}
