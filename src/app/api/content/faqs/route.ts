import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const faqs = await sql`
      SELECT id, question, answer, category
      FROM faqs
    `;

    return NextResponse.json(
      {
        success: true,
        faqs: faqs || [],
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("FAQs fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load FAQs" },
      { status: 500 }
    );
  }
}
