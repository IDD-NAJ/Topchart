import { NextResponse } from "next/server";
import { getActiveFaqs } from "@/lib/faqs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const faqs = await getActiveFaqs();
    return NextResponse.json(
      { success: true, faqs },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("FAQs fetch error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: true, faqs: [] }, { status: 200 });
  }
}
