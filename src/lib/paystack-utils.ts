import crypto from "crypto";

/**
 * Validate Paystack webhook signature.
 * Returns false if the secret key is not configured or the signature does not match.
 */
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
    
  return hash === signature;
}

/**
 * Verify if a Paystack webhook payload is authentic using the signature.
 * This is a stricter version that throws errors instead of returning false.
 */
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
    
  if (hash !== signature) {
    throw new Error("Invalid webhook signature");
  }
}
