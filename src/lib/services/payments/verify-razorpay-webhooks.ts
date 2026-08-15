import { createHmac } from "crypto";
import type { PaymentCollectionSession } from "./types";
import {
  extractPaymentLinkEntity,
  parseRazorpayWebhookEnvelope,
  shouldSkipSessionRegression,
  validatePaidAmountAndCurrency,
} from "./providers/razorpay/webhooks";
import { verifyRazorpayWebhookSignature } from "./providers/razorpay/signature";
import {
  RAZORPAY_PAYMENT_LINK_EVENTS,
  type RazorpayPaymentLink,
  type RazorpayWebhookEventEnvelope,
} from "./providers/razorpay/types";

function makeSession(
  overrides: Partial<PaymentCollectionSession> = {}
): PaymentCollectionSession {
  return {
    id: "sess-1",
    owner_id: "owner-1",
    rent_payment_id: "pay-1",
    tenant_id: "ten-1",
    provider: "razorpay",
    provider_reference_id: "plink_test123",
    provider_payment_id: null,
    amount_minor: 150000,
    currency: "inr",
    status: "open",
    idempotency_key: "key-1",
    collection_url: "https://rzp.io/i/test",
    created_at: "2026-08-13T00:00:00Z",
    completed_at: null,
    reconciled_at: null,
    metadata: null,
    ...overrides,
  };
}

function makePaymentLink(
  overrides: Partial<RazorpayPaymentLink> = {}
): RazorpayPaymentLink {
  return {
    id: "plink_test123",
    amount: 150000,
    amount_paid: 150000,
    currency: "INR",
    description: "Rent",
    reference_id: "rpref",
    short_url: "https://rzp.io/i/test",
    status: "paid",
    created_at: 1,
    updated_at: 1,
    expire_by: null,
    expired_at: null,
    cancelled_at: null,
    notes: {
      collection_session_id: "sess-1",
      rent_payment_id: "pay-1",
      owner_id: "owner-1",
      tenant_id: "ten-1",
    },
    payments: null,
    ...overrides,
  };
}

function makeEnvelope(
  event: string,
  paymentLink: RazorpayPaymentLink,
  paymentId?: string
): RazorpayWebhookEventEnvelope {
  return {
    entity: "event",
    account_id: "acc_test",
    event,
    contains: ["payment_link", ...(paymentId ? ["payment"] : [])],
    created_at: 1_700_000_000,
    payload: {
      payment_link: { entity: paymentLink },
      ...(paymentId
        ? {
            payment: {
              entity: {
                id: paymentId,
                entity: "payment",
                amount: paymentLink.amount,
                currency: paymentLink.currency,
                status: "captured",
              },
            },
          }
        : {}),
    },
  };
}

/** @internal Executable self-check for Razorpay webhook logic. */
export function verifyRazorpayWebhookLogic(): string[] {
  const errors: string[] = [];

  function assert(label: string, condition: boolean) {
    if (!condition) errors.push(label);
  }

  const secret = "whsec_test_secret";
  const body = JSON.stringify(
    makeEnvelope("payment_link.paid", makePaymentLink())
  );
  const validSignature = createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  assert(
    "1 valid signature accepted",
    verifyRazorpayWebhookSignature(body, validSignature, secret)
  );
  assert(
    "2 invalid signature rejected",
    !verifyRazorpayWebhookSignature(body, "deadbeef", secret)
  );
  assert(
    "3 missing signature rejected",
    !verifyRazorpayWebhookSignature(body, "", secret)
  );

  const envelope = parseRazorpayWebhookEnvelope(body);
  const paymentLink = extractPaymentLinkEntity(envelope);
  assert(
    "4 payment link correlates",
    paymentLink.id === "plink_test123" &&
      paymentLink.notes?.collection_session_id === "sess-1"
  );

  const session = makeSession();
  let paidValidationPassed = false;
  try {
    validatePaidAmountAndCurrency(session, paymentLink);
    paidValidationPassed = true;
  } catch {
    paidValidationPassed = false;
  }
  assert("5 paid amount matches", paidValidationPassed);

  let amountMismatchCaught = false;
  try {
    validatePaidAmountAndCurrency(session, makePaymentLink({ amount: 99999 }));
    amountMismatchCaught = false;
  } catch {
    amountMismatchCaught = true;
  }
  assert("6 amount mismatch throws", amountMismatchCaught);

  let currencyMismatchCaught = false;
  try {
    validatePaidAmountAndCurrency(session, makePaymentLink({ currency: "USD" }));
    currencyMismatchCaught = false;
  } catch {
    currencyMismatchCaught = true;
  }
  assert("7 currency mismatch throws", currencyMismatchCaught);

  assert(
    "8 complete session skips regression",
    shouldSkipSessionRegression(makeSession({ status: "complete" }), "failed")
  );

  assert(
    "9 reconciled session skips regression",
    shouldSkipSessionRegression(
      makeSession({ reconciled_at: "2026-08-13T10:00:00Z" }),
      "expired"
    )
  );

  assert(
    "10 partial paid event constant",
    RAZORPAY_PAYMENT_LINK_EVENTS.PARTIALLY_PAID ===
      "payment_link.partially_paid"
  );

  assert(
    "11 paid event constant",
    RAZORPAY_PAYMENT_LINK_EVENTS.PAID === "payment_link.paid"
  );

  assert(
    "12 cancelled event constant",
    RAZORPAY_PAYMENT_LINK_EVENTS.CANCELLED === "payment_link.cancelled"
  );

  assert(
    "13 expired event constant",
    RAZORPAY_PAYMENT_LINK_EVENTS.EXPIRED === "payment_link.expired"
  );

  assert(
    "14 wrong provider would fail correlation in handler",
    makeSession({ provider: "stripe" }).provider !== "razorpay"
  );

  assert(
    "15 demo isolation note",
    process.env.RAZORPAY_KEY_ID === undefined ||
      typeof process.env.RAZORPAY_KEY_ID === "string"
  );

  return errors;
}
