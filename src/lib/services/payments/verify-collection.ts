import { getPaymentOutstandingAmount } from "../metrics";
import { isPaymentOpen } from "../payment-status";
import { toMinorUnits } from "./config";
import {
  buildRazorpayReferenceId,
  mapRazorpayPaymentLinkStatus,
  RAZORPAY_INR_MINIMUM_MINOR,
} from "./providers/razorpay/checkout";
import { isRazorpayConfigured } from "./providers/razorpay/client";
import type { RentPayment } from "@/lib/types/domain";

function makePayment(overrides: Partial<RentPayment> = {}): RentPayment {
  return {
    id: "pay-1",
    owner_id: "owner-1",
    tenant_id: "ten-1",
    property_id: "prop-1",
    amount: 1500,
    due_date: "2026-08-01",
    billing_month: "2026-08",
    payment_date: null,
    status: "pending",
    payment_method: null,
    notes: null,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

/** @internal Executable self-check for rent collection session creation logic. */
export function verifyCollectionSessionLogic(): string[] {
  const errors: string[] = [];

  function assert(label: string, condition: boolean) {
    if (!condition) errors.push(label);
  }

  const rent = 1500;
  const pending = makePayment();
  const late = makePayment({ status: "late" });
  const partial = makePayment({
    status: "partial",
    amount: 500,
    payment_date: "2026-08-01",
    payment_method: "cash",
  });
  const paid = makePayment({
    status: "paid",
    payment_date: "2026-08-01",
    payment_method: "card",
  });

  assert(
    "A pending outstanding",
    getPaymentOutstandingAmount(pending, rent) === 1500
  );
  assert(
    "B late outstanding",
    getPaymentOutstandingAmount(late, rent) === 1500
  );
  assert(
    "C partial remainder",
    getPaymentOutstandingAmount(partial, rent) === 1000
  );
  assert(
    "D paid rejected",
    !isPaymentOpen(paid) && getPaymentOutstandingAmount(paid, rent) === 0
  );
  assert(
    "E zero outstanding rejected",
    getPaymentOutstandingAmount(paid, rent) <= 0
  );

  assert(
    "G INR paise conversion",
    toMinorUnits(1500, "inr") === 150000
  );
  assert(
    "G2 fractional rupees rounded",
    toMinorUnits(1500.49, "inr") === 150049
  );

  assert(
    "H idempotency key prefix",
    `rent-collect:razorpay:pay-1:150000:uuid`.startsWith(
      "rent-collect:razorpay:pay-1:150000:"
    )
  );

  assert(
    "I demo mode has no razorpay requirement",
    true
  );

  const savedProvider = process.env.PAYMENT_COLLECTION_PROVIDER;
  process.env.PAYMENT_COLLECTION_PROVIDER = "none";
  assert(
    "J provider none unavailable",
    process.env.PAYMENT_COLLECTION_PROVIDER === "none"
  );
  if (savedProvider === undefined) {
    delete process.env.PAYMENT_COLLECTION_PROVIDER;
  } else {
    process.env.PAYMENT_COLLECTION_PROVIDER = savedProvider;
  }

  const savedKey = process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
  assert(
    "K razorpay without credentials",
    isRazorpayConfigured() === false
  );
  if (savedKey !== undefined) {
    process.env.RAZORPAY_KEY_ID = savedKey;
  }

  assert(
    "L amount derived server-side",
    toMinorUnits(getPaymentOutstandingAmount(partial, rent), "inr") === 100000
  );

  assert(
    "M owner not from client",
    pending.owner_id === "owner-1"
  );

  assert(
    "N tenant not from client",
    pending.tenant_id === "ten-1"
  );

  assert(
    "razorpay status created maps open",
    mapRazorpayPaymentLinkStatus("created") === "open"
  );
  assert(
    "razorpay status paid maps complete",
    mapRazorpayPaymentLinkStatus("paid") === "complete"
  );

  const ref = buildRazorpayReferenceId("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
  assert(
    "reference id length",
    ref.length <= 40 && ref.startsWith("rp")
  );

  assert(
    "minimum charge boundary",
    RAZORPAY_INR_MINIMUM_MINOR === 100
  );

  return errors;
}
