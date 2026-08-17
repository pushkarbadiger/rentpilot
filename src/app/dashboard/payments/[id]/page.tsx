import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  MapPin,
  Receipt,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PaymentStatusBadge } from "@/components/ui/PaymentStatusBadge";
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

export default async function PaymentDetailPage({
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
      <Link
        href="/dashboard/payments"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Payments
      </Link>

      <PageHeader
        title="Payment details"
        description={`${payment.tenant?.full_name ?? "Unknown tenant"} · ${payment.property?.name ?? "Unknown property"}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Payment information</CardTitle>
            <PaymentStatusBadge payment={payment} />
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <User className="h-3 w-3" />
                  Tenant
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900">
                  {payment.tenant?.full_name ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <MapPin className="h-3 w-3" />
                  Property
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900">
                  {payment.property?.name ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <Receipt className="h-3 w-3" />
                  Amount
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900">
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
                <dd className="mt-1.5 text-sm text-slate-900">
                  {outstanding > 0
                    ? formatCurrencyPrecise(outstanding)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <Calendar className="h-3 w-3" />
                  Due date
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900">
                  {formatDate(payment.due_date)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Paid on
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900">
                  {formatDate(payment.payment_date)}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <CreditCard className="h-3 w-3" />
                  Payment method
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900">
                  {formatPaymentMethod(payment.payment_method)}
                </dd>
              </div>
              {payment.notes && (
                <div className="sm:col-span-2">
                  <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <FileText className="h-3 w-3" />
                    Notes
                  </dt>
                  <dd className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">
                    {formatEmpty(payment.notes)}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href={`/dashboard/tenants/${payment.tenant_id}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
            >
              <User className="h-4 w-4 text-slate-400" />
              View tenant profile
            </Link>
            <Link
              href={`/dashboard/properties/${payment.property_id}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
            >
              <MapPin className="h-4 w-4 text-slate-400" />
              View property
            </Link>
            <Link
              href={`/dashboard/rent/${payment.id}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
            >
              <Receipt className="h-4 w-4 text-slate-400" />
              Rent tracking view
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
