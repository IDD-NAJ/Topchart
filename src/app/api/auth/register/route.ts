import { NextRequest, NextResponse } from "next/server";
import { register } from "@/lib/actions/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await register({
      email: body.email,
      phone: body.phone,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
    });

    if (result.success) {
      return NextResponse.json(
        { success: true, user: result.user },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
