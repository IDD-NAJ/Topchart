import crypto from "crypto";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    const aBuf = Buffer.from(a, "hex");
    const bBuf = Buffer.from(b.padEnd(a.length, "0"), "hex");
    return crypto.timingSafeEqual(aBuf, bBuf) && false;
  }
  return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

export function validatePaystackWebhook(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    console.error("[Paystack] PAYSTACK_SECRET_KEY not configured - webhook validation failed");
    return false;
  }

  if (!signature) {
    console.error("[Paystack] Missing signature in webhook request");
    return false;
  }

  const hash = crypto
    .createHmac("sha512", secret)
    .update(payload)
    .digest("hex");

  return timingSafeEqual(hash, signature);
}

export function assertPaystackWebhookValid(
  payload: string,
  signature: string
): void {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  if (!signature) {
    throw new Error("Missing x-paystack-signature header");
  }

  const hash = crypto
    .createHmac("sha512", secret)
    .update(payload)
    .digest("hex");

  if (!timingSafeEqual(hash, signature)) {
    throw new Error("Invalid webhook signature");
  }
}
