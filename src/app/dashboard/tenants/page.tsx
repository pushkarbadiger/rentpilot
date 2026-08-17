import Link from "next/link";
import {
  AlertCircle,
  ChevronRight,
  DoorOpen,
  Mail,
  Phone,
  PlusCircle,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { PaymentStatusBadge } from "@/components/ui/PaymentStatusBadge";
import { ErrorState } from "@/components/ui/Alert";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Pagination } from "@/components/ui/Pagination";
import {
  formatCurrency,
  formatCurrencyPrecise,
  formatDate,
} from "@/lib/utils";
import { getEffectivePaymentStatus } from "@/lib/services/payment-status";
import { getPaymentOutstandingAmount } from "@/lib/services/metrics";
import { parseListQuery } from "@/lib/list-query";
import { listProperties } from "@/lib/services/properties";
import { listTenantsPage } from "@/lib/services/tenants";
import { listRentPayments } from "@/lib/services/rent-payments";


export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseListQuery(params);
  const [
    { data: result, error },
    { data: properties },
    { data: payments },
  ] = await Promise.all([
    listTenantsPage(query),
    listProperties(),
    listRentPayments(),
  ]);

  const tenants = result?.items ?? [];
  const hasFilters = Boolean(query.q || query.status || query.propertyId);
  const propertyOptions =
    properties?.map((p) => ({ value: p.id, label: p.name })) ?? [];

  const latestPaymentByTenant = new Map<
    string,
    (typeof payments extends (infer T)[] | null ? T : never)
  >();
  for (const payment of payments ?? []) {
    const current = latestPaymentByTenant.get(payment.tenant_id);
    if (
      !current ||
      new Date(payment.due_date).getTime() >
        new Date(current.due_date).getTime()
    ) {
      latestPaymentByTenant.set(payment.tenant_id, payment);
    }
  }

  // Compute outstanding/overdue per tenant
  const tenantFinancials = new Map<
    string,
    { outstanding: number; overdue: number; overdueCount: number }
  >();
  for (const payment of payments ?? []) {
    const existing = tenantFinancials.get(payment.tenant_id) ?? {
      outstanding: 0,
      overdue: 0,
      overdueCount: 0,
    };
    const effective = getEffectivePaymentStatus(payment);
    if (effective !== "paid") {
      const tenant = tenants.find(
        (t) => t.id === payment.tenant_id,
      );
      const outstanding = getPaymentOutstandingAmount(
        payment,
        tenant?.monthly_rent,
      );
      existing.outstanding += outstanding;
      if (effective === "late") {
        existing.overdue += payment.amount;
        existing.overdueCount += 1;
      }
    }
    tenantFinancials.set(payment.tenant_id, existing);
  }

  return (
    <div>
      <PageHeader
        title="Tenants"
        description={
          result
            ? `${result.total} ${result.total === 1 ? "tenant" : "tenants"} across your portfolio.`
            : "Manage tenant information and lease details."
        }
        actions={
          <ButtonLink href="/dashboard/tenants/new">
            <PlusCircle className="h-4 w-4" />
            Add Tenant
          </ButtonLink>
        }
      />

      <ListToolbar
        query={query}
        searchPlaceholder="Search name, email, phone…"
        statusOptions={[
          { value: "active", label: "Active" },
          { value: "pending", label: "Pending" },
          { value: "former", label: "Former" },
        ]}
        propertyOptions={propertyOptions}
        sortOptions={[
          { value: "created_at", label: "Date added" },
          { value: "full_name", label: "Name" },
          { value: "monthly_rent", label: "Monthly rent" },
          { value: "lease_end", label: "Lease end" },
          { value: "status", label: "Status" },
        ]}
      />

      {error ? (
        <ErrorState message={error} />
      ) : tenants.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? "No matching tenants" : "No tenants yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Add your first tenant to start tracking leases and rent."
          }
          actionLabel={hasFilters ? undefined : "Add Tenant"}
          actionHref={hasFilters ? undefined : "/dashboard/tenants/new"}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Tenant</th>
                  <th className="px-5 py-3 font-medium">Property</th>
                  <th className="px-5 py-3 font-medium">Lease</th>
                  <th className="px-5 py-3 font-medium">Monthly Rent</th>
                  <th className="px-5 py-3 font-medium">Outstanding</th>
                  <th className="px-5 py-3 font-medium">Payment</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((tenant) => {
                  const latestPayment = latestPaymentByTenant.get(tenant.id);

                  return (
                    <tr
                      key={tenant.id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/dashboard/tenants/${tenant.id}`}
                          className="group flex items-center gap-3"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
                            <Users className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 transition-colors group-hover:text-indigo-600">
                              {tenant.full_name}
                            </p>
                            {tenant.email && (
                              <p className="flex items-center gap-1 text-xs text-slate-500">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {tenant.email}
                                </span>
                              </p>
                            )}
                            {!tenant.email && tenant.phone && (
                              <p className="flex items-center gap-1 text-xs text-slate-500">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {tenant.phone}
                                </span>
                              </p>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        {tenant.property?.name ? (
                          <div>
                            <p className="text-sm text-slate-700">
                              {tenant.property.name}
                            </p>
                            {tenant.unit && (
                              <p className="flex items-center gap-1 text-xs text-slate-500">
                                <DoorOpen className="h-3 w-3 shrink-0" />
                                {tenant.unit}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {tenant.lease_end ? (
                          <span className="text-sm text-slate-600">
                            {formatDate(tenant.lease_end)}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {formatCurrency(tenant.monthly_rent)}
                      </td>
                      <td className="px-5 py-3.5">
                        {(() => {
                          const financials = tenantFinancials.get(tenant.id);
                          if (!financials || financials.outstanding === 0) {
                            return (
                              <span className="text-xs text-slate-400">
                                All paid
                              </span>
                            );
                          }
                          return (
                            <div>
                              <span className="text-sm font-medium text-slate-900">
                                {formatCurrencyPrecise(financials.outstanding)}
                              </span>
                              {financials.overdueCount > 0 && (
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-red-600">
                                  <AlertCircle className="h-3 w-3" />
                                  {financials.overdueCount} overdue
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3.5">
                        {latestPayment ? (
                          <PaymentStatusBadge payment={latestPayment} />
                        ) : (
                          <span className="text-xs text-slate-400">
                            No record
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={tenant.status} kind="tenant" />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/dashboard/tenants/${tenant.id}`}
                          className="inline-flex items-center rounded-lg px-2 py-1 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                        >
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {result && (
            <Pagination
              basePath="/dashboard/tenants"
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
