import type { RazorpayApiErrorBody } from "./types";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

export function getRazorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID ?? "";
}

export function getRazorpayKeySecret(): string {
  return process.env.RAZORPAY_KEY_SECRET ?? "";
}

export function isRazorpayConfigured(): boolean {
  return Boolean(getRazorpayKeyId() && getRazorpayKeySecret());
}

export function isRazorpayWebhookConfigured(): boolean {
  return isRazorpayConfigured() && Boolean(getRazorpayWebhookSecret());
}

export function getRazorpayWebhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  if (!secret) {
    throw new Error("Razorpay webhook secret is not configured.");
  }
  return secret;
}

function basicAuthHeader(): string {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured.");
  }
  const token = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  return `Basic ${token}`;
}

export class RazorpayApiError extends Error {
  readonly statusCode: number;
  readonly code: string | undefined;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.name = "RazorpayApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Server-side Razorpay REST client.
 * @see https://razorpay.com/docs/api/authentication/
 */
export async function razorpayRequest<T>(
  method: "POST" | "GET" | "PATCH",
  path: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(`${RAZORPAY_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const errorBody = payload as RazorpayApiErrorBody | null;
    const description =
      errorBody?.error?.description ?? "Razorpay request failed.";
    console.error("[razorpay] API error", {
      path,
      status: response.status,
      code: errorBody?.error?.code,
    });
    throw new RazorpayApiError(
      description,
      response.status,
      errorBody?.error?.code
    );
  }

  return payload as T;
}
