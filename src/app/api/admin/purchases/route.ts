import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { confirmPurchase } from "@/lib/actions/transactions";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchPendingPurchases() {
  return sql`
    SELECT
      to_jsonb(t) AS tx,
      to_jsonb(u) AS user_data
    FROM transactions t
    LEFT JOIN users u ON u.id::text = COALESCE(
      to_jsonb(t)->>'user_id',
      to_jsonb(t)->>'userId'
    )
    WHERE LOWER(COALESCE(to_jsonb(t)->>'status', '')) = 'pending'
      AND LOWER(COALESCE(to_jsonb(t)->>'type', '')) IN ('data')
    ORDER BY COALESCE(
      (to_jsonb(t)->>'created_at')::timestamptz,
      (to_jsonb(t)->>'createdAt')::timestamptz
    ) DESC
  `;
}

export async function GET() {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    const rows = await fetchPendingPurchases();

    const readString = (raw: any, keys: string[]) => {
      for (const key of keys) {
        const value = raw?.[key];
        if (value !== null && value !== undefined) return String(value);
      }
      return "";
    };

    const readNumber = (raw: any, keys: string[], fallback = 0) => {
      for (const key of keys) {
        const value = raw?.[key];
        if (value !== null && value !== undefined && value !== "") return Number(value);
      }
      return fallback;
    };

    const readObject = (raw: any, keys: string[]) => {
      for (const key of keys) {
        const value = raw?.[key];
        if (value !== null && value !== undefined) return value;
      }
      return null;
    };

    const purchases = Array.isArray(rows)
      ? rows.map((r) => {
          const tx = r.tx ?? {};
          const userRaw = r.user_data ?? null;
          const metadata = readObject(tx, ["metadata", "metaData"]);
          const metadataPhone = metadata?.phoneNumber ?? metadata?.phone_number ?? null;
          const phoneNumber = readString(tx, ["phone_number", "phoneNumber"]) || (metadataPhone ? String(metadataPhone) : "");

          const userId = userRaw ? readString(userRaw, ["id"]) : "";
          const userEmail = userRaw ? readString(userRaw, ["email"]) : "";
          const userPhone = userRaw ? readString(userRaw, ["phone", "phone_number", "phoneNumber"]) : "";
          const userFirstName = userRaw ? readString(userRaw, ["first_name", "firstName"]) : "";
          const userLastName = userRaw ? readString(userRaw, ["last_name", "lastName"]) : "";
          const userWalletBalance = userRaw ? readNumber(userRaw, ["wallet_balance", "walletBalance"], 0) : 0;
          const hasUser = Boolean(userId || userEmail || userPhone);

          return {
            reference: readString(tx, ["reference"]),
            type: readString(tx, ["type"]).toLowerCase(),
            status: readString(tx, ["status"]).toLowerCase(),
            amount: readNumber(tx, ["amount"], 0),
            created_at: readString(tx, ["created_at", "createdAt"]),
            metadata: metadata ?? null,
            phoneNumber: phoneNumber || null,
            user: hasUser
              ? {
                  id: userId,
                  email: userEmail,
                  phone: userPhone,
                  first_name: userFirstName,
                  last_name: userLastName,
                  wallet_balance: userWalletBalance,
                }
              : null,
          };
        })
      : [];

    return NextResponse.json({ success: true, purchases });
  } catch (error) {
    console.error("Admin purchases GET error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    const body = await request.json();
    const reference = body?.reference;
    if (!reference) {
      return NextResponse.json({ success: false, error: "Missing reference" }, { status: 400 });
    }

    const result = await confirmPurchase(String(reference));
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "Failed to confirm" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin purchases POST error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

