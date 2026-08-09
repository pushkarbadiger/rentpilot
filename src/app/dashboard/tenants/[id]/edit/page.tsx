import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { TenantForm } from "@/components/forms/TenantForm";
import { getTenant } from "@/lib/services/tenants";
import { listProperties } from "@/lib/services/properties";
import { updateTenantAction } from "../../actions";

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: tenant, error }, { data: properties }] = await Promise.all([
    getTenant(id),
    listProperties(),
  ]);

  if (error || !tenant) notFound();

  const boundAction = updateTenantAction.bind(null, id);

  return (
    <div>
      <PageHeader title={`Edit ${tenant.full_name}`} description="Update this tenant's details." />
      <Card className="max-w-3xl">
        <CardContent>
          <TenantForm
            action={boundAction}
            tenant={tenant}
            properties={properties ?? []}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
