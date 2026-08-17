import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, titleCase } from "@/lib/utils";
import {
  Building2,
  ChevronRight,
  MapPin,
  DoorOpen,
} from "lucide-react";
import type { Property } from "@/lib/types/domain";

export function PropertyOverview({ properties }: { properties: Property[] }) {
  const items = properties.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Property overview</CardTitle>
          {items.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              {properties.length} total propert{properties.length === 1 ? "y" : "ies"}
            </p>
          )}
        </div>
        {items.length > 0 && (
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700"
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
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
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Building2 className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {property.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {property.city}, {property.state}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span>{titleCase(property.property_type)}</span>
                        <span className="text-slate-300">·</span>
                        <span className="flex items-center gap-1">
                          <DoorOpen className="h-3 w-3" />
                          {property.units} unit{property.units === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
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
