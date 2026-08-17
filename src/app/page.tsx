import { LandingNavbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { AIRoadmap } from "@/components/landing/AIRoadmap";
import { Footer } from "@/components/landing/Footer";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { WorkflowSection } from "@/components/landing/WorkflowSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import {
  Building2,
  Users,
  IndianRupee,
  Bell,
  BarChart3,
} from "lucide-react";

const TRUST_ITEMS = [
  { icon: Building2, label: "Properties in one place" },
  { icon: Users, label: "Tenant management" },
  { icon: IndianRupee, label: "Rent tracking" },
  { icon: Bell, label: "Payment reminders" },
  { icon: BarChart3, label: "AI-powered insights" },
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      <LandingNavbar />
      <main>
        <Hero />
        <TrustStrip />
        <ProblemSolution />
        <Features />
        <WorkflowSection />
        <AIRoadmap />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

function TrustStrip() {
  return (
    <section
      aria-label="RentPilot capabilities"
      className="border-y border-slate-200 bg-slate-50/80"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-4 px-4 py-6 sm:px-6 lg:justify-between lg:px-8">
        {TRUST_ITEMS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <p className="text-sm font-medium text-slate-600">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
