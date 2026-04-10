import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import {
  purchaseGiftCard,
} from "@/lib/reloadly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const { purchases, paymentMethod } = body;

    if (!purchases || !Array.isArray(purchases) || purchases.length === 0) {
      return NextResponse.json(
        { success: false, error: "No purchases provided" },
        { status: 400 }
      );
    }

    if (!paymentMethod || !['wallet', 'paystack'].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: "Invalid payment method" },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];
    let totalAmount = 0;

    for (const purchase of purchases) {
      const {
        productId,
        recipientEmail,
        recipientPhone,
        recipientName,
        isGift,
        senderMessage,
        quantity,
      } = purchase;

      if (!productId || !recipientEmail) {
        errors.push({
          productId,
          error: "Missing required fields (productId, recipientEmail)",
        });
        continue;
      }

      try {
        if (paymentMethod === 'wallet') {
          const wallet = await sql`
            SELECT balance FROM wallets WHERE user_id = ${userId}
          `;

          if (wallet.length === 0) {
            throw new Error("Wallet not found");
          }

          const productPrice = await sql`
            SELECT price_ghs FROM giftcard_product_configs 
            WHERE reloadly_product_id = ${productId}
          `;

          const price = productPrice.length > 0 ? Number(productPrice[0].price_ghs) : 0;
          const orderTotal = price * (quantity || 1);

          if (wallet[0].balance < orderTotal) {
            throw new Error("Insufficient wallet balance");
          }

          await sql`
            UPDATE wallets 
            SET balance = balance - ${orderTotal}
            WHERE user_id = ${userId}
          `;
        }

        const reloadlyResult = await purchaseGiftCard({
          productId,
          quantity: quantity || 1,
          recipientEmail,
          recipientPhone,
          customIdentifier: `GIFT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          senderName: isGift ? recipientName : undefined,
          senderMessage: isGift ? senderMessage : undefined,
        });

        if (!reloadlyResult.success || !reloadlyResult.data) {
          throw new Error(reloadlyResult.error || "Failed to purchase gift card");
        }

        const orderData = reloadlyResult.data;

        await sql`
          INSERT INTO giftcard_orders (
            user_id,
            reloadly_order_id,
            reloadly_product_id,
            product_name,
            brand_name,
            country_code,
            denomination,
            currency,
            recipient_email,
            recipient_phone,
            recipient_name,
            is_gift,
            sender_message,
            gift_card_code,
            pin_code,
            status,
            amount_ghs,
            reloadly_cost_usd,
            payment_method,
            metadata
          ) VALUES (
            ${userId},
            ${orderData.orderId?.toString()},
            ${productId},
            ${orderData.product?.productName || 'Unknown'},
            ${orderData.product?.brandName || 'Unknown'},
            ${orderData.product?.countryIsoName || 'US'},
            ${orderData.unitPrice || 0},
            ${orderData.currencyCode || 'USD'},
            ${recipientEmail},
            ${recipientPhone || null},
            ${recipientName || null},
            ${isGift || false},
            ${senderMessage || null},
            ${orderData.cardNumber || null},
            ${orderData.cardPin || null},
            'success',
            ${orderData.totalAmount || 0},
            ${orderData.fee || 0},
            ${paymentMethod},
            ${JSON.stringify(orderData)}
          )
        `;

        results.push({
          productId,
          orderId: orderData.orderId,
          status: 'success',
          giftCardCode: orderData.cardNumber,
        });

        totalAmount += orderData.totalAmount || 0;
      } catch (error) {
        console.error(`Bulk purchase error for product ${productId}:`, error);
        errors.push({
          productId,
          error: error instanceof Error ? error.message : "Purchase failed",
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        errors,
        totalAmount,
        successful: results.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    console.error("Bulk purchase error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process bulk purchase" },
      { status: 500 }
    );
  }
}
