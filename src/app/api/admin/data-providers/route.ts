import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getAllProviders,
  getProviderByName,
  updateProviderConfig,
  addProvider,
  deleteProvider,
  invalidateCache,
  type ProviderConfig,
  type ProviderName,
} from "@/lib/providers/config";

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

  try {
    const providers = await getAllProviders();
    return NextResponse.json({
      success: true,
      data: providers,
    });
  } catch (error) {
    console.error("[Data Providers API] Error fetching providers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch providers" },
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

  try {
    const body = await request.json();
    const { providerName, providerType = "data_bundle", isEnabled = true, isPrimary = false, isFallback = false, priority = 0, config = {} } = body;

    if (!providerName || !["datamart", "hubnet"].includes(providerName)) {
      return NextResponse.json(
        { success: false, error: "Invalid provider name. Must be 'datamart' or 'hubnet'" },
        { status: 400 }
      );
    }

    const newProvider = await addProvider({
      providerName,
      providerType,
      isEnabled,
      isPrimary,
      isFallback,
      priority,
      config,
    });

    if (!newProvider) {
      return NextResponse.json(
        { success: false, error: "Failed to add provider" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newProvider,
      message: "Provider added successfully",
    });
  } catch (error) {
    console.error("[Data Providers API] Error adding provider:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add provider" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json(
      { success: false, error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  try {
    const body = await request.json();
    const { providerName, updates } = body;

    if (!providerName || !["datamart", "hubnet"].includes(providerName)) {
      return NextResponse.json(
        { success: false, error: "Invalid provider name. Must be 'datamart' or 'hubnet'" },
        { status: 400 }
      );
    }

    const updatedProvider = await updateProviderConfig(providerName as ProviderName, updates);

    if (!updatedProvider) {
      return NextResponse.json(
        { success: false, error: "Failed to update provider" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedProvider,
      message: "Provider updated successfully",
    });
  } catch (error) {
    console.error("[Data Providers API] Error updating provider:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update provider" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) {
    return NextResponse.json(
      { success: false, error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const providerName = searchParams.get("providerName");

    if (!providerName || !["datamart", "hubnet"].includes(providerName)) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing provider name" },
        { status: 400 }
      );
    }

    const deleted = await deleteProvider(providerName as ProviderName);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Failed to delete provider" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Provider deleted successfully",
    });
  } catch (error) {
    console.error("[Data Providers API] Error deleting provider:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete provider" },
      { status: 500 }
    );
  }
}
