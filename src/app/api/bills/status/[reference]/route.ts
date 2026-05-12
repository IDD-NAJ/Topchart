import { NextRequest, NextResponse } from "next/server";
import { billService } from "@/lib/bills/service";
import { requireAuth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ reference: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { reference } = await context.params;

    // Check database first
    const [dbRecord] = await sql`
      SELECT * FROM bill_transactions 
      WHERE reference = ${reference} AND user_id = ${session.id}
    `;

    if (!dbRecord) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    // If already completed or failed, return from DB
    if (dbRecord.status === "success" || dbRecord.status === "failed") {
      return NextResponse.json({
        success: true,
        data: {
          status: dbRecord.status,
          provider: dbRecord.provider,
          service: dbRecord.service_id,
          amount: dbRecord.amount,
          reference: dbRecord.reference,
          transactionId: dbRecord.provider_reference,
          customerName: dbRecord.customer_name,
        },
      });
    }

    // Check status from provider
    const result = await billService.checkStatus(reference);

    // Update database with new status
    if (result.status !== dbRecord.status) {
      await sql`
        UPDATE bill_transactions 
        SET 
          status = ${result.status},
          provider_reference = ${result.transactionId || dbRecord.provider_reference},
          customer_name = ${result.customerName || dbRecord.customer_name},
          raw_response = ${JSON.stringify(result.raw)},
          updated_at = NOW(),
          completed_at = ${result.status === "success" || result.status === "failed" ? new Date().toISOString() : null}
        WHERE reference = ${reference}
      `;
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Failed to check bill status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Status check failed",
      },
      { status: 500 }
    );
  }
}
