import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

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

    // Try to get settings from database, return defaults if not found
    try {
      const settings = await sql`
        SELECT key, value FROM app_settings 
        WHERE key IN ('exchange_rate', 'default_verification_markup', 'pvadeals_api_key', 'min_markup', 'max_markup', 'category_defaults')
      `;
      
      const settingsMap: Record<string, string> = {};
      settings.forEach((s: any) => {
        settingsMap[s.key] = s.value;
      });

      let categoryDefaults: Record<string, number> = {};
      try {
        if (settingsMap.category_defaults) {
          categoryDefaults = JSON.parse(settingsMap.category_defaults);
        }
      } catch {}

      return NextResponse.json({
        success: true,
        data: {
          exchangeRate: parseFloat(settingsMap.exchange_rate || process.env.NEXT_PUBLIC_USD_TO_GHS_RATE || "15.5"),
          defaultMarkup: parseFloat(settingsMap.default_verification_markup || "40"),
          minMarkup: settingsMap.min_markup ? parseFloat(settingsMap.min_markup) : null,
          maxMarkup: settingsMap.max_markup ? parseFloat(settingsMap.max_markup) : null,
          categoryDefaults,
          pvadealsApiKey: settingsMap.pvadeals_api_key || process.env.PVADEALS_API_KEY || "",
        },
      });
    } catch {
      // Return defaults if table doesn't exist
      return NextResponse.json({
        success: true,
        data: {
          exchangeRate: parseFloat(process.env.NEXT_PUBLIC_USD_TO_GHS_RATE || "15.5"),
          defaultMarkup: 40,
          minMarkup: null,
          maxMarkup: null,
          categoryDefaults: {},
          pvadealsApiKey: process.env.PVADEALS_API_KEY || "",
        },
      });
    }
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
    const { exchangeRate, defaultMarkup, categoryDefaults, pvadealsApiKey, minMarkup, maxMarkup } = body;

    // Update settings
    const updates: string[] = [];
    
    if (exchangeRate !== undefined) {
      await sql`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ('exchange_rate', ${exchangeRate.toString()}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = ${exchangeRate.toString()}, updated_at = NOW()
      `;
      updates.push(`exchange_rate: ${exchangeRate}`);
    }

    if (defaultMarkup !== undefined) {
      await sql`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ('default_verification_markup', ${defaultMarkup.toString()}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = ${defaultMarkup.toString()}, updated_at = NOW()
      `;
      updates.push(`default_verification_markup: ${defaultMarkup}%`);
    }

    if (pvadealsApiKey !== undefined) {
      await sql`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ('pvadeals_api_key', ${pvadealsApiKey}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = ${pvadealsApiKey}, updated_at = NOW()
      `;
      updates.push(`pvadeals_api_key: updated`);
    }

    // Store category defaults as JSON
    if (categoryDefaults !== undefined) {
      await sql`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ('category_defaults', ${JSON.stringify(categoryDefaults)}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(categoryDefaults)}, updated_at = NOW()
      `;
      updates.push(`category_defaults: updated`);
    }

    if (minMarkup !== undefined) {
      const val = minMarkup === null ? 'null' : minMarkup.toString();
      await sql`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ('min_markup', ${val}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = ${val}, updated_at = NOW()
      `;
      updates.push(`min_markup: ${val}%`);
    }

    if (maxMarkup !== undefined) {
      const val = maxMarkup === null ? 'null' : maxMarkup.toString();
      await sql`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ('max_markup', ${val}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = ${val}, updated_at = NOW()
      `;
      updates.push(`max_markup: ${val}%`);
    }

    return NextResponse.json({
      success: true,
      message: `Updated: ${updates.join(', ')}`,
      data: {
        exchangeRate,
        defaultMarkup,
        categoryDefaults,
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
