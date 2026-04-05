import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { sql } from "@/lib/db";
import { 
  purchaseNumber, 
  calculatePrice, 
  calculateRentalPrice 
} from "@/lib/textverified";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Verify session and get user with wallet
    const sessions = await sql`
      SELECT s.user_id, u.email, u.first_name, u.last_name, u.wallet_balance
      FROM auth_sessions s
      JOIN users u ON s.user_id::text = u.id::text
      WHERE s.token = ${sessionToken}
        AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Session expired - Please log in again" },
        { status: 401 }
      );
    }

    const user = sessions[0];
    const userId = user.user_id;

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { serviceId, type = "onetime", durationHours = 24 } = body;

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: "Service ID is required" },
        { status: 400 }
      );
    }

    // Get service details
    const services = await sql`
      SELECT id, textverified_service_id, name, base_cost, markup_percentage, rental_multiplier
      FROM verification_services
      WHERE id = ${serviceId} AND is_active = true
    `;

    if (services.length === 0) {
      return NextResponse.json(
        { success: false, error: "Service not found or inactive" },
        { status: 404 }
      );
    }

    const service = services[0];

    // Calculate price
    let price: number;
    if (type === "rental") {
      price = calculateRentalPrice(
        Number(service.base_cost),
        Number(service.markup_percentage),
        Number(service.rental_multiplier),
        durationHours
      );
    } else {
      price = calculatePrice(
        Number(service.base_cost),
        Number(service.markup_percentage)
      );
    }

    // Check wallet balance
    const walletBalance = Number(user.wallet_balance) || 0;
    if (walletBalance < price) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Insufficient wallet balance", 
          data: { 
            required: price, 
            balance: walletBalance,
            shortfall: price - walletBalance 
          }
        },
        { status: 400 }
      );
    }

    // Purchase from Textverified
    const textverifiedResult = await purchaseNumber(
      service.textverified_service_id,
      type,
      durationHours
    );

    if (!textverifiedResult.success || !textverifiedResult.data) {
      return NextResponse.json(
        { success: false, error: textverifiedResult.error || "Failed to purchase number from provider" },
        { status: 500 }
      );
    }

    const tvData = textverifiedResult.data;

    // Generate transaction reference
    const reference = `VER-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Calculate expiration
    const expiresAt = type === "rental" 
      ? new Date(Date.now() + durationHours * 60 * 60 * 1000)
      : new Date(Date.now() + 20 * 60 * 1000); // 20 minutes for onetime

    // Start transaction - deduct from wallet and create number record
    try {
      // Deduct from wallet
      await sql`
        UPDATE users 
        SET wallet_balance = wallet_balance - ${price}
        WHERE id = ${userId}
      `;

      // Create number record
      const numberId = uuidv4();
      await sql`
        INSERT INTO verification_numbers (
          id, user_id, service_id, number, type, status,
          textverified_target_id, textverified_order_id,
          purchase_price, rental_duration_hours, expires_at, created_at, updated_at
        ) VALUES (
          ${numberId}, ${userId}, ${serviceId}, ${tvData.number}, ${type}, 'active',
          ${tvData.target_id || null}, ${tvData.order_id},
          ${price}, ${type === "rental" ? durationHours : 0}, ${expiresAt.toISOString()}, NOW(), NOW()
        )
      `;

      // Create transaction record
      const transactionId = uuidv4();
      const transactionType = type === "rental" ? "verification_rental" : "verification_onetime";
      
      await sql`
        INSERT INTO transactions (
          id, user_id, type, amount, status, reference,
          description, verification_number_id, created_at
        ) VALUES (
          ${transactionId}, ${userId}, ${transactionType}, ${price}, 'success', ${reference},
          ${`${service.name} ${type} verification number`}, ${numberId}, NOW()
        )
      `;

      return NextResponse.json({
        success: true,
        data: {
          number_id: numberId,
          number: tvData.number,
          service_name: service.name,
          type,
          price,
          expires_at: expiresAt.toISOString(),
          reference,
        },
      });
    } catch (dbError) {
      // Attempt to cancel the Textverified order if DB transaction fails
      try {
        const { cancelOrder } = await import("@/lib/textverified");
        await cancelOrder(tvData.order_id);
      } catch (cancelError) {
        console.error("Failed to cancel Textverified order after DB error:", cancelError);
      }

      console.error("Database transaction error:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to complete purchase. Please contact support." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Verification purchase error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process purchase" },
      { status: 500 }
    );
  }
}
