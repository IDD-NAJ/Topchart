import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const categories = await sql`
      SELECT id, name, color_class, sort_order
      FROM blog_categories
      ORDER BY sort_order ASC, created_at ASC
    `;

    const posts = await sql`
      SELECT 
        p.id, 
        p.slug, 
        p.title, 
        p.excerpt, 
        p.author, 
        p.gradient, 
        p.icon_color, 
        p.published_at,
        c.name as category_name,
        c.color_class as category_color
      FROM posts p
      LEFT JOIN blog_categories c ON p.category_id = c.id
      WHERE p.is_published = TRUE 
        AND p.published_at <= NOW()
      ORDER BY p.published_at DESC
    `;

    return NextResponse.json(
      {
        success: true,
        categories: categories || [],
        posts: posts || [],
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Blog fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load blog posts" },
      { status: 500 }
    );
  }
}
