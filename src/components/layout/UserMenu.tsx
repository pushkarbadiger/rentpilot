"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { initials } from "@/lib/utils";
import { signOutAction } from "@/app/auth/actions";

export function UserMenu({
  name,
  email,
  isDemo,
}: {
  name: string;
  email: string;
  isDemo: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-100"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
          {initials(name) || <User className="h-4 w-4" />}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium text-slate-900">
            {name}
          </span>
          <span className="block text-xs text-slate-500">{email}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-sm font-medium text-slate-900">{name}</p>
            <p className="truncate text-xs text-slate-500">{email}</p>
            {isDemo && (
              <p className="mt-1 text-xs font-medium text-indigo-600">
                Demo mode
              </p>
            )}
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
