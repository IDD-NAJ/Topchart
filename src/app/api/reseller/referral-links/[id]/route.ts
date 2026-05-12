import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE - Delete referral link
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const sessions = await sql`
      SELECT u.id, u.role FROM auth_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken} AND s.expires_at > NOW()
      LIMIT 1
    `;
    
    if (!sessions.length) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = sessions[0].id;
    
    // Get reseller profile
    const profiles = await sql`
      SELECT id FROM reseller_profiles
      WHERE user_id = ${userId}
    `;
    
    if (!profiles.length) {
      return NextResponse.json({ success: false, error: "Not a reseller" }, { status: 403 });
    }
    
    const resellerId = profiles[0].id;
    const linkId = id;
    
    // Delete the referral link (only if it belongs to this reseller)
    const result = await sql`
      DELETE FROM referral_links
      WHERE id = ${linkId} AND reseller_id = ${resellerId}
      RETURNING id
    `;
    
    if (!result.length) {
      return NextResponse.json({ success: false, error: "Link not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error deleting referral link:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
