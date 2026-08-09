import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Receipt } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeleteTenantButton } from "@/components/forms/DeleteTenantButton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getTenant } from "@/lib/services/tenants";
import { listRentPayments } from "@/lib/services/rent-payments";

export default async function TenantDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: tenant, error }, { data: payments }] = await Promise.all([
    getTenant(id),
    listRentPayments(),
  ]);

  if (error || !tenant) notFound();

  const tenantPayments = (payments ?? []).filter((p) => p.tenant_id === tenant.id);

  return (
    <div>
      <PageHeader
        title={tenant.full_name}
        description={tenant.property?.name ?? "No property assigned"}
        actions={
          <>
            <ButtonLink href={`/dashboard/tenants/${tenant.id}/edit`} variant="outline">
              <Pencil className="h-4 w-4" />
              Edit
            </ButtonLink>
            <DeleteTenantButton id={tenant.id} name={tenant.full_name} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tenant details</CardTitle>
            <StatusBadge status={tenant.status} kind="tenant" />
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Email
                </dt>
                <dd className="mt-1 text-sm text-slate-900">{tenant.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Phone
                </dt>
                <dd className="mt-1 text-sm text-slate-900">{tenant.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Unit
                </dt>
                <dd className="mt-1 text-sm text-slate-900">{tenant.unit || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Monthly rent
                </dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {formatCurrency(tenant.monthly_rent)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Lease start
                </dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {formatDate(tenant.lease_start)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Lease end
                </dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {formatDate(tenant.lease_end)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Security deposit
                </dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {formatCurrency(tenant.security_deposit)}
                </dd>
              </div>
              {tenant.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Notes
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                    {tenant.notes}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment history</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {tenantPayments.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={Receipt}
                  title="No payments yet"
                  description="Record this tenant's first rent payment."
                  actionLabel="Record Payment"
                  actionHref="/dashboard/rent/new"
                />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {tenantPayments.map((payment) => (
                  <li key={payment.id}>
                    <Link
                      href="/dashboard/rent"
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Due {formatDate(payment.due_date)}
                        </p>
                      </div>
                      <StatusBadge status={payment.status} kind="payment" />
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
