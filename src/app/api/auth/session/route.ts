import { NextRequest, NextResponse } from "next/server";
import { Auth } from "@auth/core";
import { authConfig } from "@/lib/auth.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL("/api/auth/session", request.url);
    const authRequest = new Request(url, {
      method: "GET",
      headers: request.headers,
    });

    const response = await Auth(authRequest, authConfig);
    
    if (!response.ok) {
      return NextResponse.json(null, { status: 200 });
    }

    const session = await response.json();
    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json(null, { status: 200 });
  }
}
