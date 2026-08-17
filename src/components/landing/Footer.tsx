import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              The modern operating system for landlords — properties, tenants,
              rent, and insight in one place.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-sm font-semibold text-slate-900">Product</p>
            <nav className="mt-4 flex flex-col items-start gap-2.5 text-sm text-slate-500">
              <a href="#product" className="transition-colors hover:text-slate-900">
                How it works
              </a>
              <a href="#features" className="transition-colors hover:text-slate-900">
                Features
              </a>
              <a href="#ai" className="transition-colors hover:text-slate-900">
                RentPilot AI
              </a>
            </nav>
          </div>

          {/* Account */}
          <div>
            <p className="text-sm font-semibold text-slate-900">Account</p>
            <nav className="mt-4 flex flex-col items-start gap-2.5 text-sm text-slate-500">
              <Link href="/login" className="transition-colors hover:text-slate-900">
                Sign in
              </Link>
              <Link href="/signup" className="transition-colors hover:text-slate-900">
                Start managing free
              </Link>
              <Link href="/dashboard" className="transition-colors hover:text-slate-900">
                Explore demo
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <p className="text-sm font-semibold text-slate-900">Legal</p>
            <nav className="mt-4 flex flex-col items-start gap-2.5 text-sm text-slate-500">
              <span className="cursor-default">Privacy Policy</span>
              <span className="cursor-default">Terms of Service</span>
            </nav>
          </div>
        </div>

        <div className="mt-14 border-t border-slate-100 pt-7">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} RentPilot. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
