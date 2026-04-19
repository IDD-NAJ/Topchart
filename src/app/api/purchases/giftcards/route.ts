import { NextRequest, NextResponse } from "next/server"

function generateGiftCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const segments = 4
  const segmentLength = 4
  const parts: string[] = []
  for (let s = 0; s < segments; s++) {
    let segment = ""
    for (let i = 0; i < segmentLength; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    parts.push(segment)
  }
  return parts.join("-")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cardId, denomination, amount } = body

    if (!cardId || !denomination || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: cardId, denomination, amount" },
        { status: 400 }
      )
    }

    // Placeholder: simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const code = generateGiftCode()

    return NextResponse.json({
      success: true,
      data: {
        orderId: `GC-${Date.now()}`,
        cardId,
        denomination,
        amount,
        status: "completed",
        code,
        message: "Gift card code is ready. Redeem it on the provider's platform.",
      },
      code,
    })
  } catch (error) {
    console.error("Gift card purchase error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process gift card purchase" },
      { status: 500 }
    )
  }
}
