import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ success: false, error: "Invalid quantity" }, { status: 400 });
    }

    // 1. Fetch Product
    const dbParams = await sql`SELECT id, price, is_active FROM esim_products WHERE id = ${productId}`;
    if (dbParams.length === 0) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }
    const product = dbParams[0];
    if (!product.is_active) {
      return NextResponse.json({ success: false, error: "Product is no longer active" }, { status: 400 });
    }

    const totalAmount = Number(product.price) * qty;

    // 2. Fetch User Wallet
    const userRows = await sql`SELECT email, wallet_balance FROM users WHERE id = ${user.id}::uuid`;
    if (userRows.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const walletBalance = parseFloat(userRows[0].wallet_balance) || 0;

    if (walletBalance < totalAmount) {
      return NextResponse.json(
        { success: false, error: "Insufficient wallet balance. Please top up your account." },
        { status: 400 }
      );
    }

    // 3. Process Transaction
    await sql`BEGIN`;

    try {
      // Deduct balance
      await sql`
        UPDATE users SET wallet_balance = wallet_balance - ${totalAmount} WHERE id = ${user.id}::uuid
      `;

      // Log transaction (for financial audit)
      const txId = crypto.randomUUID();
      await sql`
        INSERT INTO transactions (id, user_id, type, amount, status, description, payment_method, currency, created_at, updated_at)
        VALUES (
          ${txId}, 
          ${user.id}::uuid, 
          'travel_esim', 
          ${totalAmount}, 
          'success', 
          'Purchased Travel Data eSIM',
          'WALLET', 
          'GHS',
          NOW(), 
          NOW()
        )
      `;

      // Create internal order
      const newOrder = await sql`
        INSERT INTO esim_orders (user_id, product_id, quantity, total_amount, status)
        VALUES (${user.id}::uuid, ${productId}, ${qty}, ${totalAmount}, 'pending')
        RETURNING id
      `;

      await sql`COMMIT`;

      return NextResponse.json({
        success: true,
        data: {
          orderId: newOrder[0].id,
          message: "Order placed successfully. Admin will issue your eSIM shortly."
        },
      });
    } catch (txError) {
      await sql`ROLLBACK`;
      throw txError;
    }
  } catch (error) {
    console.error("Travel eSIM purchase error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process Travel Data eSIM purchase" },
      { status: 500 }
    );
  }
}
