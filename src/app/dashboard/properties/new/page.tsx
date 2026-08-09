import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { PropertyForm } from "@/components/forms/PropertyForm";
import { createPropertyAction } from "../actions";

export default function NewPropertyPage() {
  return (
    <div>
      <PageHeader
        title="Add property"
        description="Add a new property to your portfolio."
      />
      <Card className="max-w-3xl">
        <CardContent>
          <PropertyForm action={createPropertyAction} submitLabel="Add Property" />
        </CardContent>
      </Card>
    </div>
  );
}
