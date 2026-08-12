import type { RentPayment } from "@/lib/types/domain";
import { StatusBadge } from "@/components/ui/Badge";
import { getEffectivePaymentStatus } from "@/lib/services/payment-status";

export function PaymentStatusBadge({
  payment,
  referenceDate,
}: {
  payment: RentPayment;
  referenceDate?: Date;
}) {
  const status = getEffectivePaymentStatus(payment, referenceDate);
  return <StatusBadge status={status} kind="payment" />;
}
