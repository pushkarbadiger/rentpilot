import type {
  PaymentCollectionSessionDisplay,
  PaymentCollectionSessionSummary,
  PaymentDisplayState,
  RentCollectionHeadlineState,
} from "./types";

const DISPLAY_MESSAGES: Record<PaymentDisplayState, string> = {
  awaiting_payment:
    "Payment link is active. Share it with your tenant to collect payment. Payment is not confirmed until RentPilot records it.",
  expired:
    "This payment link has expired. Create a new link if you still need to collect rent.",
  reconciled: "Payment recorded in RentPilot.",
  failed:
    "Payment could not be recorded automatically. Verify the rent status before trying again.",
  stale:
    "This payment link was created for a different outstanding amount. Do not use it — create a new link for the current balance.",
  processing_uncertain: "Payment submitted. Waiting for confirmation.",
};

export function paymentDisplayMessage(state: PaymentDisplayState): string {
  return DISPLAY_MESSAGES[state];
}

export function paymentDisplayLabel(state: PaymentDisplayState): string {
  switch (state) {
    case "awaiting_payment":
      return "Awaiting payment";
    case "expired":
      return "Expired";
    case "reconciled":
      return "Payment recorded";
    case "failed":
      return "Could not record";
    case "stale":
      return "Outdated link";
    case "processing_uncertain":
      return "Processing";
  }
}

/**
 * Derives a safe landlord-facing display state for a collection session.
 * Never exposes internal provider error details.
 */
export function derivePaymentDisplayState(
  session: PaymentCollectionSessionSummary,
  currentOutstandingMinor: number
): PaymentDisplayState {
  if (session.reconciledAt) {
    return "reconciled";
  }

  if (session.status === "failed") {
    return "failed";
  }

  if (session.status === "expired") {
    return "expired";
  }

  if (session.status === "complete") {
    return "processing_uncertain";
  }

  const isOpen = session.status === "open" || session.status === "created";

  if (isOpen) {
    if (
      currentOutstandingMinor > 0 &&
      session.amountMinor !== currentOutstandingMinor
    ) {
      return "stale";
    }
    return "awaiting_payment";
  }

  return "processing_uncertain";
}

export function toPaymentCollectionSessionDisplay(
  session: PaymentCollectionSessionSummary,
  currentOutstandingMinor: number
): PaymentCollectionSessionDisplay {
  const displayState = derivePaymentDisplayState(
    session,
    currentOutstandingMinor
  );
  return {
    ...session,
    displayState,
    message: paymentDisplayMessage(displayState),
  };
}

export function deriveRentCollectionHeadline(
  sessions: PaymentCollectionSessionDisplay[]
): { headline: string; headlineState: RentCollectionHeadlineState } {
  if (sessions.length === 0) {
    return { headline: "", headlineState: "none" };
  }

  const latest = sessions[0];
  const reconciled = sessions.find((s) => s.displayState === "reconciled");
  if (reconciled) {
    return {
      headline: "Payment recorded",
      headlineState: "reconciled",
    };
  }

  const failed = sessions.find((s) => s.displayState === "failed");
  if (failed && latest.displayState === "failed") {
    return {
      headline: "Payment could not be recorded automatically",
      headlineState: "failed",
    };
  }

  const openActionable = sessions.find(
    (s) =>
      s.displayState === "awaiting_payment" &&
      s.collectionUrl &&
      s.collectionUrl.length > 0
  );
  if (openActionable) {
    return {
      headline: "Awaiting tenant payment",
      headlineState: "awaiting_payment",
    };
  }

  const stale = sessions.find((s) => s.displayState === "stale");
  if (stale) {
    return {
      headline: "Payment link may be outdated",
      headlineState: "stale",
    };
  }

  const expired = sessions.find((s) => s.displayState === "expired");
  if (expired && latest.displayState === "expired") {
    return {
      headline: "Payment link expired",
      headlineState: "expired",
    };
  }

  if (latest.displayState === "processing_uncertain") {
    return {
      headline: "Payment submitted. Waiting for confirmation.",
      headlineState: "processing_uncertain",
    };
  }

  return {
    headline: paymentDisplayLabel(latest.displayState),
    headlineState: latest.displayState,
  };
}

/** @internal Executable self-check for collection display-state derivation. */
export function verifyCollectionDisplayLogic(): string[] {
  const errors: string[] = [];

  function assert(label: string, condition: boolean) {
    if (!condition) errors.push(label);
  }

  function session(
    overrides: Partial<PaymentCollectionSessionSummary> &
      Pick<PaymentCollectionSessionSummary, "status">
  ): PaymentCollectionSessionSummary {
    return {
      id: "cs-1",
      provider: "razorpay",
      amountMinor: 100000,
      currency: "inr",
      collectionUrl: "https://rzp.io/test",
      createdAt: "2026-08-13T00:00:00Z",
      completedAt: null,
      reconciledAt: null,
      ...overrides,
    };
  }

  assert(
    "1 open + outstanding matches",
    derivePaymentDisplayState(session({ status: "open" }), 100000) ===
      "awaiting_payment"
  );

  assert(
    "2 expired",
    derivePaymentDisplayState(session({ status: "expired" }), 100000) ===
      "expired"
  );

  assert(
    "3 complete + reconciled_at",
    derivePaymentDisplayState(
      session({
        status: "complete",
        reconciledAt: "2026-08-13T10:00:00Z",
        completedAt: "2026-08-13T10:00:00Z",
      }),
      0
    ) === "reconciled"
  );

  assert(
    "4 failed",
    derivePaymentDisplayState(session({ status: "failed" }), 100000) ===
      "failed"
  );

  assert(
    "5 open + amount differs",
    derivePaymentDisplayState(
      session({ status: "open", amountMinor: 50000 }),
      100000
    ) === "stale"
  );

  assert(
    "6 complete but not reconciled",
    derivePaymentDisplayState(
      session({ status: "complete", completedAt: "2026-08-13T10:00:00Z" }),
      100000
    ) === "processing_uncertain"
  );

  const none = deriveRentCollectionHeadline([]);
  assert("7 no session", none.headlineState === "none" && none.headline === "");

  assert(
    "8 stripe provider open",
    derivePaymentDisplayState(
      session({ status: "open", provider: "stripe", currency: "usd" }),
      100000
    ) === "awaiting_payment"
  );

  return errors;
}
