import { verifyPaymentProviderLogic } from "../src/lib/services/payments/verify";

const errors = verifyPaymentProviderLogic();

if (errors.length > 0) {
  console.error("Payment provider self-check failed:");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(
  `Payment provider self-check passed (${verifyPaymentProviderLogic.name}).`
);
