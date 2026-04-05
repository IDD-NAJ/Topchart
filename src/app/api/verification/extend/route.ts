import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { extendRental, calculateRentalPrice } from "@/lib/textverified";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify session and get user with wallet
    const sessions = await sql`
      SELECT s.user_id, u.wallet_balance
      FROM auth_sessions s
      JOIN users u ON s.user_id::text = u.id::text
      WHERE s.token = ${sessionToken}
        AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Session expired" },
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

    const { numberId, extensionHours } = body;

    if (!numberId || !extensionHours) {
      return NextResponse.json(
        { success: false, error: "Number ID and extension hours are required" },
        { status: 400 }
      );
    }

    // Valid extension durations
    const validDurations = [1, 6, 12, 24, 72, 168];
    if (!validDurations.includes(extensionHours)) {
      return NextResponse.json(
        { success: false, error: "Invalid extension duration. Choose from: 1, 6, 12, 24, 72, or 168 hours" },
        { status: 400 }
      );
    }

    // Get number details
    const numbers = await sql`
      SELECT 
        vn.id, vn.textverified_order_id, vn.status, vn.expires_at,
        vs.base_cost, vs.markup_percentage, vs.rental_multiplier, vs.name as service_name
      FROM verification_numbers vn
      JOIN verification_services vs ON vn.service_id = vs.id
      WHERE vn.id = ${numberId} AND vn.user_id = ${userId} AND vn.type = 'rental'
    `;

    if (numbers.length === 0) {
      return NextResponse.json(
        { success: false, error: "Rental number not found" },
        { status: 404 }
      );
    }

    const number = numbers[0];

    if (number.status !== "active") {
      return NextResponse.json(
        { success: false, error: "Rental is not active" },
        { status: 400 }
      );
    }

    // Calculate extension price
    const extensionPrice = calculateRentalPrice(
      Number(number.base_cost),
      Number(number.markup_percentage),
      Number(number.rental_multiplier),
      extensionHours
    );

    // Check wallet balance
    const walletBalance = Number(user.wallet_balance) || 0;
    if (walletBalance < extensionPrice) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Insufficient wallet balance",
          data: { required: extensionPrice, balance: walletBalance }
        },
        { status: 400 }
      );
    }

    // Extend with Textverified
    const extendResult = await extendRental(number.textverified_order_id, extensionHours);

    if (!extendResult.success || !extendResult.data) {
      return NextResponse.json(
        { success: false, error: extendResult.error || "Failed to extend rental" },
        { status: 500 }
      );
    }

    const newExpiresAt = new Date(extendResult.data.new_expires_at);

    // Deduct from wallet and update records
    try {
      await sql`
        UPDATE users 
        SET wallet_balance = wallet_balance - ${extensionPrice}
        WHERE id = ${userId}
      `;

      await sql`
        UPDATE verification_numbers
        SET 
          expires_at = ${newExpiresAt.toISOString()},
          rental_duration_hours = rental_duration_hours + ${extensionHours},
          updated_at = NOW()
        WHERE id = ${numberId}
      `;

      // Record extension
      await sql`
        INSERT INTO verification_rentals (
          number_id, extension_hours, extension_price, new_expires_at
        ) VALUES (
          ${numberId}, ${extensionHours}, ${extensionPrice}, ${newExpiresAt.toISOString()}
        )
      `;

      // Create transaction record
      const reference = `VER-EXT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await sql`
        INSERT INTO transactions (
          user_id, type, amount, status, reference,
          description, verification_number_id, created_at
        ) VALUES (
          ${userId}, 'verification_extension', ${extensionPrice}, 'success', ${reference},
          ${`${number.service_name} rental extension (+${extensionHours}h)`}, ${numberId}, NOW()
        )
      `;

      return NextResponse.json({
        success: true,
        data: {
          number_id: numberId,
          extension_hours: extensionHours,
          extension_price: extensionPrice,
          new_expires_at: newExpiresAt.toISOString(),
          reference,
        },
      });
    } catch (dbError) {
      console.error("Database error during extension:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to complete extension" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Extend rental error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to extend rental" },
      { status: 500 }
    );
  }
}
