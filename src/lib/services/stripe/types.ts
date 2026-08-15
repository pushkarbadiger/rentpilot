/** UI-facing Connect readiness derived from profile + server config. */
export type StripeConnectUiState =
  | "unavailable"
  | "not_connected"
  | "onboarding_incomplete"
  | "ready";

export interface RentCheckoutSessionResult {
  checkoutUrl: string;
  amountCents: number;
  simulated: boolean;
}
