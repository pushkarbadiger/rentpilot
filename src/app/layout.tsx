import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RentPilot — Your rental portfolio, on autopilot.",
  description:
    "RentPilot is an AI-ready rental property management platform for landlords and property managers — properties, tenants, and rent tracking in one clean dashboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
