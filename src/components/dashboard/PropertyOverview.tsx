import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, titleCase } from "@/lib/utils";
import { Building2, ChevronRight } from "lucide-react";
import type { Property } from "@/lib/types/domain";

export function PropertyOverview({ properties }: { properties: Property[] }) {
  const items = properties.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property overview</CardTitle>
        <Link
          href="/dashboard/properties"
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Building2}
              title="No properties yet"
              description="Add your first property to start tracking units and rent."
              actionLabel="Add Property"
              actionHref="/dashboard/properties/new"
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((property) => (
              <li key={property.id}>
                <Link
                  href={`/dashboard/properties/${property.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {property.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {property.city}, {property.state} ·{" "}
                      {titleCase(property.property_type)} · {property.units}{" "}
                      unit{property.units === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(property.monthly_rent)}
                    </span>
                    <StatusBadge status={property.status} kind="property" />
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
