import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import {
  purchaseGiftCard,
  calculateUserPrice,
  USD_TO_GHS_RATE,
  DEFAULT_GIFTCARD_MARKUP,
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
    const {
      productId,
      recipientEmail,
      recipientPhone,
      recipientName,
      isGift = false,
      senderMessage,
      paymentMethod,
      paymentReference,
    } = body;

    if (!productId || !recipientEmail || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userResult = await sql`
      SELECT wallet_balance FROM users WHERE id = ${userId}
    `;

    if (userResult.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const walletBalance = Number(userResult[0].wallet_balance);

    const productConfig = await sql`
      SELECT custom_markup_percentage, restricted_to_resellers
      FROM giftcard_product_configs
      WHERE reloadly_product_id = ${productId}
    `;

    const isRestricted = productConfig.length > 0 && productConfig[0].restricted_to_resellers;
    const customMarkup = productConfig.length > 0 ? Number(productConfig[0].custom_markup_percentage) : null;
    const markup = customMarkup ?? DEFAULT_GIFTCARD_MARKUP;

    const resellerCheck = await sql`
      SELECT id, commission_rate FROM reseller_profiles WHERE user_id = ${userId}
    `;
    const isReseller = resellerCheck.length > 0;
    const resellerId = isReseller ? resellerCheck[0].id : null;
    const resellerCommissionRate = isReseller ? Number(resellerCheck[0].commission_rate) : 0;

    if (isRestricted && !isReseller) {
      return NextResponse.json(
        { success: false, error: "This product is restricted to resellers only" },
        { status: 403 }
      );
    }

    const { getProducts } = await import("@/lib/reloadly");
    const productsResult = await getProducts();
    
    if (!productsResult.success || !productsResult.data) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch product information" },
        { status: 502 }
      );
    }

    const product = productsResult.data.find((p: any) => p.productId.toString() === productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const basePriceUSD = product.minRecipientDenomination;
    const amountGHS = calculateUserPrice(basePriceUSD, USD_TO_GHS_RATE, markup);
    const commissionAmount = isReseller ? (amountGHS * resellerCommissionRate / 100) : 0;

    if (paymentMethod === "wallet") {
      if (walletBalance < amountGHS) {
        return NextResponse.json(
          { success: false, error: "Insufficient wallet balance" },
          { status: 400 }
        );
      }

      await sql`
        UPDATE users SET wallet_balance = wallet_balance - ${amountGHS} WHERE id = ${userId}
      `;

      if (isReseller && resellerId) {
        await sql`
          UPDATE reseller_profiles 
          SET wallet_balance = wallet_balance + ${commissionAmount},
              total_commission_earned = total_commission_earned + ${commissionAmount}
          WHERE id = ${resellerId}
        `;
      }
    }

    const orderReference = `GC-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const orderResult = await sql`
      INSERT INTO giftcard_orders (
        user_id, reseller_id, reloadly_order_id, reloadly_product_id, product_name, brand_name,
        country_code, denomination, currency, recipient_email, recipient_phone, recipient_name,
        is_gift, sender_message, status, amount_ghs, reloadly_cost_usd, markup_percentage,
        commission_amount, commission_rate, payment_method, payment_reference
      ) VALUES (
        ${userId}, ${resellerId}, NULL, ${productId}, ${product.productName}, ${product.brandName},
        ${product.countryIsoName}, ${basePriceUSD}, ${product.currencyCode}, ${recipientEmail},
        ${recipientPhone || null}, ${recipientName || null}, ${isGift}, ${senderMessage || null},
        'processing', ${amountGHS}, ${basePriceUSD}, ${markup}, ${commissionAmount},
        ${resellerCommissionRate}, ${paymentMethod}, ${paymentReference || null}
      ) RETURNING id
    `;

    const orderId = orderResult[0].id;

    try {
      const reloadlyOrder = await purchaseGiftCard({
        productId,
        quantity: 1,
        recipientEmail,
        recipientPhone,
        customIdentifier: orderReference,
        senderName: isGift ? "Topchart User" : undefined,
        senderMessage: isGift ? senderMessage : undefined,
      });

      if (!reloadlyOrder.success || !reloadlyOrder.data) {
        await sql`
          UPDATE giftcard_orders 
          SET status = 'failed', error_message = ${reloadlyOrder.error || 'Failed to purchase from Reloadly'}
          WHERE id = ${orderId}
        `;

        if (paymentMethod === "wallet") {
          await sql`
            UPDATE users SET wallet_balance = wallet_balance + ${amountGHS} WHERE id = ${userId}
          `;

          if (isReseller && resellerId) {
            await sql`
              UPDATE reseller_profiles 
              SET wallet_balance = wallet_balance - ${commissionAmount},
                  total_commission_earned = total_commission_earned - ${commissionAmount}
              WHERE id = ${resellerId}
            `;
          }
        }

        return NextResponse.json(
          { success: false, error: reloadlyOrder.error || "Failed to purchase gift card" },
          { status: 502 }
        );
      }

      const orderData = reloadlyOrder.data;

      await sql`
        UPDATE giftcard_orders 
        SET reloadly_order_id = ${orderData.orderId.toString()},
            gift_card_code = ${orderData.cardCode || orderData.cardNumber || null},
            pin_code = ${orderData.cardPin || null},
            expiry_date = ${orderData.expiryDate ? new Date(orderData.expiryDate) : null},
            status = 'success'
        WHERE id = ${orderId}
      `;

      await sql`
        INSERT INTO transactions (user_id, type, amount, status, reference, description, payment_method, metadata)
        VALUES (${userId}, 'giftcard', ${amountGHS}, 'success', ${orderReference}, 
                ${`Gift card: ${product.productName} - ${product.brandName}`}, ${paymentMethod},
                ${JSON.stringify({ giftcard_order_id: orderId, product_name: product.productName, brand_name: product.brandName })})
      `;

      return NextResponse.json({
        success: true,
        data: {
          orderId,
          orderReference,
          product: {
            name: product.productName,
            brand: product.brandName,
            denomination: basePriceUSD,
            currency: product.currencyCode,
          },
          amount: amountGHS,
          status: "success",
          giftCardCode: orderData.cardCode || orderData.cardNumber,
          pinCode: orderData.cardPin,
          expiryDate: orderData.expiryDate,
        },
      });
    } catch (reloadlyError) {
      console.error("Reloadly purchase error:", reloadlyError);
      
      await sql`
        UPDATE giftcard_orders 
        SET status = 'failed', error_message = ${reloadlyError instanceof Error ? reloadlyError.message : 'Unknown error'}
        WHERE id = ${orderId}
      `;

      if (paymentMethod === "wallet") {
        await sql`
          UPDATE users SET wallet_balance = wallet_balance + ${amountGHS} WHERE id = ${userId}
        `;

        if (isReseller && resellerId) {
          await sql`
            UPDATE reseller_profiles 
            SET wallet_balance = wallet_balance - ${commissionAmount},
                total_commission_earned = total_commission_earned - ${commissionAmount}
            WHERE id = ${resellerId}
          `;
        }
      }

      return NextResponse.json(
        { success: false, error: "Failed to complete purchase" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Gift card purchase error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process purchase" },
      { status: 500 }
    );
  }
}
