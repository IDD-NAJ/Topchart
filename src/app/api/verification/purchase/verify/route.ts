import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { sql } from "@/lib/db";
import { verifyPaystackTransaction } from "@/lib/paystack";
import {
  purchaseSTR,
  purchaseLTR,
  mapCategoryByName,
  type LTRDuration,
} from "@/lib/pvadeals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ success: false, error: "Reference is required" }, { status: 400 });
    }

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

    // Look up the pending transaction
    const txRows = await sql`
      SELECT id, status, amount, user_id, metadata, type
      FROM transactions
      WHERE reference = ${reference}
    `;

    if (txRows.length === 0) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    const tx = txRows[0] as any;

    if (tx.user_id !== userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // Already completed — return cached number from metadata
    if (tx.status === "success") {
      const meta = tx.metadata || {};
      return NextResponse.json({
        success: true,
        data: {
          status: "success",
          number: meta.number ?? null,
          number_id: meta.number_id ?? null,
          expires_at: null,
          price: Number(meta.base_price ?? tx.amount),
          reference,
          type: meta.type ?? "STR",
          ltr_days: meta.ltrDays ?? null,
          already_completed: true,
        },
      });
    }

    // Already failed
    if (tx.status === "failed") {
      return NextResponse.json({
        success: false,
        data: { status: "failed", reference },
        error: "Payment was not completed",
      });
    }

    // Verify with Paystack
    const verifyResult = await verifyPaystackTransaction(reference);

    if (!verifyResult.success) {
      return NextResponse.json({ success: false, error: verifyResult.error }, { status: 400 });
    }

    const paystackData = verifyResult.data!;

    if (paystackData.status === "success") {
      // Extract stored purchase intent from metadata
      const meta = tx.metadata || {};
      const { pvadealsServiceId, type, ltrDays } = meta;

      if (!pvadealsServiceId || !type) {
        return NextResponse.json(
          { success: false, error: "Purchase intent missing from transaction metadata" },
          { status: 500 }
        );
      }

      const areaCode: string | undefined = meta.areaCode || undefined;

      // Execute PVADeals purchase
      let pvaData: any;
      if (type === "STR") {
        const result = await purchaseSTR(pvadealsServiceId, areaCode);
        if (!result.success || !result.data) {
          // Paystack payment succeeded but PVADeals failed — refund to wallet
          const refundAmount = Number(meta.base_price ?? tx.amount);
          await sql`
            UPDATE users
            SET wallet_balance = wallet_balance + ${refundAmount}
            WHERE id = ${userId}
          `;
          await sql`
            UPDATE transactions
            SET status = 'refunded',
                metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                  refunded_at: new Date().toISOString(),
                  refund_reason: result.error || "Provider purchase failed",
                  refund_amount: refundAmount,
                })}::jsonb,
                updated_at = NOW()
            WHERE reference = ${reference}
          `;
          return NextResponse.json({
            success: false,
            refunded: true,
            refund_amount: refundAmount,
            error: result.error || "Failed to purchase number from provider",
          }, { status: 502 });
        }
        pvaData = result.data.requests[0];
      } else {
        const result = await purchaseLTR(pvadealsServiceId, (ltrDays ?? 3) as LTRDuration, areaCode);
        if (!result.success || !result.data) {
          const refundAmount = Number(meta.base_price ?? tx.amount);
          await sql`
            UPDATE users
            SET wallet_balance = wallet_balance + ${refundAmount}
            WHERE id = ${userId}
          `;
          await sql`
            UPDATE transactions
            SET status = 'refunded',
                metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
                  refunded_at: new Date().toISOString(),
                  refund_reason: result.error || "Provider purchase failed",
                  refund_amount: refundAmount,
                })}::jsonb,
                updated_at = NOW()
            WHERE reference = ${reference}
          `;
          return NextResponse.json({
            success: false,
            refunded: true,
            refund_amount: refundAmount,
            error: result.error || "Failed to purchase LTR number from provider",
          }, { status: 502 });
        }
        pvaData = result.data;
      }

      const numberId = uuidv4();
      const expiresAt = new Date(pvaData.endTime);
      const basePrice = Number(meta.base_price ?? tx.amount);
      const category = mapCategoryByName(meta.service_name ?? "");

      // Ensure verification_numbers exists with the full schema
      await sql`
        CREATE TABLE IF NOT EXISTS verification_numbers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          service_id UUID,
          number VARCHAR(20) NOT NULL,
          type VARCHAR(20) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          pvadeals_request_id VARCHAR(100) UNIQUE,
          ltr_duration_days INTEGER,
          allow_flag BOOLEAN DEFAULT TRUE,
          allow_reuse BOOLEAN DEFAULT FALSE,
          auto_renew BOOLEAN DEFAULT FALSE,
          purchase_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
          rental_duration_hours INTEGER DEFAULT 0,
          expires_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS pvadeals_request_id VARCHAR(100)`;
      await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2) DEFAULT 0`;
      await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS ltr_duration_days INTEGER`;
      await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS rental_duration_hours INTEGER DEFAULT 0`;
      await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS allow_flag BOOLEAN DEFAULT TRUE`;
      await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS allow_reuse BOOLEAN DEFAULT FALSE`;
      await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT FALSE`;
      await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE`;
      await sql`ALTER TABLE verification_numbers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;
      await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;
      await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'GHS'`;
      await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fees DECIMAL(12,2) DEFAULT 0`;
      await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS metadata JSONB`;
      await sql`
        DO $$ BEGIN
          ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
        EXCEPTION WHEN others THEN NULL; END $$
      `;

      // Upsert service record
      try {
        await sql`
          INSERT INTO verification_services (
            pvadeals_service_id, name, category, is_active, markup_percentage,
            str_price, ltr3_price, ltr7_price, ltr14_price, ltr30_price,
            created_at, updated_at
          ) VALUES (
            ${pvadealsServiceId}, ${meta.service_name ?? pvadealsServiceId}, ${category},
            true, 0, 0, 0, 0, 0, 0, NOW(), NOW()
          )
          ON CONFLICT (pvadeals_service_id) DO NOTHING
        `;
      } catch {}

      let serviceDbId: string | null = null;
      try {
        const svcRows = await sql`
          SELECT id FROM verification_services WHERE pvadeals_service_id = ${pvadealsServiceId}
        `;
        serviceDbId = svcRows.length > 0 ? (svcRows[0] as any).id : null;
      } catch {}

      // Insert verification number
      await sql`
        INSERT INTO verification_numbers (
          id, user_id, service_id, number, type, status,
          pvadeals_request_id, purchase_price,
          ltr_duration_days, rental_duration_hours,
          allow_flag, allow_reuse, auto_renew,
          expires_at, created_at, updated_at
        ) VALUES (
          ${numberId}, ${userId}, ${serviceDbId}, ${pvaData.number}, ${type}, 'active',
          ${pvaData._id}, ${basePrice},
          ${type === "LTR" ? (ltrDays ?? 3) : null},
          ${type === "LTR" ? (ltrDays ?? 3) * 24 : 0},
          ${pvaData.allowFlag ?? true}, ${pvaData.allowReuse ?? false}, ${pvaData.autoRenewEnable ?? false},
          ${expiresAt.toISOString()}, NOW(), NOW()
        )
      `;

      // Mark transaction success + store pvadeals_request_id in metadata
      await sql`
        UPDATE transactions
        SET status = 'success',
            metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({
              pvadeals_request_id: pvaData._id,
              number: pvaData.number,
              number_id: numberId,
              verified_at: new Date().toISOString(),
              paystack_id: paystackData.id,
              paid_at: paystackData.paid_at,
              channel: paystackData.channel,
            })}::jsonb,
            payment_channel = ${paystackData.channel ?? null},
            paid_at = ${paystackData.paid_at ? new Date(paystackData.paid_at).toISOString() : null},
            updated_at = NOW()
        WHERE reference = ${reference}
      `;

      return NextResponse.json({
        success: true,
        data: {
          status: "success",
          number: pvaData.number,
          number_id: numberId,
          expires_at: expiresAt.toISOString(),
          price: basePrice,
          reference,
          type,
          ltr_days: type === "LTR" ? ltrDays : null,
          allow_flag: pvaData.allowFlag,
          allow_reuse: pvaData.allowReuse,
        },
      });
    } else if (paystackData.status === "failed" || paystackData.status === "abandoned") {
      await sql`
        UPDATE transactions SET status = 'failed', updated_at = NOW()
        WHERE reference = ${reference}
      `;
      return NextResponse.json({
        success: false,
        data: { status: paystackData.status, reference },
        error: paystackData.gateway_response || "Payment was not successful",
      });
    } else {
      return NextResponse.json({
        success: true,
        data: { status: "pending", reference },
      });
    }
  } catch (error) {
    console.error("Verification purchase verify error:", error);
    return NextResponse.json({ success: false, error: "Failed to verify payment" }, { status: 500 });
  }
}
