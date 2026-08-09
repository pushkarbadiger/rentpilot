import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeletePropertyButton } from "@/components/forms/DeletePropertyButton";
import { formatCurrency, formatDate, titleCase } from "@/lib/utils";
import { getProperty } from "@/lib/services/properties";
import { listTenants } from "@/lib/services/tenants";

export default async function PropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: property, error }, { data: tenants }] = await Promise.all([
    getProperty(id),
    listTenants(),
  ]);

  if (error || !property) notFound();

  const propertyTenants = (tenants ?? []).filter(
    (t) => t.property_id === property.id
  );

  return (
    <div>
      <PageHeader
        title={property.name}
        description={`${property.address}, ${property.city}, ${property.state} ${property.postal_code}`}
        actions={
          <>
            <ButtonLink
              href={`/dashboard/properties/${property.id}/edit`}
              variant="outline"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </ButtonLink>
            <DeletePropertyButton id={property.id} name={property.name} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Property details</CardTitle>
            <StatusBadge status={property.status} kind="property" />
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Type
                </dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {titleCase(property.property_type)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Units
                </dt>
                <dd className="mt-1 text-sm text-slate-900">{property.units}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Monthly rent
                </dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {formatCurrency(property.monthly_rent)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Added
                </dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {formatDate(property.created_at)}
                </dd>
              </div>
              {property.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Notes
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                    {property.notes}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenants at this property</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {propertyTenants.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={Users}
                  title="No tenants yet"
                  description="Add a tenant and assign them to this property."
                  actionLabel="Add Tenant"
                  actionHref="/dashboard/tenants/new"
                />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {propertyTenants.map((tenant) => (
                  <li key={tenant.id}>
                    <Link
                      href={`/dashboard/tenants/${tenant.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {tenant.full_name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {tenant.unit ?? "No unit set"}
                        </p>
                      </div>
                      <StatusBadge status={tenant.status} kind="tenant" />
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
