import Link from "next/link";
import { Building2, ChevronRight, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/Alert";
import { ListToolbar } from "@/components/ui/ListToolbar";
import { Pagination } from "@/components/ui/Pagination";
import { formatCurrency, titleCase } from "@/lib/utils";
import { parseListQuery } from "@/lib/list-query";
import { listPropertiesPage } from "@/lib/services/properties";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseListQuery(params);
  const { data: result, error } = await listPropertiesPage(query);

  const properties = result?.items ?? [];
  const hasFilters = Boolean(query.q || query.status);

  return (
    <div>
      <PageHeader
        title="Properties"
        description="Manage every property in your portfolio."
        actions={
          <ButtonLink href="/dashboard/properties/new">
            <PlusCircle className="h-4 w-4" />
            Add Property
          </ButtonLink>
        }
      />

      <ListToolbar
        query={query}
        searchPlaceholder="Search name, address, city…"
        statusOptions={[
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]}
        sortOptions={[
          { value: "created_at", label: "Date added" },
          { value: "name", label: "Name" },
          { value: "monthly_rent", label: "Monthly rent" },
          { value: "units", label: "Units" },
          { value: "status", label: "Status" },
        ]}
      />

      {error ? (
        <ErrorState message={error} />
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasFilters ? "No matching properties" : "No properties yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Add your first property to start tracking units, rent, and tenants."
          }
          actionLabel={hasFilters ? undefined : "Add Property"}
          actionHref={hasFilters ? undefined : "/dashboard/properties/new"}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Property</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Units</th>
                  <th className="px-5 py-3 font-medium">Monthly Rent</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.map((property) => (
                  <tr key={property.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/properties/${property.id}`}
                        className="font-medium text-slate-900 hover:text-indigo-600"
                      >
                        {property.name}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {property.city}, {property.state}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {titleCase(property.property_type)}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{property.units}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {formatCurrency(property.monthly_rent)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={property.status} kind="property" />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/dashboard/properties/${property.id}`}>
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
              basePath="/dashboard/properties"
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
