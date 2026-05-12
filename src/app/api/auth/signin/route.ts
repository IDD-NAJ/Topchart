import { NextRequest, NextResponse } from "next/server";
import { Auth } from "@auth/core";
import { authConfig } from "@/lib/auth.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider") || "google";
    const callbackUrl = url.searchParams.get("callbackUrl") || "/dashboard";
    
    // Build the authorization URL
    const authUrl = new URL(`/api/auth/${provider}`, request.url);
    authUrl.searchParams.set("callbackUrl", callbackUrl);
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.redirect(new URL("/login?error=signin", request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    
    const authRequest = new Request(url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(body),
    });

    const response = await Auth(authRequest, authConfig);
    
    // Convert Response to NextResponse
    const nextResponse = NextResponse.json(await response.json().catch(() => ({})), {
      status: response.status,
      headers: response.headers,
    });

    // Copy cookies
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        nextResponse.headers.append(key, value);
      }
    });

    return nextResponse;
  } catch (error) {
    console.error("Signin POST error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
