import { NextResponse } from "next/server";
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
    // Aggregate all homepage content sections (services, faqs, testimonials)
    const sections: any[] = [];

    // Services section
    const servicesTableExists = await sql`SELECT to_regclass('public.homepage_services')`;
    if (servicesTableExists[0].to_regclass) {
      try {
        const services = await sql`
          SELECT id, title, description, href, label, icon, priority, is_active, created_at, updated_at
          FROM homepage_services
          ORDER BY priority ASC, created_at ASC
        `;
        sections.push({
          id: "services",
          section_type: "services",
          title: "Services",
          is_active: true,
          items: services,
        });
      } catch (e) {
        // Silently ignore services fetch errors
      }
    }

    // FAQs section
    const faqsTableExists = await sql`SELECT to_regclass('public.homepage_faqs')`;
    if (faqsTableExists[0].to_regclass) {
      try {
        const faqs = await sql`
          SELECT id, question, answer, priority, is_active, created_at, updated_at
          FROM homepage_faqs
          ORDER BY priority ASC, created_at ASC
        `;
        sections.push({
          id: "faqs",
          section_type: "faqs",
          title: "FAQs",
          is_active: true,
          items: faqs,
        });
      } catch (e) {
        // Silently ignore FAQs fetch errors
      }
    }

    // Testimonials section
    const testimonialsTableExists = await sql`SELECT to_regclass('public.homepage_testimonials')`;
    if (testimonialsTableExists[0].to_regclass) {
      try {
        const testimonials = await sql`
          SELECT id, name, role, message, avatar_url, priority, is_active, created_at, updated_at
          FROM homepage_testimonials
          ORDER BY priority ASC, created_at ASC
        `;
        sections.push({
          id: "testimonials",
          section_type: "testimonials",
          title: "Testimonials",
          is_active: true,
          items: testimonials,
        });
      } catch (e) {
        // Silently ignore testimonials fetch errors
      }
    }

    return NextResponse.json({ success: true, sections, content: sections, data: sections });
  } catch (error) {
    console.error("[ADMIN_HOMEPAGE_GET] Error:", error);
    return NextResponse.json({ success: true, sections: [], content: [], data: [] });
  }
}
