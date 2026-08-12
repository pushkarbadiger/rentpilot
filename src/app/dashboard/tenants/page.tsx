import Link from "next/link";
import { ChevronRight, PlusCircle, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/Alert";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Pagination } from "@/components/ui/Pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { parseListQuery } from "@/lib/list-query";
import { listProperties } from "@/lib/services/properties";
import { listTenantsPage } from "@/lib/services/tenants";

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseListQuery(params);
  const [{ data: result, error }, { data: properties }] = await Promise.all([
    listTenantsPage(query),
    listProperties(),
  ]);

  const tenants = result?.items ?? [];
  const hasFilters = Boolean(query.q || query.status || query.propertyId);
  const propertyOptions =
    properties?.map((p) => ({ value: p.id, label: p.name })) ?? [];

  return (
    <div>
      <PageHeader
        title="Tenants"
        description="Manage tenant information and lease details."
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
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Tenant</th>
                  <th className="px-5 py-3 font-medium">Property</th>
                  <th className="px-5 py-3 font-medium">Lease ends</th>
                  <th className="px-5 py-3 font-medium">Monthly Rent</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/tenants/${tenant.id}`}
                        className="font-medium text-slate-900 hover:text-indigo-600"
                      >
                        {tenant.full_name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {tenant.email || "No email on file"}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {tenant.property?.name ?? "Unassigned"}
                      {tenant.unit ? ` · ${tenant.unit}` : ""}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {formatDate(tenant.lease_end)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {formatCurrency(tenant.monthly_rent)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={tenant.status} kind="tenant" />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/dashboard/tenants/${tenant.id}`}>
                        <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                      </Link>
                    </td>
                  </tr>
                ))}
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
