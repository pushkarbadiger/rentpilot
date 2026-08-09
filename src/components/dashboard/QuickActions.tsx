import { Building2, Receipt, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <ButtonLink
        href="/dashboard/properties/new"
        variant="outline"
        className="justify-start"
      >
        <Building2 className="h-4 w-4 text-indigo-600" />
        Add Property
      </ButtonLink>
      <ButtonLink
        href="/dashboard/tenants/new"
        variant="outline"
        className="justify-start"
      >
        <Users className="h-4 w-4 text-indigo-600" />
        Add Tenant
      </ButtonLink>
      <ButtonLink
        href="/dashboard/rent/new"
        variant="outline"
        className="justify-start"
      >
        <Receipt className="h-4 w-4 text-indigo-600" />
        Record Payment
      </ButtonLink>
    </div>
  );
}
