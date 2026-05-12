import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  try {
    const faqs = await sql`
      SELECT 
        id, question, answer, priority, is_active, created_at, updated_at
      FROM homepage_faqs
      WHERE is_active = TRUE
      ORDER BY priority ASC, created_at ASC
    `;
    return NextResponse.json({ success: true, faqs });
  } catch (error) {
    console.error("[FAQS_GET] Failed to load FAQs:", error);
    return NextResponse.json({ success: false, error: "Failed to load FAQs" }, { status: 500 });
  }
}
