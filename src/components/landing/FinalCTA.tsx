import { ArrowRight, LayoutDashboard } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export function FinalCTA() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-700 px-6 py-16 text-center shadow-xl shadow-indigo-600/20 sm:px-16 sm:py-20">
          <p className="text-xs font-semibold tracking-[0.2em] text-indigo-200">
            READY WHEN YOU ARE
          </p>
          <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Bring your rental operation into focus.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-indigo-100">
            Start organizing your portfolio in minutes — or explore the live
            demo first, no signup needed.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink
              href="/signup"
              size="lg"
              className="bg-white text-indigo-700 shadow-none hover:bg-indigo-50"
            >
              Start managing free
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink
              href="/dashboard"
              variant="outline"
              size="lg"
              className="border-indigo-300/40 bg-transparent text-white shadow-none hover:bg-indigo-500/30"
            >
              <LayoutDashboard className="h-4 w-4" />
              Explore the demo
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
