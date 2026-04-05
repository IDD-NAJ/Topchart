import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * Webhook handler for Textverified SMS notifications
 * Textverified sends webhooks when SMS is received on a number
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get("x-textverified-signature");
    const webhookSecret = process.env.TEXTVERIFIED_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      // In production, verify the signature
      // const expectedSignature = createHmac('sha256', webhookSecret).update(body).digest('hex');
      // if (signature !== expectedSignature) {
      //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      // }
    }

    const body = await request.json();

    // Log webhook for debugging
    console.log("Textverified webhook received:", {
      type: body.event,
      order_id: body.order_id,
      timestamp: new Date().toISOString(),
    });

    // Handle different event types
    switch (body.event) {
      case "sms.received":
        return handleSMSReceived(body);
      
      case "order.completed":
        return handleOrderCompleted(body);
      
      case "order.expired":
        return handleOrderExpired(body);
      
      case "rental.extended":
        return handleRentalExtended(body);
      
      default:
        console.log(`Unhandled webhook event: ${body.event}`);
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSMSReceived(payload: any) {
  try {
    const { order_id, sms_id, from, message, received_at } = payload;

    // Find the number by order_id
    const numbers = await sql`
      SELECT id FROM verification_numbers
      WHERE textverified_order_id = ${order_id}
    `;

    if (numbers.length === 0) {
      console.error(`Number not found for order_id: ${order_id}`);
      return NextResponse.json({ error: "Number not found" }, { status: 404 });
    }

    const numberId = numbers[0].id;

    // Store SMS
    await sql`
      INSERT INTO verification_sms (
        number_id, from_number, message, textverified_sms_id, received_at
      ) VALUES (
        ${numberId}, ${from || "Unknown"}, ${message}, ${sms_id}, ${received_at || new Date().toISOString()}
      )
      ON CONFLICT (textverified_sms_id) DO NOTHING
    `;

    // If this looks like a verification code, mark the order as potentially completed
    const looksLikeVerificationCode = /\d{4,8}/.test(message) || 
      /verification|verify|code|otp|confirm/i.test(message);

    if (looksLikeVerificationCode) {
      // Optionally auto-mark as completed for one-time purchases
      await sql`
        UPDATE verification_numbers
        SET 
          status = CASE 
            WHEN type = 'onetime' THEN 'completed'
            ELSE status
          END,
          completed_at = CASE 
            WHEN type = 'onetime' THEN NOW()
            ELSE completed_at
          END,
          updated_at = NOW()
        WHERE id = ${numberId} AND type = 'onetime'
      `;
    }

    return NextResponse.json({ 
      success: true, 
      data: { number_id: numberId, sms_id } 
    });
  } catch (error) {
    console.error("SMS received handler error:", error);
    return NextResponse.json({ error: "Failed to process SMS" }, { status: 500 });
  }
}

async function handleOrderCompleted(payload: any) {
  try {
    const { order_id } = payload;

    await sql`
      UPDATE verification_numbers
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE textverified_order_id = ${order_id} AND status = 'active'
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order completed handler error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

async function handleOrderExpired(payload: any) {
  try {
    const { order_id } = payload;

    await sql`
      UPDATE verification_numbers
      SET status = 'expired', updated_at = NOW()
      WHERE textverified_order_id = ${order_id} AND status = 'active'
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order expired handler error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

async function handleRentalExtended(payload: any) {
  try {
    const { order_id, new_expires_at, extension_hours } = payload;

    // Find the number
    const numbers = await sql`
      SELECT id, expires_at as current_expires_at
      FROM verification_numbers
      WHERE textverified_order_id = ${order_id}
    `;

    if (numbers.length === 0) {
      return NextResponse.json({ error: "Number not found" }, { status: 404 });
    }

    const numberId = numbers[0].id;

    // Update expiration
    await sql`
      UPDATE verification_numbers
      SET 
        expires_at = ${new_expires_at},
        rental_duration_hours = rental_duration_hours + ${extension_hours || 0},
        updated_at = NOW()
      WHERE id = ${numberId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Rental extended handler error:", error);
    return NextResponse.json({ error: "Failed to update rental" }, { status: 500 });
  }
}
