import { Auth } from "@auth/core";
import { authConfig } from "@/lib/auth.config";
import { NextRequest, NextResponse } from "next/server";

const handler = async (req: NextRequest) => {
  const url = new URL(req.url);
  const request = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
  });

  const response = await Auth(request, authConfig);

  // Convert Response to NextResponse
  const nextResponse = NextResponse.json(await response.json().catch(() => null) || {}, {
    status: 200,
    headers: response.headers,
  });

  // Copy cookies from the auth response
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      nextResponse.headers.append(key, value);
    }
  });

  return nextResponse;
};

export { handler as GET, handler as POST };
