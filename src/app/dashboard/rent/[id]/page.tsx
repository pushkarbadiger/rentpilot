import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PaymentStatusBadge } from "@/components/ui/PaymentStatusBadge";
import { DeleteRentPaymentButton } from "@/components/forms/DeleteRentPaymentButton";
import { StripeCheckoutStatusCard } from "@/components/payments/StripeCheckoutStatusCard";
import { CollectRentButton } from "@/components/forms/CollectRentButton";
import { SendRentReminderButton } from "@/components/forms/SendRentReminderButton";
import {
  formatCurrency,
  formatCurrencyPrecise,
  formatDate,
  formatEmpty,
  formatPaymentMethod,
} from "@/lib/utils";
import { getPaymentOutstandingAmount } from "@/lib/services/metrics";
import { getRentReminderPreview } from "@/lib/services/rent-reminders";
import { getRentPayment } from "@/lib/services/rent-payments";
import { getRentCollectEligibility } from "@/lib/services/stripe-checkout";
import { getRentPaymentStripeStatus } from "@/lib/services/stripe-checkout-sessions";
import { getTenant } from "@/lib/services/tenants";
import { getCurrentUser } from "@/lib/services/auth";
import { Alert } from "@/components/ui/Alert";

export default async function RentPaymentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const reminderSent =
    typeof query.reminderSent === "string" ? query.reminderSent : null;
  const checkoutReturn =
    typeof query.checkout === "string" ? query.checkout : null;
  const { data: payment, error } = await getRentPayment(id);

  if (error || !payment) notFound();

  const user = await getCurrentUser();

  const { data: tenant } = await getTenant(payment.tenant_id);
  const reminderPreviewResult = await getRentReminderPreview(id);
  const reminderPreview = reminderPreviewResult.data;
  const collectEligibilityResult = await getRentCollectEligibility(id);
  const collectEligibility = collectEligibilityResult.data;
  const stripeStatusResult = await getRentPaymentStripeStatus(id);
  const stripeStatus = stripeStatusResult.data;
  const tenantMonthlyRent = tenant?.monthly_rent;
  const outstanding = getPaymentOutstandingAmount(payment, tenantMonthlyRent);

  return (
    <div>
      <Link
        href="/dashboard/rent"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to rent operations
      </Link>

      <PageHeader
        title="Rent payment"
        description={`${payment.tenant?.full_name ?? "Unknown tenant"} · ${payment.property?.name ?? "Unknown property"}`}
        actions={
          <>
            {collectEligibility && (
              <CollectRentButton
                paymentId={payment.id}
                eligibility={collectEligibility}
              />
            )}
            {reminderPreview && (
              <SendRentReminderButton
                paymentId={payment.id}
                preview={reminderPreview}
              />
            )}
            <ButtonLink
              href={`/dashboard/rent/${payment.id}/edit`}
              variant="outline"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </ButtonLink>
            <DeleteRentPaymentButton
              id={payment.id}
              tenantName={payment.tenant?.full_name ?? "Unknown tenant"}
            />
          </>
        }
      />

      {checkoutReturn === "simulated" && (
        <Alert variant="warning" className="mb-6 max-w-3xl">
          Payment collection simulated — no Razorpay link was created and no real
          payment can be collected in demo mode.
        </Alert>
      )}

      {checkoutReturn === "success" && (
        <Alert variant="info" className="mb-6 max-w-3xl">
          {stripeStatus?.hasReconciledSession
            ? "Payment recorded. This rent payment has been updated in RentPilot."
            : "You returned from the payment page. Payment submitted — waiting for confirmation. This page does not confirm payment by itself."}
        </Alert>
      )}

      {checkoutReturn === "cancel" && (
        <Alert variant="info" className="mb-6 max-w-3xl">
          Checkout was cancelled. No payment was made and this rent record is
          unchanged.
        </Alert>
      )}

      {reminderSent && (
        <Alert variant="success" className="mb-6 max-w-3xl">
          {user?.isDemo
            ? `Rent reminder (${reminderSent}) simulated — no email was sent.`
            : `Rent reminder (${reminderSent}) sent successfully.`}
        </Alert>
      )}

      {reminderPreview && !reminderPreview.canSend && (
        <Alert variant="warning" className="mb-6 max-w-3xl">
          {reminderPreview.missingEmail
            ? "This tenant does not have an email address — reminders cannot be sent."
            : reminderPreview.eligibleKinds.length === 0
              ? "This payment is not eligible for a reminder right now."
              : "All eligible reminder types have already been sent for this payment."}
        </Alert>
      )}

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Payment details</CardTitle>
          <PaymentStatusBadge payment={payment} />
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Tenant
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {payment.tenant?.full_name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Property
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {payment.property?.name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Amount
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {formatCurrencyPrecise(payment.amount)}
                {payment.status === "partial" && tenantMonthlyRent != null && (
                  <span className="ml-1 text-xs font-normal text-slate-500">
                    of {formatCurrency(tenantMonthlyRent)} expected
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Outstanding
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {outstanding > 0
                  ? formatCurrencyPrecise(outstanding)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Due date
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {formatDate(payment.due_date)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Paid on
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {formatDate(payment.payment_date)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Payment method
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {formatPaymentMethod(payment.payment_method)}
              </dd>
            </div>
            {payment.notes && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Notes
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                  {formatEmpty(payment.notes)}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {stripeStatus &&
        (stripeStatus.isDemo || stripeStatus.sessions.length > 0) && (
        <Card className="mt-6 max-w-3xl">
          <CardHeader>
            <CardTitle>Payment collection</CardTitle>
          </CardHeader>
          <CardContent>
            <StripeCheckoutStatusCard status={stripeStatus} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
