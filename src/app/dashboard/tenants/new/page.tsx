import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { TenantForm } from "@/components/forms/TenantForm";
import { listProperties } from "@/lib/services/properties";
import { createTenantAction } from "../actions";

export default async function NewTenantPage() {
  const { data: properties } = await listProperties();

  return (
    <div>
      <PageHeader title="Add tenant" description="Add a new tenant and assign them to a property." />
      <Card className="max-w-3xl">
        <CardContent>
          <TenantForm
            action={createTenantAction}
            properties={properties ?? []}
            submitLabel="Add Tenant"
          />
        </CardContent>
      </Card>
    </div>
  );
}
