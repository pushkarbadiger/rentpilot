"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { SidebarNav } from "./Sidebar";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-900/30"
            onClick={() => setOpen(false)}
          />

          <aside className="relative flex h-full w-72 flex-col bg-white shadow-xl">
            <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 px-6">
              <Logo />

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6">
              <SidebarNav onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
