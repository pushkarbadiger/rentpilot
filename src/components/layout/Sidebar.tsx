"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  IndianRupee,
  Receipt,
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
    href: "/dashboard/payments",
    label: "Payments",
    icon: Receipt,
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
    <nav className="flex flex-col gap-1 px-3">
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
              "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5",
              "text-sm font-medium transition-all duration-150",
              isActive
                ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            ].join(" ")}
          >
            <Icon
              className={[
                "h-5 w-5 shrink-0 transition-colors duration-150",
                isActive
                  ? "text-indigo-600"
                  : "text-slate-400 group-hover:text-slate-600",
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
      <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 transition-opacity duration-150 hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
            <Home className="h-4.5 w-4.5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            RentPilot
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav />
      </div>

      <div className="border-t border-slate-200 px-5 py-4">
        <p className="text-xs text-slate-400">RentPilot v0.1</p>
      </div>
    </aside>
  );
}
