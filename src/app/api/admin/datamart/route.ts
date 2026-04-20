import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getBalance,
  getUsageStats,
  getDeliveryTracker,
  getWebhookStatus,
  configureWebhook,
  testWebhook,
  deleteWebhook,
  getTransactions,
  getWithdrawalLimits,
  getWithdrawalStatus,
  listWithdrawals,
  createWithdrawal,
} from "@/lib/datamart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json(
      { success: false, error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  try {
    switch (query) {
      case "balance": {
        const result = await getBalance();
        return NextResponse.json(
          result.success
            ? { success: true, data: result.data }
            : { success: false, error: result.error }
        );
      }
      case "usage": {
        const result = await getUsageStats();
        return NextResponse.json(
          result.success
            ? { success: true, data: result.data }
            : { success: false, error: result.error }
        );
      }
      case "delivery-tracker": {
        const result = await getDeliveryTracker();
        return NextResponse.json(
          result.success
            ? { success: true, data: result.data }
            : { success: false, error: result.error }
        );
      }
      case "webhook": {
        const result = await getWebhookStatus();
        return NextResponse.json(
          result.success
            ? { success: true, data: result.data }
            : { success: false, error: result.error }
        );
      }
      case "transactions": {
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "20", 10);
        const result = await getTransactions({ page, limit });
        return NextResponse.json(
          result.success
            ? { success: true, data: result.data }
            : { success: false, error: result.error }
        );
      }
      case "withdrawal-limits": {
        const result = await getWithdrawalLimits();
        return NextResponse.json(
          result.success
            ? { success: true, data: result.data }
            : { success: false, error: result.error }
        );
      }
      case "withdrawals": {
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "20", 10);
        const status = searchParams.get("status") || undefined;
        const result = await listWithdrawals({ page, limit, status });
        return NextResponse.json(
          result.success
            ? { success: true, data: result.data }
            : { success: false, error: result.error }
        );
      }
      case "withdrawal-status": {
        const ref = searchParams.get("ref");
        if (!ref) {
          return NextResponse.json({ success: false, error: "Missing ref parameter" }, { status: 400 });
        }
        const result = await getWithdrawalStatus(ref);
        return NextResponse.json(
          result.success
            ? { success: true, data: result.data }
            : { success: false, error: result.error }
        );
      }
      default:
        return NextResponse.json(
          { success: false, error: "Invalid query. Use: balance, usage, delivery-tracker, webhook, transactions, withdrawal-limits, withdrawals, withdrawal-status" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("DataMart admin API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json(
      { success: false, error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    switch (action) {
      case "configure-webhook": {
        const body = await request.json();
        if (!body.url) {
          return NextResponse.json(
            { success: false, error: "Webhook URL is required" },
            { status: 400 }
          );
        }
        const result = await configureWebhook(body.url, body.events);
        return NextResponse.json(
          result.success
            ? { success: true, data: result.data }
            : { success: false, error: result.error }
        );
      }
      case "test-webhook": {
        const result = await testWebhook();
        return NextResponse.json(
          result.success
            ? { success: true, data: result.data }
            : { success: false, error: result.error }
        );
      }
      case "delete-webhook": {
        const result = await deleteWebhook();
        return NextResponse.json(
          result.success
            ? { success: true, data: result.data }
            : { success: false, error: result.error }
        );
      }
      case "create-withdrawal": {
        const body = await request.json();
        if (!body.amount || !body.phoneNumber || !body.network) {
          return NextResponse.json(
            { success: false, error: "Missing required fields: amount, phoneNumber, network" },
            { status: 400 }
          );
        }
        const idempotencyKey = body.idempotencyKey || `WD_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
        const result = await createWithdrawal({
          amount: Number(body.amount),
          phoneNumber: body.phoneNumber,
          network: body.network,
          recipientName: body.recipientName,
          clientRef: body.clientRef,
          idempotencyKey,
        });
        return NextResponse.json(
          result.success
            ? { success: true, data: result.data }
            : { success: false, error: result.error },
          result.success ? { status: 201 } : undefined
        );
      }
      default:
        return NextResponse.json(
          { success: false, error: "Invalid action. Use: configure-webhook, test-webhook, delete-webhook, create-withdrawal" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("DataMart admin API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
