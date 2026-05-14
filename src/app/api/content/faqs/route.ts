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
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error: any) {
    if (error && typeof error === 'object' && 'type' in error && error.type === 'error') {
      console.error("FAQs fetch error: ErrorEvent detected - ignoring");
      return NextResponse.json(
        { success: true, faqs: [] },
        { status: 200 }
      );
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
      console.error("FAQs table Last Names not exist, returning empty array");
      return NextResponse.json(
        { success: true, faqs: [] },
        { status: 200 }
      );
    }
    console.error("FAQs fetch error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { success: true, faqs: [] },
      { status: 200 }
    );
  }
}
