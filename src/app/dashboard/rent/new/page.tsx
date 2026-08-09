import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { RentPaymentForm } from "@/components/forms/RentPaymentForm";
import { listTenants } from "@/lib/services/tenants";
import { listProperties } from "@/lib/services/properties";
import { createRentPaymentAction } from "../actions";

export default async function NewRentPaymentPage() {
  const [{ data: tenants }, { data: properties }] = await Promise.all([
    listTenants(),
    listProperties(),
  ]);

  return (
    <div>
      <PageHeader title="Record payment" description="Log a rent payment for a tenant." />
      <Card className="max-w-3xl">
        <CardContent>
          <RentPaymentForm
            action={createRentPaymentAction}
            tenants={tenants ?? []}
            properties={properties ?? []}
            submitLabel="Record Payment"
          />
        </CardContent>
      </Card>
    </div>
  );
}
