import type { PaymentCurrency, PaymentProvider } from "./types";

const VALID_PROVIDERS: PaymentProvider[] = ["razorpay", "stripe", "none"];
const VALID_CURRENCIES: PaymentCurrency[] = ["inr", "usd"];

function parsePaymentProvider(raw: string | undefined): PaymentProvider {
  const normalized = (raw ?? "razorpay").trim().toLowerCase();
  if (VALID_PROVIDERS.includes(normalized as PaymentProvider)) {
    return normalized as PaymentProvider;
  }
  return "razorpay";
}

function parseDefaultCurrency(raw: string | undefined): PaymentCurrency {
  const normalized = (raw ?? "inr").trim().toLowerCase();
  if (VALID_CURRENCIES.includes(normalized as PaymentCurrency)) {
    return normalized as PaymentCurrency;
  }
  return "inr";
}

/**
 * Server-only rent collection provider.
 * Never read from client input — deployment configuration only.
 */
export const PAYMENT_COLLECTION_PROVIDER: PaymentProvider = parsePaymentProvider(
  process.env.PAYMENT_COLLECTION_PROVIDER
);

/**
 * Default currency for new collection sessions (India MVP: INR).
 */
export const DEFAULT_CURRENCY: PaymentCurrency = parseDefaultCurrency(
  process.env.DEFAULT_CURRENCY
);

/** Convert a major-unit amount (e.g. dollars/rupees) to minor units. */
export function toMinorUnits(
  majorAmount: number,
  _currency: PaymentCurrency = DEFAULT_CURRENCY
): number {
  void _currency;
  return Math.round(majorAmount * 100);
}

/** Whether the configured provider can create real collection sessions. */
export function isPaymentCollectionConfigured(): boolean {
  if (PAYMENT_COLLECTION_PROVIDER === "none") return false;
  if (PAYMENT_COLLECTION_PROVIDER === "stripe") {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  }
  if (PAYMENT_COLLECTION_PROVIDER === "razorpay") {
    return Boolean(
      process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    );
  }
  return false;
}
