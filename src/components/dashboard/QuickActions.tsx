import {
  Bot,
  Building2,
  Receipt,
  Users,
  Eye,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

const actions = [
  {
    href: "/dashboard/properties/new",
    label: "Add Property",
    description: "List a new property",
    icon: Building2,
    primary: true,
  },
  {
    href: "/dashboard/tenants/new",
    label: "Add Tenant",
    description: "Onboard a tenant",
    icon: Users,
    primary: false,
  },
  {
    href: "/dashboard/rent/new",
    label: "Record Payment",
    description: "Log a rent payment",
    icon: Receipt,
    primary: false,
  },
  {
    href: "/dashboard/rent",
    label: "Rent Operations",
    description: "Collection center",
    icon: Eye,
    primary: false,
  },
  {
    href: "/dashboard/ai",
    label: "Ask RentPilot",
    description: "AI assistant",
    icon: Bot,
    primary: false,
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <ButtonLink
            key={action.href}
            href={action.href}
            variant={action.primary ? "primary" : "outline"}
            className={`group justify-start gap-3 px-4 py-3 ${
              action.primary ? "" : "hover:border-indigo-200 hover:bg-indigo-50/50"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ${
                action.primary
                  ? "bg-indigo-500/20 text-white"
                  : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="min-w-0 text-left">
              <span className="block text-sm font-medium">{action.label}</span>
              <span
                className={`block text-xs ${
                  action.primary ? "text-indigo-200" : "text-slate-400"
                }`}
              >
                {action.description}
              </span>
            </span>
          </ButtonLink>
        );
      })}
    </div>
  );
}
