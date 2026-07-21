export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { billService } from "@/lib/bills/service";
import { requireAuth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { z } from "zod";

const paySchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  amount: z.number().positive("Amount must be positive"),
  variationCode: z.string().optional(),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = paySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { serviceId, accountNumber, amount, variationCode, phoneNumber } = validation.data;

    // Generate unique reference
    const reference = `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Process payment through service
    const result = await billService.pay({
      serviceId,
      accountNumber,
      amount,
      variationCode,
      phoneNumber,
      reference,
    });

    // Store transaction in database
    try {
      await sql`
        INSERT INTO bill_transactions (
          user_id,
          provider,
          service_id,
          service_name,
          category,
          account_number,
          customer_name,
          amount,
          fee,
          total_amount,
          reference,
          provider_reference,
          variation_code,
          phone_number,
          status,
          raw_response,
          created_at
        ) VALUES (
          ${session.id},
          ${result.provider},
          ${result.service},
          ${result.service},
          ${'electricity'},
          ${accountNumber},
          ${result.customerName || null},
          ${amount},
          ${0},
          ${amount},
          ${reference},
          ${result.transactionId || null},
          ${variationCode || null},
          ${phoneNumber},
          ${result.status},
          ${JSON.stringify(result.raw)},
          NOW()
        )
      `;
    } catch (dbError) {
      console.error("Failed to store bill transaction:", dbError);
      // Don't fail the request if DB storage fails
    }

    return NextResponse.json({
      success: result.status === "success" || result.status === "pending",
      data: result,
    });
  } catch (error) {
    console.error("Failed to process bill payment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Payment failed",
      },
      { status: 500 }
    );
  }
}
