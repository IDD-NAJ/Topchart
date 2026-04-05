import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { calculatePrice } from "@/lib/textverified";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify session
    const sessions = await sql`
      SELECT s.user_id
      FROM auth_sessions s
      WHERE s.token = ${sessionToken}
        AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Session expired" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // Build query
    let query = sql`
      SELECT 
        id,
        textverified_service_id,
        name,
        category,
        description,
        icon_url,
        is_active,
        base_cost,
        markup_percentage,
        rental_multiplier
      FROM verification_services
      WHERE is_active = true
    `;

    if (category) {
      query = sql`
        SELECT 
          id,
          textverified_service_id,
          name,
          category,
          description,
          icon_url,
          is_active,
          base_cost,
          markup_percentage,
          rental_multiplier
        FROM verification_services
        WHERE is_active = true AND category = ${category}
      `;
    }

    const services = await query;

    // Calculate final prices
    const servicesWithPrices = services.map((service: any) => ({
      ...service,
      onetime_price: calculatePrice(
        Number(service.base_cost),
        Number(service.markup_percentage)
      ),
      rental_price_per_day: calculatePrice(
        Number(service.base_cost) * Number(service.rental_multiplier),
        Number(service.markup_percentage)
      ),
    }));

    // Group by category
    const grouped = servicesWithPrices.reduce((acc: Record<string, any[]>, svc: any) => {
      if (!acc[svc.category]) {
        acc[svc.category] = [];
      }
      acc[svc.category].push(svc);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        services: servicesWithPrices,
        grouped,
        categories: [
          { id: "social_media", name: "Social Media & Messaging", icon: "MessageCircle" },
          { id: "ecommerce_financial", name: "E-commerce & Financial", icon: "CreditCard" },
          { id: "professional_tools", name: "Professional Tools", icon: "Briefcase" },
          { id: "streaming_entertainment", name: "Streaming & Entertainment", icon: "Play" },
        ],
      },
    });
  } catch (error) {
    console.error("Get verification services error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
