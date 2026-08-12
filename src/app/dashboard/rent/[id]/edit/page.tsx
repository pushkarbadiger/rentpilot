import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { RentPaymentForm } from "@/components/forms/RentPaymentForm";
import { DeleteRentPaymentButton } from "@/components/forms/DeleteRentPaymentButton";
import { getRentPayment } from "@/lib/services/rent-payments";
import { listTenants } from "@/lib/services/tenants";
import { listProperties } from "@/lib/services/properties";
import { updateRentPaymentAction } from "../../actions";

export default async function EditRentPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: payment, error }, { data: tenants }, { data: properties }] =
    await Promise.all([getRentPayment(id), listTenants(), listProperties()]);

  if (error || !payment) notFound();

  const boundAction = updateRentPaymentAction.bind(null, id);

  return (
    <div>
      <PageHeader
        title="Edit payment"
        description="Update this rent payment record."
        actions={
          <DeleteRentPaymentButton
            id={payment.id}
            tenantName={payment.tenant?.full_name ?? "Unknown tenant"}
          />
        }
      />
      <Card className="max-w-3xl">
        <CardContent>
          <RentPaymentForm
            action={boundAction}
            payment={payment}
            tenants={tenants ?? []}
            properties={properties ?? []}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
