import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { DemoWriteNotice } from "@/components/layout/DemoWriteNotice";
import { getCurrentUser } from "@/lib/services/auth";
import { Suspense } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="min-w-0 md:ml-64">
        <Header user={user} />

        {user.isDemo && <DemoBanner />}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {user.isDemo && (
            <Suspense fallback={null}>
              <DemoWriteNotice />
            </Suspense>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
