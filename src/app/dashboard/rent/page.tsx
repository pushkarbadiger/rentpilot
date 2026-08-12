import Link from "next/link";
import { PlusCircle, Receipt, Wallet, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/Alert";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Pagination } from "@/components/ui/Pagination";
import { PaymentStatusBadge } from "@/components/ui/PaymentStatusBadge";
import {
  formatCurrency,
  formatCurrencyPrecise,
  formatDate,
  formatPaymentMethod,
} from "@/lib/utils";
import { getPaymentOutstandingAmount } from "@/lib/services/metrics";
import { getRentMonthMetrics } from "@/lib/services/dashboard";
import { listRentPaymentsPage } from "@/lib/services/rent-payments";
import { listTenants } from "@/lib/services/tenants";
import { listProperties } from "@/lib/services/properties";
import { getRecentMonthOptions, parseListQuery } from "@/lib/list-query";
import { DeleteRentPaymentButton } from "@/components/forms/DeleteRentPaymentButton";

export default async function RentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseListQuery(params);

  const [paymentsResult, metricsResult, tenantsResult, propertiesResult] =
    await Promise.all([
      listRentPaymentsPage(query),
      getRentMonthMetrics(),
      listTenants(),
      listProperties(),
    ]);

  const { data: result, error } = paymentsResult;
  const list = result?.items ?? [];
  const metrics = metricsResult.data;
  const tenantRentById = new Map(
    (tenantsResult.data ?? []).map((t) => [t.id, t.monthly_rent] as const)
  );
  const hasFilters = Boolean(
    query.q || query.status || query.propertyId || query.month
  );
  const propertyOptions =
    propertiesResult.data?.map((p) => ({ value: p.id, label: p.name })) ?? [];

  return (
    <div>
      <PageHeader
        title="Rent tracking"
        description="Monitor rent collection across your portfolio."
        actions={
          <ButtonLink href="/dashboard/rent/new">
            <PlusCircle className="h-4 w-4" />
            Record Payment
          </ButtonLink>
        }
      />

      {metrics && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Expected this month"
            value={formatCurrency(metrics.expectedRent)}
            icon={Wallet}
          />
          <StatCard
            label="Collected this month"
            value={formatCurrency(metrics.rentCollected)}
            icon={CheckCircle2}
            tone="success"
          />
          <StatCard
            label="Outstanding this month"
            value={formatCurrency(metrics.outstandingRent)}
            icon={Clock}
            tone={metrics.outstandingRent > 0 ? "warning" : "default"}
          />
          <StatCard
            label="Late this month"
            value={String(metrics.latePayments)}
            icon={AlertCircle}
            tone={metrics.latePayments > 0 ? "warning" : "default"}
          />
        </div>
      )}

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
        monthOptions={getRecentMonthOptions()}
        sortOptions={[
          { value: "due_date", label: "Due date" },
          { value: "amount", label: "Amount" },
          { value: "status", label: "Status" },
          { value: "created_at", label: "Date recorded" },
        ]}
      />

      {error ? (
        <ErrorState message={error} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={hasFilters ? "No matching payments" : "No rent payments recorded"}
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Record your first rent payment to start tracking collections."
          }
          actionLabel={hasFilters ? undefined : "Record Payment"}
          actionHref={hasFilters ? undefined : "/dashboard/rent/new"}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
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
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((payment) => {
                  const tenantRent = tenantRentById.get(payment.tenant_id);
                  const outstanding = getPaymentOutstandingAmount(
                    payment,
                    tenantRent
                  );

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link
                          href={`/dashboard/rent/${payment.id}`}
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
                      <td className="px-5 py-3 text-right">
                        <DeleteRentPaymentButton
                          id={payment.id}
                          tenantName={
                            payment.tenant?.full_name ?? "Unknown tenant"
                          }
                          compact
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {result && (
            <Pagination
              basePath="/dashboard/rent"
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
