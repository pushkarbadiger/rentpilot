import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  DoorOpen,
  Home,
  MapPin,
  Pencil,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeletePropertyButton } from "@/components/forms/DeletePropertyButton";
import {
  formatCurrency,
  formatCurrencyPrecise,
  formatDate,
  titleCase,
} from "@/lib/utils";
import { getProperty } from "@/lib/services/properties";
import { listTenants } from "@/lib/services/tenants";
import { listRentPayments } from "@/lib/services/rent-payments";
import { PaymentStatusBadge } from "@/components/ui/PaymentStatusBadge";
import { getEffectivePaymentStatus } from "@/lib/services/payment-status";
import { getPaymentOutstandingAmount } from "@/lib/services/metrics";

export default async function PropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [
    { data: property, error },
    { data: tenants },
    { data: payments },
  ] = await Promise.all([
    getProperty(id),
    listTenants(),
    listRentPayments(),
  ]);

  if (error || !property) notFound();

  const propertyTenants = (tenants ?? []).filter(
    (t) => t.property_id === property.id
  );
  const activeTenants = propertyTenants.filter((t) => t.status === "active");
  const activeTenantCount = activeTenants.length;
  const occupancyRate =
    property.units > 0
      ? Math.min(100, Math.round((activeTenantCount / property.units) * 100))
      : 0;
  const vacantUnits = Math.max(property.units - activeTenantCount, 0);
  const expectedRent = activeTenants.reduce(
    (sum, t) => sum + t.monthly_rent,
    0
  );

  const propertyPayments = (payments ?? [])
    .filter((payment) => payment.property_id === property.id)
    .sort(
      (a, b) =>
        new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
    );

  // Financial snapshot
  const collected = propertyPayments
    .filter((p) => getEffectivePaymentStatus(p) === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const tenantRentById = new Map(
    activeTenants.map((t) => [t.id, t.monthly_rent] as const)
  );
  const outstanding = propertyPayments
    .filter((p) => getEffectivePaymentStatus(p) !== "paid")
    .reduce(
      (sum, p) =>
        sum + getPaymentOutstandingAmount(p, tenantRentById.get(p.tenant_id)),
      0,
    );
  const overdue = propertyPayments
    .filter((p) => getEffectivePaymentStatus(p) === "late")
    .reduce((sum, p) => sum + p.amount, 0);
  const collectionTotal = collected + outstanding;
  const collectionRate =
    collectionTotal > 0
      ? Math.round((collected / collectionTotal) * 100)
      : 0;

  const recentPayments = propertyPayments.slice(0, 8);

  return (
    <div>
      <Link
        href="/dashboard/properties"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Properties
      </Link>

      <PageHeader
        title={property.name}
        description={
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {property.address}, {property.city}, {property.state}{" "}
            {property.postal_code}
          </span>
        }
        actions={
          <>
            <ButtonLink
              href={`/dashboard/properties/${property.id}/edit`}
              variant="outline"
              size="sm"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </ButtonLink>
            <DeletePropertyButton id={property.id} name={property.name} />
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Occupancy"
          value={`${occupancyRate}%`}
          icon={Home}
          tone={occupancyRate >= 80 ? "success" : occupancyRate > 0 ? "warning" : "default"}
          sublabel={`${activeTenantCount} of ${property.units} units`}
        />
        <StatCard
          label="Expected rent"
          value={formatCurrency(expectedRent)}
          icon={Receipt}
          sublabel="Active tenants"
        />
        <StatCard
          label="Vacant units"
          value={String(vacantUnits)}
          icon={DoorOpen}
          tone={vacantUnits > 0 ? "warning" : "success"}
          sublabel={
            vacantUnits === 0
              ? "Fully occupied"
              : `${vacantUnits} available`
          }
        />
        <StatCard
          label="Tenants"
          value={String(activeTenantCount)}
          icon={Users}
          sublabel={`${propertyTenants.length} total`}
        />
      </div>

      {/* Financial snapshot */}
      {propertyPayments.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Collected"
            value={formatCurrency(collected)}
            icon={TrendingUp}
            tone="success"
            sublabel="Total received"
          />
          <StatCard
            label="Outstanding"
            value={formatCurrencyPrecise(outstanding)}
            icon={AlertCircle}
            tone={outstanding > 0 ? "warning" : "success"}
            sublabel="Awaiting payment"
          />
          <StatCard
            label="Overdue"
            value={formatCurrency(overdue)}
            icon={AlertCircle}
            tone={overdue > 0 ? "warning" : "success"}
            sublabel={
              overdue > 0
                ? `${propertyPayments.filter((p) => getEffectivePaymentStatus(p) === "late").length} late`
                : "No overdue"
            }
          />
          <StatCard
            label="Collection rate"
            value={`${collectionRate}%`}
            icon={TrendingUp}
            tone={collectionRate >= 80 ? "success" : collectionRate > 0 ? "warning" : "default"}
            sublabel={`${propertyPayments.length} payment${propertyPayments.length === 1 ? "" : "s"} total`}
          />
        </div>
      )}

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
                <dd className="mt-1.5 text-sm font-medium text-slate-900">
                  {titleCase(property.property_type)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Total units
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900">
                  {property.units}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Monthly rent (listed)
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900">
                  {formatCurrency(property.monthly_rent)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Added
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900">
                  {formatDate(property.created_at)}
                </dd>
              </div>
              {property.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Notes
                  </dt>
                  <dd className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">
                    {property.notes}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tenants</CardTitle>
            {activeTenantCount > 0 && (
              <span className="text-xs text-slate-500">
                {activeTenantCount} active
              </span>
            )}
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
                      className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {tenant.full_name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {tenant.unit ?? "No unit"}
                          {tenant.monthly_rent > 0 && (
                            <span className="ml-1.5">
                              · {formatCurrency(tenant.monthly_rent)}
                            </span>
                          )}
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
          {propertyPayments.length > 0 && (
            <Link
              href={`/dashboard/rent?propertyId=${property.id}`}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              View all ({propertyPayments.length})
            </Link>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {recentPayments.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Receipt}
                title="No payments yet"
                description="Rent payment records for this property will appear here."
                actionLabel="Record payment"
                actionHref="/dashboard/rent/new"
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentPayments.map((payment) => (
                <li key={payment.id}>
                  <Link
                    href={`/dashboard/rent/${payment.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {payment.tenant?.full_name ?? "Unknown tenant"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Due {formatDate(payment.due_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(payment.amount)}
                      </span>
                      <PaymentStatusBadge payment={payment} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
