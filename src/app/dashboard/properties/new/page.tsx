import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { PropertyForm } from "@/components/forms/PropertyForm";
import { createPropertyAction } from "../actions";

export default function NewPropertyPage() {
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
        title="Add property"
        description="Add a new property to your portfolio."
      />
      <Card className="max-w-3xl">
        <CardContent>
          <PropertyForm
            action={createPropertyAction}
            submitLabel="Add Property"
          />
        </CardContent>
      </Card>
    </div>
  );
}
