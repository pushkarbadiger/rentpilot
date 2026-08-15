import type { RentPayment } from "@/lib/types/domain";
import { getCurrentUser } from "../auth";
import { resolveRentPaymentPropertyId } from "../entity-validation";
import { getPaymentOutstandingAmount } from "../metrics";
import { isPaymentOpen } from "../payment-status";
import { getProfile } from "../profile";
import type { ServiceResult } from "../properties";
import { getRentPayment } from "../rent-payments";
import { getTenant } from "../tenants";
import {
  DEFAULT_CURRENCY,
  PAYMENT_COLLECTION_PROVIDER,
  toMinorUnits,
} from "./config";
import { RAZORPAY_INR_MINIMUM_MINOR } from "./providers/razorpay/checkout";
import type { PaymentCurrency } from "./types";

/** Stripe minimum charge for USD (50¢). */
const STRIPE_USD_MINIMUM_MINOR = 50;

export interface RentCollectionContext {
  userId: string;
  isDemo: boolean;
  payment: RentPayment;
  tenantMonthlyRent: number;
  tenantName: string;
  tenantEmail: string | null;
  tenantPhone: string | null;
  outstanding: number;
  amountMinor: number;
  currency: PaymentCurrency;
  connectedAccountId: string | null;
  chargesEnabled: boolean;
}

function minimumChargeMinor(currency: PaymentCurrency): number {
  if (currency === "inr") return RAZORPAY_INR_MINIMUM_MINOR;
  return STRIPE_USD_MINIMUM_MINOR;
}

/**
 * Loads and validates server-side rent collection context.
 * Client may supply only rent_payment_id — all other fields are derived here.
 */
export async function loadRentCollectionContext(
  paymentId: string
): Promise<ServiceResult<RentCollectionContext>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

const profileResult = await getProfile();
if (profileResult.error || !profileResult.data) {
  return {
    data: null,
    error:
      profileResult.error ?? "Could not load your profile. Please try again.",
  };
}
  const paymentResult = await getRentPayment(paymentId);
  if (paymentResult.error || !paymentResult.data) {
    return {
      data: null,
      error: paymentResult.error ?? "Payment not found",
    };
  }

  const payment = paymentResult.data;

  const tenantResult = await getTenant(payment.tenant_id);
  if (tenantResult.error || !tenantResult.data) {
    return {
      data: null,
      error: tenantResult.error ?? "Tenant not found",
    };
  }

  const { propertyId, error: relationError } = await resolveRentPaymentPropertyId(
    user.id,
    payment.tenant_id,
    payment.property_id,
    user.isDemo
  );
  if (relationError || propertyId !== payment.property_id) {
    return { data: null, error: "Payment not found" };
  }

  const tenant = tenantResult.data;
  const tenantMonthlyRent = tenant.monthly_rent;
  const outstanding = getPaymentOutstandingAmount(payment, tenantMonthlyRent);
  const currency = DEFAULT_CURRENCY;

  if (!isPaymentOpen(payment) || outstanding <= 0) {
    return { data: null, error: "This payment has no outstanding balance." };
  }

  const amountMinor = toMinorUnits(outstanding, currency);
  if (amountMinor <= 0) {
    return { data: null, error: "This payment has no outstanding balance." };
  }

  if (amountMinor < minimumChargeMinor(currency)) {
    return {
      data: null,
      error: "The outstanding amount is below the minimum charge amount.",
    };
  }

  let connectedAccountId: string | null = null;
  let chargesEnabled = false;

  if (!user.isDemo && PAYMENT_COLLECTION_PROVIDER === "stripe") {
    const profileResult = await getProfile();
    if (profileResult.error || !profileResult.data) {
      return {
        data: null,
        error:
          profileResult.error ?? "Could not load your profile. Please try again.",
      };
    }

    if (profileResult.data.id !== user.id) {
      return { data: null, error: "Could not load your profile. Please try again." };
    }

    connectedAccountId = profileResult.data.stripe_connect_account_id;
    chargesEnabled = profileResult.data.stripe_connect_charges_enabled;
  }

  return {
    data: {
      userId: user.id,
      isDemo: user.isDemo,
      payment,
      tenantMonthlyRent,
      tenantName: tenant.full_name,
      tenantEmail: tenant.email,
      tenantPhone: tenant.phone,
      outstanding,
      amountMinor,
      currency,
      connectedAccountId,
      chargesEnabled,
    },
    error: null,
  };
}
