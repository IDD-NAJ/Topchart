import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const faqs = await sql`
      SELECT 
        id, question, answer, priority, is_active, created_at, updated_at
      FROM homepage_faqs
      ORDER BY priority ASC, created_at ASC
    `;
    return NextResponse.json({ success: true, faqs });
  } catch (error) {
    console.error("[ADMIN_FAQS_GET] Failed to load FAQs:", error);
    return NextResponse.json({ success: false, error: "Failed to load FAQs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const body = await request.json();
    const { question, answer, priority, is_active } = body;

    if (!question || !answer) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const inserted = await sql`
      INSERT INTO homepage_faqs (question, answer, priority, is_active)
      VALUES (${question}, ${answer}, ${priority || 0}, ${is_active !== false})
      RETURNING *
    `;

    return NextResponse.json({ success: true, faq: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_FAQS_POST] Failed to create FAQ:", error);
    return NextResponse.json({ success: false, error: "Failed to create FAQ" }, { status: 500 });
  }
}
