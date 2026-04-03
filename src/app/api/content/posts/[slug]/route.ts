import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const posts = await sql`
      SELECT 
        p.id, 
        p.slug, 
        p.title, 
        p.excerpt, 
        p.content, 
        p.author, 
        p.gradient, 
        p.icon_color, 
        p.published_at,
        c.name as category_name,
        c.color_class as category_color
      FROM posts p
      LEFT JOIN blog_categories c ON p.category_id = c.id
      WHERE p.slug = ${slug} 
        AND p.is_published = TRUE 
        AND p.published_at <= NOW()
      LIMIT 1
    `;

    if (!posts || posts.length === 0) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        post: posts[0],
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Post fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load post" },
      { status: 500 }
    );
  }
}
