export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { billService } from "@/lib/bills/service";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const validateSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  accountNumber: z.string().min(1, "Account number is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = validateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { serviceId, accountNumber } = validation.data;

    const result = await billService.validateAccount(serviceId, accountNumber);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Failed to validate bill account:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Validation failed",
      },
      { status: 500 }
    );
  }
}
