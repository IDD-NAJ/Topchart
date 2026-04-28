import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import {
  CATEGORY_KEYS,
  parseFiniteNumber,
  parseNullableMarkup,
  normalizeCategoryDefaults,
  validateMarkupRange,
  fetchVerificationPricingSettings,
  saveVerificationPricingSettings,
  VerificationPricingSettings,
} from "@/lib/verification-pricing-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Get global settings
export async function GET() {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const settings = await fetchVerificationPricingSettings();

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// Update global settings
export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.ok) {
      return NextResponse.json(
        { success: false, error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const body = await request.json();
    const { exchangeRate, defaultMarkup, categoryDefaults, pvadealsApiKey, minMarkup, maxMarkup, applyToExisting } = body;

    const current = await fetchVerificationPricingSettings();

    const resolvedExchangeRate =
      exchangeRate !== undefined ? parseFiniteNumber(exchangeRate) : current.exchangeRate;
    if (resolvedExchangeRate === null || resolvedExchangeRate <= 0) {
      return NextResponse.json(
        { success: false, error: "exchangeRate must be a positive number" },
        { status: 400 }
      );
    }

    const resolvedDefaultMarkup =
      defaultMarkup !== undefined ? parseFiniteNumber(defaultMarkup) : current.defaultMarkup;
    if (resolvedDefaultMarkup === null || resolvedDefaultMarkup < 0) {
      return NextResponse.json(
        { success: false, error: "defaultMarkup must be a non-negative number" },
        { status: 400 }
      );
    }

    const resolvedMinMarkup =
      minMarkup !== undefined ? parseNullableMarkup(minMarkup) : current.minMarkup;
    const resolvedMaxMarkup =
      maxMarkup !== undefined ? parseNullableMarkup(maxMarkup) : current.maxMarkup;

    if (minMarkup !== undefined && minMarkup !== null && resolvedMinMarkup === null) {
      return NextResponse.json(
        { success: false, error: "minMarkup must be null or a non-negative number" },
        { status: 400 }
      );
    }
    if (maxMarkup !== undefined && maxMarkup !== null && resolvedMaxMarkup === null) {
      return NextResponse.json(
        { success: false, error: "maxMarkup must be null or a non-negative number" },
        { status: 400 }
      );
    }

    if (resolvedMinMarkup !== null && resolvedMaxMarkup !== null && resolvedMinMarkup > resolvedMaxMarkup) {
      return NextResponse.json(
        { success: false, error: "minMarkup cannot be greater than maxMarkup" },
        { status: 400 }
      );
    }

    if (!validateMarkupRange(resolvedDefaultMarkup, resolvedMinMarkup, resolvedMaxMarkup)) {
      return NextResponse.json(
        { success: false, error: "defaultMarkup must be within configured min/max guard" },
        { status: 400 }
      );
    }

    const normalizedCategoryDefaults =
      categoryDefaults !== undefined
        ? normalizeCategoryDefaults(categoryDefaults, resolvedDefaultMarkup)
        : current.categoryDefaults;

    for (const key of CATEGORY_KEYS) {
      if (!validateMarkupRange(normalizedCategoryDefaults[key], resolvedMinMarkup, resolvedMaxMarkup)) {
        return NextResponse.json(
          { success: false, error: `categoryDefaults.${key} must be within configured min/max guard` },
          { status: 400 }
        );
      }
    }

    const resolvedPvadealsApiKey =
      pvadealsApiKey !== undefined && pvadealsApiKey !== null
        ? String(pvadealsApiKey)
        : current.pvadealsApiKey;

    const nextSettings: VerificationPricingSettings = {
      exchangeRate: resolvedExchangeRate,
      defaultMarkup: resolvedDefaultMarkup,
      minMarkup: resolvedMinMarkup,
      maxMarkup: resolvedMaxMarkup,
      categoryDefaults: normalizedCategoryDefaults,
      pvadealsApiKey: resolvedPvadealsApiKey,
    };

    await saveVerificationPricingSettings(nextSettings, adminCheck.userId);

    let affectedServices = 0;
    if (applyToExisting === true) {
      const applyResult = await sql`
        UPDATE verification_services
        SET
          markup_percentage = CASE category
            WHEN 'social_media' THEN ${normalizedCategoryDefaults.social_media}
            WHEN 'ecommerce_financial' THEN ${normalizedCategoryDefaults.ecommerce_financial}
            WHEN 'professional_tools' THEN ${normalizedCategoryDefaults.professional_tools}
            WHEN 'streaming_entertainment' THEN ${normalizedCategoryDefaults.streaming_entertainment}
            ELSE ${resolvedDefaultMarkup}
          END,
          updated_at = NOW()
        RETURNING id
      `;
      affectedServices = (applyResult as any[]).length;
    }

    return NextResponse.json({
      success: true,
      message: applyToExisting ? `Updated settings and applied to ${affectedServices} services` : "Updated settings",
      data: {
        ...nextSettings,
        appliedToExisting: applyToExisting === true,
        affectedServices,
      },
    });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
