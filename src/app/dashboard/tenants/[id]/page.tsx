import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Receipt,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { PaymentStatusBadge } from "@/components/ui/PaymentStatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeleteTenantButton } from "@/components/forms/DeleteTenantButton";
import { formatCurrency, formatCurrencyPrecise, formatDate } from "@/lib/utils";
import { getTenant } from "@/lib/services/tenants";
import { listRentPayments } from "@/lib/services/rent-payments";
import { getEffectivePaymentStatus } from "@/lib/services/payment-status";
import { getPaymentOutstandingAmount } from "@/lib/services/metrics";

export default async function TenantDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: tenant, error }, { data: payments }] = await Promise.all([
    getTenant(id),
    listRentPayments(),
  ]);

  if (error || !tenant) notFound();

  const tenantPayments = (payments ?? [])
    .filter((p) => p.tenant_id === tenant.id)
    .sort(
      (a, b) =>
        new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
    );

  const paidCount = tenantPayments.filter(
    (p) => getEffectivePaymentStatus(p) === "paid"
  ).length;
  const overdueCount = tenantPayments.filter(
    (p) => getEffectivePaymentStatus(p) === "late"
  ).length;

  const totalOutstanding = tenantPayments
    .filter((p) => getEffectivePaymentStatus(p) !== "paid")
    .reduce(
      (sum, p) => sum + getPaymentOutstandingAmount(p, tenant.monthly_rent),
      0,
    );
  const totalOverdue = tenantPayments
    .filter((p) => getEffectivePaymentStatus(p) === "late")
    .reduce((sum, p) => sum + p.amount, 0);

  const latestPayment = tenantPayments[0] ?? null;
  const currentStatus = latestPayment
    ? getEffectivePaymentStatus(latestPayment)
    : null;

  return (
    <div>
      <Link
        href="/dashboard/tenants"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Tenants
      </Link>

      <PageHeader
        title={tenant.full_name}
        description={
          <span className="flex items-center gap-3">
            <StatusBadge status={tenant.status} kind="tenant" />
            {tenant.property?.name && (
              <span className="flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                {tenant.property.name}
                {tenant.unit && (
                  <span className="text-slate-400"> · {tenant.unit}</span>
                )}
              </span>
            )}
          </span>
        }
        actions={
          <>
            <ButtonLink
              href={`/dashboard/tenants/${tenant.id}/edit`}
              variant="outline"
              size="sm"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </ButtonLink>
            <DeleteTenantButton id={tenant.id} name={tenant.full_name} />
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Monthly rent"
          value={formatCurrency(tenant.monthly_rent)}
          icon={Wallet}
        />
        <StatCard
          label="Outstanding"
          value={totalOutstanding > 0 ? formatCurrencyPrecise(totalOutstanding) : formatCurrency(0)}
          icon={AlertCircle}
          tone={totalOutstanding > 0 ? "warning" : "success"}
          sublabel={
            totalOverdue > 0
              ? `${formatCurrency(totalOverdue)} overdue`
              : "All clear"
          }
        />
        <StatCard
          label="Payments"
          value={String(tenantPayments.length)}
          icon={Calendar}
          sublabel={`${paidCount} paid${overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}`}
        />
        <StatCard
          label="Lease status"
          value={
            tenant.status === "active"
              ? "Active"
              : tenant.status === "former"
                ? "Former"
                : tenant.lease_end
                  ? "Has end date"
                  : "No lease"
          }
          icon={tenant.status === "active" ? CheckCircle2 : Calendar}
          tone={
            tenant.status === "active"
              ? "success"
              : tenant.status === "former"
                ? "default"
                : "default"
          }
          sublabel={
            tenant.lease_end
              ? `Ends ${formatDate(tenant.lease_end)}`
              : "No lease end set"
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tenant details</CardTitle>
            {currentStatus && (
              <PaymentStatusBadge
                payment={latestPayment}
              />
            )}
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {tenant.email && (
                <div>
                  <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <Mail className="h-3 w-3" />
                    Email
                  </dt>
                  <dd className="mt-1.5 text-sm font-medium text-slate-900">
                    {tenant.email}
                  </dd>
                </div>
              )}
              {tenant.phone && (
                <div>
                  <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <Phone className="h-3 w-3" />
                    Phone
                  </dt>
                  <dd className="mt-1.5 text-sm font-medium text-slate-900">
                    {tenant.phone}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Property
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900">
                  {tenant.property?.name ?? "Unassigned"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Unit
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900">
                  {tenant.unit || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Monthly rent
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900">
                  {formatCurrency(tenant.monthly_rent)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Security deposit
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900">
                  {formatCurrency(tenant.security_deposit)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Lease start
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900">
                  {formatDate(tenant.lease_start)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Lease end
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900">
                  {formatDate(tenant.lease_end)}
                </dd>
              </div>
              {tenant.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Notes
                  </dt>
                  <dd className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">
                    {tenant.notes}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment history</CardTitle>
            {tenantPayments.length > 0 && (
              <Link
                href={`/dashboard/rent?tenantId=${tenant.id}`}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                View all
              </Link>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {tenantPayments.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={Receipt}
                  title="No payments yet"
                  description="Record this tenant's first rent payment."
                  actionLabel="Record Payment"
                  actionHref="/dashboard/rent/new"
                />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {tenantPayments.map((payment) => (
                  <li key={payment.id}>
                    <Link
                      href={`/dashboard/rent/${payment.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Due {formatDate(payment.due_date)}
                        </p>
                      </div>
                      <PaymentStatusBadge payment={payment} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
