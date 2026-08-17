import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  IndianRupee,
  PlusCircle,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/Alert";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Pagination } from "@/components/ui/Pagination";
import { PaymentStatusBadge } from "@/components/ui/PaymentStatusBadge";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  formatCurrency,
  formatCurrencyPrecise,
  formatDate,
  formatPaymentMethod,
} from "@/lib/utils";
import { getEffectivePaymentStatus } from "@/lib/services/payment-status";
import { listRentPaymentsPage } from "@/lib/services/rent-payments";
import { listTenants } from "@/lib/services/tenants";
import { listProperties } from "@/lib/services/properties";
import { getRecentMonthOptions, parseListQuery } from "@/lib/list-query";

function safeCollectionRate(collected: number, outstanding: number): number {
  const total = collected + outstanding;
  if (total <= 0) return 0;
  return Math.round((collected / total) * 100);
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseListQuery(params);
  const monthOptions = getRecentMonthOptions(36);

  const [paymentsResult, tenantsResult, propertiesResult] =
    await Promise.all([
      listRentPaymentsPage(query),
      listTenants(),
      listProperties(),
    ]);

  const { data: result, error } = paymentsResult;
  const list = result?.items ?? [];
  const tenantRentById = new Map(
    (tenantsResult.data ?? []).map((t) => [t.id, t.monthly_rent] as const),
  );
  const hasFilters = Boolean(
    query.q || query.status || query.propertyId || query.month,
  );
  const propertyOptions =
    propertiesResult.data?.map((p) => ({ value: p.id, label: p.name })) ?? [];

  const allPayments = list;
  const totalCollected = allPayments
    .filter((p) => getEffectivePaymentStatus(p) === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = allPayments
    .filter((p) => {
      const s = getEffectivePaymentStatus(p);
      return s === "pending" || s === "partial" || s === "late";
    })
    .reduce(
      (sum, p) =>
        sum +
        (getEffectivePaymentStatus(p) === "paid"
          ? 0
          : getEffectivePaymentStatus(p) === "partial"
            ? Math.max(
                (tenantRentById.get(p.tenant_id) ?? p.amount) - p.amount,
                0,
              )
            : p.amount),
      0,
    );
  const totalOverdue = allPayments
    .filter((p) => getEffectivePaymentStatus(p) === "late")
    .reduce((sum, p) => sum + p.amount, 0);
  const collectionRate = safeCollectionRate(totalCollected, totalOutstanding);

  return (
    <div>
      <PageHeader
        title="Payments"
        description={
          result
            ? `${result.total} payment${result.total === 1 ? "" : "s"} across your portfolio`
            : "Track and manage all rent payments."
        }
        actions={
          <ButtonLink href="/dashboard/rent/new">
            <PlusCircle className="h-4 w-4" />
            Record Payment
          </ButtonLink>
        }
      />

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Collected"
          value={formatCurrency(totalCollected)}
          icon={CheckCircle2}
          tone="success"
          sublabel="Successfully received"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(totalOutstanding)}
          icon={Clock}
          tone={totalOutstanding > 0 ? "warning" : "default"}
          sublabel="Awaiting payment"
        />
        <StatCard
          label="Overdue"
          value={formatCurrency(totalOverdue)}
          icon={AlertCircle}
          tone={totalOverdue > 0 ? "warning" : "default"}
          sublabel={`${allPayments.filter((p) => getEffectivePaymentStatus(p) === "late").length} late payment${allPayments.filter((p) => getEffectivePaymentStatus(p) === "late").length === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Collection Rate"
          value={`${collectionRate}%`}
          icon={IndianRupee}
          tone={collectionRate >= 80 ? "success" : collectionRate > 0 ? "warning" : "default"}
          sublabel="Collected vs expected"
        />
      </div>

      {/* Status legend */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500" aria-label="Payment status legend">
        <span className="font-medium text-slate-700">Status guide</span>
        <span className="inline-flex items-center gap-1.5"><Badge tone="green">Paid</Badge> settled</span>
        <span className="inline-flex items-center gap-1.5"><Badge tone="blue">Pending</Badge> open</span>
        <span className="inline-flex items-center gap-1.5"><Badge tone="red">Overdue</Badge> needs follow-up</span>
      </div>

      {/* Filters */}
      <ListToolbar
        query={query}
        searchPlaceholder="Search tenant or property…"
        statusOptions={[
          { value: "open", label: "Open (unpaid)" },
          { value: "paid", label: "Paid" },
          { value: "pending", label: "Pending" },
          { value: "late", label: "Late" },
          { value: "partial", label: "Partial" },
        ]}
        propertyOptions={propertyOptions}
        monthOptions={monthOptions}
        sortOptions={[
          { value: "due_date", label: "Due date" },
          { value: "amount", label: "Amount" },
          { value: "status", label: "Status" },
          { value: "created_at", label: "Date recorded" },
        ]}
      />

      {/* Payment table */}
      {error ? (
        <ErrorState message={error} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={hasFilters ? "No payments match your filters" : "No payments recorded yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Payments will appear here once you record your first rent payment."
          }
          actionLabel={hasFilters ? undefined : "Record Payment"}
          actionHref={hasFilters ? undefined : "/dashboard/rent/new"}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Tenant</th>
                  <th className="px-5 py-3 font-medium">Property</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Outstanding</th>
                  <th className="px-5 py-3 font-medium">Due date</th>
                  <th className="px-5 py-3 font-medium">Paid on</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((payment) => {
                  const tenantRent = tenantRentById.get(payment.tenant_id);
                  const effectiveStatus = getEffectivePaymentStatus(payment);
                  const outstanding =
                    effectiveStatus === "paid"
                      ? 0
                      : effectiveStatus === "partial" && tenantRent != null
                        ? Math.max(tenantRent - payment.amount, 0)
                        : payment.amount;

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link
                          href={`/dashboard/payments/${payment.id}`}
                          className="font-medium text-slate-900 hover:text-indigo-600"
                        >
                          {payment.tenant?.full_name ?? "Unknown tenant"}
                        </Link>
                        {payment.property?.name && (
                          <p className="text-xs text-slate-500 lg:hidden">
                            {payment.property.name}
                          </p>
                        )}
                      </td>
                      <td className="hidden px-5 py-3 text-slate-600 lg:table-cell">
                        {payment.property?.name ?? "Unknown property"}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {formatCurrencyPrecise(payment.amount)}
                        {payment.status === "partial" && tenantRent != null && (
                          <p className="text-xs font-normal text-slate-500">
                            of {formatCurrency(tenantRent)}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {outstanding > 0
                          ? formatCurrencyPrecise(outstanding)
                          : "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {formatDate(payment.due_date)}
                      </td>
                      <td className="hidden px-5 py-3 text-slate-600 sm:table-cell">
                        {formatDate(payment.payment_date)}
                      </td>
                      <td className="hidden px-5 py-3 text-slate-600 md:table-cell">
                        {formatPaymentMethod(payment.payment_method)}
                      </td>
                      <td className="px-5 py-3">
                        <PaymentStatusBadge payment={payment} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {result && (
            <Pagination
              basePath="/dashboard/payments"
              query={query}
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
            />
          )}
        </Card>
      )}
    </div>
  );
}
