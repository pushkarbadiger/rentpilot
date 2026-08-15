import { getCurrentUser } from "../auth";
import { getPaymentOutstandingAmount } from "../metrics";
import { isPaymentOpen } from "../payment-status";
import type { ServiceResult } from "../properties";
import { getProfile } from "../profile";
import { getRentPayment } from "../rent-payments";
import { getStripeConnectUiState } from "../stripe-connect";
import { isStripeConfigured } from "../stripe";
import { getTenant } from "../tenants";
import {
  DEFAULT_CURRENCY,
  PAYMENT_COLLECTION_PROVIDER,
  isPaymentCollectionConfigured,
  toMinorUnits,
} from "./config";
import { isRazorpayConfigured } from "./providers/razorpay";
import type { RentCollectEligibility } from "./types";

/** Stripe minimum charge for USD (50¢). */
const STRIPE_USD_MINIMUM_MINOR = 50;

/** Razorpay minimum charge for INR (₹1 = 100 paise). */
const RAZORPAY_INR_MINIMUM_MINOR = 100;

function minimumChargeMinor(): number {
  if (DEFAULT_CURRENCY === "inr") {
    return RAZORPAY_INR_MINIMUM_MINOR;
  }
  return STRIPE_USD_MINIMUM_MINOR;
}

function providerEligibilityForLiveUser(): RentCollectEligibility {
  const provider = PAYMENT_COLLECTION_PROVIDER;

  if (provider === "none") {
    return {
      canCollect: false,
      reason: "provider_unavailable",
      provider,
    };
  }

  if (provider === "razorpay") {
    if (!isRazorpayConfigured()) {
      return {
        canCollect: false,
        reason: "provider_unconfigured",
        provider,
      };
    }

    return { canCollect: true, simulated: false, provider };
  }

  if (provider === "stripe") {
    if (!isStripeConfigured) {
      return {
        canCollect: false,
        reason: "stripe_unconfigured",
        provider,
      };
    }

    return { canCollect: true, simulated: false, provider };
  }

  return {
    canCollect: false,
    reason: "provider_unavailable",
    provider,
  };
}

async function stripeLegacyEligibility(): Promise<RentCollectEligibility> {
  const profileResult = await getProfile();
  const connectState = getStripeConnectUiState(profileResult.data, {
    isDemo: false,
    isConfigured: true,
  });

  if (connectState === "not_connected") {
    return {
      canCollect: false,
      reason: "not_connected",
      provider: "stripe",
    };
  }

  if (connectState !== "ready") {
    return {
      canCollect: false,
      reason: "connect_not_ready",
      provider: "stripe",
    };
  }

  return { canCollect: true, simulated: false, provider: "stripe" };
}

/**
 * Server-side eligibility for the Collect rent UI.
 * Provider is derived from deployment configuration — never from the client.
 */
export async function getRentCollectEligibility(
  paymentId: string
): Promise<ServiceResult<RentCollectEligibility>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const paymentResult = await getRentPayment(paymentId);
  if (paymentResult.error || !paymentResult.data) {
    return {
      data: null,
      error: paymentResult.error ?? "Payment not found",
    };
  }

  const payment = paymentResult.data;
  const tenantResult = await getTenant(payment.tenant_id);
  const tenantMonthlyRent = tenantResult.data?.monthly_rent;
  const outstanding = getPaymentOutstandingAmount(payment, tenantMonthlyRent);

  if (!isPaymentOpen(payment) || outstanding <= 0) {
    return {
      data: { canCollect: false, reason: "paid", provider: PAYMENT_COLLECTION_PROVIDER },
      error: null,
    };
  }

  const outstandingMinor = toMinorUnits(outstanding, DEFAULT_CURRENCY);
  if (outstandingMinor <= 0) {
    return {
      data: {
        canCollect: false,
        reason: "no_outstanding",
        provider: PAYMENT_COLLECTION_PROVIDER,
      },
      error: null,
    };
  }

  if (outstandingMinor < minimumChargeMinor()) {
    return {
      data: {
        canCollect: false,
        reason: "below_minimum",
        provider: PAYMENT_COLLECTION_PROVIDER,
      },
      error: null,
    };
  }

  if (user.isDemo) {
    return {
      data: { canCollect: true, simulated: true, provider: PAYMENT_COLLECTION_PROVIDER },
      error: null,
    };
  }

  if (PAYMENT_COLLECTION_PROVIDER === "none") {
    return {
      data: providerEligibilityForLiveUser(),
      error: null,
    };
  }

  if (!isPaymentCollectionConfigured()) {
    return {
      data: {
        canCollect: false,
        reason: "provider_unconfigured",
        provider: PAYMENT_COLLECTION_PROVIDER,
      },
      error: null,
    };
  }

  if (PAYMENT_COLLECTION_PROVIDER === "razorpay") {
    return {
      data: providerEligibilityForLiveUser(),
      error: null,
    };
  }

  if (PAYMENT_COLLECTION_PROVIDER === "stripe") {
    const base = providerEligibilityForLiveUser();
    if (!base.canCollect) {
      return { data: base, error: null };
    }
    return { data: await stripeLegacyEligibility(), error: null };
  }

  return {
    data: {
      canCollect: false,
      reason: "provider_unavailable",
      provider: PAYMENT_COLLECTION_PROVIDER,
    },
    error: null,
  };
}
