import { createRentCollectionSession } from "@/lib/services/payments/create-collection-session";
import type { RentCheckoutSessionResult } from "./stripe/types";
import type { ServiceResult } from "./properties";

export type {
  RentCollectBlockReason,
  RentCollectEligibility,
} from "@/lib/services/payments/types";

export { getRentCollectEligibility } from "@/lib/services/payments/eligibility";

/**
 * @deprecated Use createRentCollectionSession from payments/create-collection-session.
 * Frozen Stripe path remains available when PAYMENT_COLLECTION_PROVIDER=stripe.
 */
export async function createRentCheckoutSession(
  paymentId: string
): Promise<ServiceResult<RentCheckoutSessionResult>> {
  const result = await createRentCollectionSession(paymentId);
  if (result.error || !result.data) {
    return { data: null, error: result.error ?? "Could not create checkout." };
  }

  return {
    data: {
      checkoutUrl: result.data.collectionUrl,
      amountCents: result.data.amountMinor,
      simulated: result.data.simulated,
    },
    error: null,
  };
}
