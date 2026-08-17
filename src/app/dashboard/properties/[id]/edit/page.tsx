import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { PropertyForm } from "@/components/forms/PropertyForm";
import { getProperty } from "@/lib/services/properties";
import { updatePropertyAction } from "../../actions";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: property, error } = await getProperty(id);

  if (error || !property) notFound();

  const boundAction = updatePropertyAction.bind(null, id);

  return (
    <div>
      <Link
        href={`/dashboard/properties/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {property.name}
      </Link>
      <PageHeader
        title={`Edit ${property.name}`}
        description="Update this property's details."
      />
      <Card className="max-w-3xl">
        <CardContent>
          <PropertyForm
            action={boundAction}
            property={property}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
