import { ArrowRight, LayoutDashboard } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { ProductPreview } from "./ProductPreview";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-white">
      {/* Background treatment */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[800px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,_var(--tw-gradient-stops))] from-indigo-50 via-white to-white"
      />
      <div
        aria-hidden
        className="absolute right-0 top-0 -z-10 h-[600px] w-[600px] translate-x-[30%] translate-y-[-10%] rounded-full bg-indigo-100/40 blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow */}
          <p className="animate-fade-in-up text-xs font-semibold tracking-[0.2em] text-indigo-600 sm:text-sm">
            PROPERTY MANAGEMENT, REIMAGINED
          </p>

          {/* Headline */}
          <h1 className="animate-fade-in-up delay-100 mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
            Manage your properties.
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
              Not the paperwork.
            </span>
          </h1>

          {/* Supporting copy */}
          <p className="animate-fade-in-up delay-200 mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-600">
            RentPilot brings properties, tenants, rent collection, reminders,
            and portfolio insights into one intelligent workspace — so you can
            focus on what matters.
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up delay-300 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/signup" size="lg">
              Start managing free
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="outline" size="lg">
              <LayoutDashboard className="h-4 w-4" />
              Explore the demo
            </ButtonLink>
          </div>

          <p className="animate-fade-in-up delay-400 mt-5 text-sm text-slate-500">
            No credit card required. Explore the live demo or sign up for free.
          </p>
        </div>

        {/* Product preview */}
        <div className="animate-fade-in-up delay-500">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
