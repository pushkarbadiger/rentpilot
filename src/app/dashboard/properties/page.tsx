import Link from "next/link";
import { Building2, ChevronRight, DoorOpen, MapPin, PlusCircle } from "lucide-react";
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
import { listTenants } from "@/lib/services/tenants";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseListQuery(params);
  const [{ data: result, error }, { data: tenants }] = await Promise.all([
    listPropertiesPage(query),
    listTenants(),
  ]);

  const properties = result?.items ?? [];
  const hasFilters = Boolean(query.q || query.status);
  const occupiedByProperty = new Map<string, number>();
  for (const tenant of tenants ?? []) {
    if (tenant.status === "active" && tenant.property_id) {
      occupiedByProperty.set(
        tenant.property_id,
        (occupiedByProperty.get(tenant.property_id) ?? 0) + 1
      );
    }
  }

  return (
    <div>
      <PageHeader
        title="Properties"
        description={
          result
            ? `${result.total} ${result.total === 1 ? "property" : "properties"} in your portfolio.`
            : "Manage every property in your portfolio."
        }
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
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Property</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Units</th>
                  <th className="px-5 py-3 font-medium">Occupancy</th>
                  <th className="px-5 py-3 font-medium">Monthly Rent</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.map((property) => {
                  const occupied = occupiedByProperty.get(property.id) ?? 0;
                  const vacant = Math.max(property.units - occupied, 0);
                  const occupancyPct =
                    property.units > 0
                      ? Math.round((occupied / property.units) * 100)
                      : 0;

                  return (
                    <tr
                      key={property.id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/dashboard/properties/${property.id}`}
                          className="group flex items-center gap-3"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 transition-colors group-hover:text-indigo-600">
                              {property.name}
                            </p>
                            <p className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {property.city}, {property.state}
                              </span>
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {titleCase(property.property_type)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {property.units}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all ${
                                occupancyPct === 100
                                  ? "bg-emerald-500"
                                  : occupancyPct > 0
                                    ? "bg-amber-500"
                                    : "bg-slate-300"
                              }`}
                              style={{ width: `${occupancyPct}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums text-slate-600">
                            {occupied}/{property.units}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {formatCurrency(property.monthly_rent)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge
                          status={property.status}
                          kind="property"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/dashboard/properties/${property.id}`}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                        >
                          {vacant > 0 && (
                            <span className="mr-1 inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                              <DoorOpen className="h-2.5 w-2.5" />
                              {vacant}
                            </span>
                          )}
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
