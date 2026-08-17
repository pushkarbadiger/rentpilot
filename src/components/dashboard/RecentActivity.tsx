import Link from "next/link";
import {
  Building2,
  Clock,
  CreditCard,
  UserPlus,
} from "lucide-react";
import type { Property, Tenant, RentPayment } from "@/lib/types/domain";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

interface ActivityItem {
  id: string;
  type: "payment" | "property" | "tenant";
  title: string;
  subtitle: string;
  amount?: number;
  href: string;
  timestamp: string;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

interface RecentActivityProps {
  payments: RentPayment[];
  properties: Property[];
  tenants: Tenant[];
  limit?: number;
}

export function RecentActivity({
  payments,
  properties,
  tenants,
  limit = 8,
}: RecentActivityProps) {
  const items: ActivityItem[] = [];

  // Recent payments with payment_date (completed payments)
  const recentPaid = [...payments]
    .filter((p) => p.payment_date)
    .sort((a, b) => (b.payment_date ?? "").localeCompare(a.payment_date ?? ""));

  for (const p of recentPaid.slice(0, 4)) {
    items.push({
      id: `pay-${p.id}`,
      type: "payment",
      title: `Rent payment received`,
      subtitle: `${p.tenant?.full_name ?? "Tenant"} · ${p.property?.name ?? "Property"}`,
      amount: p.amount,
      href: `/dashboard/rent/${p.id}`,
      timestamp: p.payment_date ?? p.updated_at,
    });
  }

  // Recent property additions
  const recentProperties = [...properties].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  for (const p of recentProperties.slice(0, 3)) {
    items.push({
      id: `prop-${p.id}`,
      type: "property",
      title: `Property added`,
      subtitle: `${p.name} · ${p.city}`,
      href: `/dashboard/properties/${p.id}`,
      timestamp: p.created_at,
    });
  }

  // Recent tenant additions
  const recentTenants = [...tenants].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  for (const t of recentTenants.slice(0, 3)) {
    items.push({
      id: `tenant-${t.id}`,
      type: "tenant",
      title: `Tenant added`,
      subtitle: `${t.full_name} · ${t.property?.name ?? "Unassigned"}`,
      href: `/dashboard/tenants/${t.id}`,
      timestamp: t.created_at,
    });
  }

  // Sort all by timestamp descending and take top N
  items.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const displayItems = items.slice(0, limit);

  const typeConfig = {
    payment: {
      icon: CreditCard,
      bg: "bg-indigo-50",
      text: "text-indigo-600",
    },
    property: {
      icon: Building2,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    tenant: {
      icon: UserPlus,
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
  };

  if (displayItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Clock}
            title="No activity yet"
            description="Activity will appear here as you manage your portfolio."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-slate-100">
          {displayItems.map((item) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-4 px-5 py-3 transition-colors duration-150 hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg} ${config.text}`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    {item.amount !== undefined && (
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(item.amount)}
                      </span>
                    )}
                    <span className="text-xs text-muted">
                      {timeAgo(item.timestamp)}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
