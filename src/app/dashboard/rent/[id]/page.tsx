import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PaymentStatusBadge } from "@/components/ui/PaymentStatusBadge";
import { DeleteRentPaymentButton } from "@/components/forms/DeleteRentPaymentButton";
import {
  formatCurrency,
  formatCurrencyPrecise,
  formatDate,
  formatEmpty,
  formatPaymentMethod,
} from "@/lib/utils";
import { getPaymentOutstandingAmount } from "@/lib/services/metrics";
import { getRentPayment } from "@/lib/services/rent-payments";
import { getTenant } from "@/lib/services/tenants";

export default async function RentPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: payment, error } = await getRentPayment(id);

  if (error || !payment) notFound();

  const { data: tenant } = await getTenant(payment.tenant_id);
  const tenantMonthlyRent = tenant?.monthly_rent;
  const outstanding = getPaymentOutstandingAmount(payment, tenantMonthlyRent);

  return (
    <div>
      <PageHeader
        title="Rent payment"
        description={`${payment.tenant?.full_name ?? "Unknown tenant"} · ${payment.property?.name ?? "Unknown property"}`}
        actions={
          <>
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
    </div>
  );
}
