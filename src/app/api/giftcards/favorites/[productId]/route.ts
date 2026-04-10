import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
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
    const productId = params.productId;

    const result = await sql`
      DELETE FROM giftcard_favorites
      WHERE user_id = ${userId} AND reloadly_product_id = ${productId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Favorite not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Removed from favorites",
    });
  } catch (error) {
    console.error("Delete favorite error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove from favorites" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
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
    const productId = params.productId;

    const result = await sql`
      SELECT id FROM giftcard_favorites
      WHERE user_id = ${userId} AND reloadly_product_id = ${productId}
    `;

    return NextResponse.json({
      success: true,
      data: {
        isFavorite: result.length > 0,
      },
    });
  } catch (error) {
    console.error("Check favorite error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check favorite status" },
      { status: 500 }
    );
  }
}
