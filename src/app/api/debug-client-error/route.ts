import { NextResponse } from "next/server";
import { appendFile } from "node:fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    await appendFile(
      "debug-920650.log",
      `${JSON.stringify({
        sessionId: "920650",
        runId: "post-fix",
        hypothesisId: "H3",
        location: "src/app/api/debug-client-error/route.ts:POST",
        message: "client_error_event",
        data: payload,
        timestamp: Date.now(),
      })}\n`,
      "utf8"
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
