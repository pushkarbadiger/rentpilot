import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <Logo />
            <p className="mt-2 max-w-xs text-sm text-slate-500">
              Your rental portfolio, on autopilot.
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>
            <a href="#preview" className="hover:text-slate-900">
              Product
            </a>
            <Link href="/login" className="hover:text-slate-900">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-slate-900">
              Get Started
            </Link>
          </nav>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} RentPilot. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">Phase 1 MVP</p>
        </div>
      </div>
    </footer>
  );
}
