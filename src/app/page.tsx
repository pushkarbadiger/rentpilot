import { LandingNavbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { AIRoadmap } from "@/components/landing/AIRoadmap";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="bg-white">
      <LandingNavbar />
      <main>
        <Hero />
        <Features />
        <ProductPreview />
        <AIRoadmap />
      </main>
      <Footer />
    </div>
  );
}
