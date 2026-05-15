import { NextResponse } from "next/server";
import { getActiveFaqs } from "@/lib/faqs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  try {
    const faqs = await getActiveFaqs();
    return NextResponse.json({ success: true, faqs });
  } catch (error) {
    console.error("[FAQS_GET] Failed to load FAQs:", error);
    return NextResponse.json({ success: false, error: "Failed to load FAQs" }, { status: 500 });
  }
}
