import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { providerId, accountNumber, amount } = body

    if (!providerId || !accountNumber || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: providerId, accountNumber, amount" },
        { status: 400 }
      )
    }

    // Placeholder: simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return NextResponse.json({
      success: true,
      data: {
        orderId: `BILL-${Date.now()}`,
        providerId,
        accountNumber,
        amount,
        status: "completed",
        receipt: `RCT-${Date.now()}`,
        message: "Bill payment completed successfully. A receipt has been sent to your email.",
      },
    })
  } catch (error) {
    console.error("Bill payment error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process bill payment" },
      { status: 500 }
    )
  }
}
