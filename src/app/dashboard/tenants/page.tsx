import Link from "next/link";
import { ChevronRight, PlusCircle, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/Alert";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listTenants } from "@/lib/services/tenants";

export default async function TenantsPage() {
  const { data: tenants, error } = await listTenants();

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

      {error ? (
        <ErrorState message={error} />
      ) : !tenants || tenants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tenants yet"
          description="Add your first tenant to start tracking leases and rent."
          actionLabel="Add Tenant"
          actionHref="/dashboard/tenants/new"
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
        </Card>
      )}
    </div>
  );
}
