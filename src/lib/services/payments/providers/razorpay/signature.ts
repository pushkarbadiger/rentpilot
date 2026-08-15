import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies Razorpay webhook signature (HMAC SHA256 hex digest of raw body).
 * @see https://razorpay.com/docs/webhooks/validate-test/
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!rawBody || !signature || !secret) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  try {
    const expectedBuffer = Buffer.from(expected, "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");
    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }
    return timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch {
    return false;
  }
}
