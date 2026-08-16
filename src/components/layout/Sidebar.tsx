"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  IndianRupee,
  Bot,
  Settings,
  Home,
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/properties",
    label: "Properties",
    icon: Building2,
  },
  {
    href: "/dashboard/tenants",
    label: "Tenants",
    icon: Users,
  },
  {
    href: "/dashboard/rent",
    label: "Rent",
    icon: IndianRupee,
  },
  {
    href: "/dashboard/ai",
    label: "RentPilot AI",
    icon: Bot,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function SidebarNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-4">
      {navItems.map((item) => {
        const Icon = item.icon;

        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={[
              "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5",
              "text-sm font-medium transition-colors",
              isActive
                ? "bg-violet-50 text-violet-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            ].join(" ")}
          >
            <Icon
              className={[
                "h-5 w-5 shrink-0",
                isActive ? "text-violet-600" : "text-slate-500",
              ].join(" ")}
            />

            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white md:flex md:flex-col">
      <div className="flex h-20 shrink-0 items-center border-b border-slate-200 px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
            <Home className="h-5 w-5" />
          </div>

          <span className="text-xl font-bold tracking-tight text-slate-900">
            RentPilot
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <SidebarNav />
      </div>
    </aside>
  );
}
