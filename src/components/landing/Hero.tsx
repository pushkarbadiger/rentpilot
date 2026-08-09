import { ArrowRight, LayoutDashboard } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-white"
      />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28 lg:px-8">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-medium text-indigo-700">
          Built for landlords &amp; property managers
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          Your rental portfolio,{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
            on autopilot.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-slate-600 sm:text-lg">
          RentPilot brings your properties, tenants, and rent collection into
          one clean dashboard — with an architecture built to grow into AI
          automation, payments, and maintenance workflows.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/signup" size="lg">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="outline" size="lg">
            <LayoutDashboard className="h-4 w-4" />
            View Dashboard
          </ButtonLink>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          No credit card required. Explore a live demo dashboard instantly.
        </p>
      </div>
    </section>
  );
}
