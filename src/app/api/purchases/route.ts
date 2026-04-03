import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, phone, networkId, networkName, planName, planSize, planPrice } = body;

    if (!userId || !amount || !phone || !networkId || !planName || !planSize) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check user balance
    const userResult = await sql`
      SELECT wallet_balance FROM users WHERE id = ${userId}
    `;

    if (userResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userBalance = Number(userResult[0].wallet_balance);
    if (planPrice > userBalance) {
      return NextResponse.json(
        { success: false, error: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    const inferredType =
      typeof planName === "string" && planName.toLowerCase().includes("airtime")
        ? "AIRTIME"
        : "DATA";

    // Create transaction
    const reference = `${inferredType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Ensure wallet exists
    let walletId: string;
    const existingWallet = await sql`
      SELECT id FROM wallets WHERE "userId" = ${String(userId)} LIMIT 1
    `;
    if (existingWallet.length > 0) {
      walletId = existingWallet[0].id as string;
    } else {
      walletId = `WALLET_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`.toUpperCase();
      await sql`
        INSERT INTO wallets (
          id,
          "userId",
          currency,
          status,
          "availableBalance",
          "pendingBalance",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${walletId},
          ${String(userId)},
          'GHS',
          'ACTIVE',
          0,
          0,
          NOW(),
          NOW()
        )
      `;
    }

    await sql`
      INSERT INTO transactions (
        "id",
        "type",
        "status",
        "amount",
        "currency",
        "walletId",
        user_id,
        "reference",
        "source",
        "metadata",
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        ${inferredType},
        'PENDING',
        ${planPrice},
        'GHS',
        ${walletId},
        ${String(userId)},
        ${reference},
        'WALLET',
        ${JSON.stringify({
          description: `${inferredType === "AIRTIME" ? "Airtime" : "Data bundle"} purchase: ${planName} ${planSize}`,
          networkId,
          network: networkName,
          phoneNumber: phone,
          plan: `${planName} ${planSize}`,
        })}::jsonb,
        NOW(),
        NOW()
      )
    `;

    // Deduct user wallet balance immediately while status is PENDING
    await sql`
      UPDATE users 
      SET wallet_balance = wallet_balance - ${planPrice}
      WHERE id = ${userId}
    `;

    return NextResponse.json(
      { 
        success: true, 
        message: "Purchase submitted for processing",
        transaction: {
          reference,
          amount: planPrice,
          planName: `${planName} ${planSize}`,
          network: networkName
        }
      }
    );
  } catch (error) {
    console.error("Purchase data error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
