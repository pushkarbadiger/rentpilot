import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/services/dashboard";

export async function GET() {
  const { data, error } = await getDashboardStats();
  if (error || !data) {
    return NextResponse.json(
      { error: error ?? "Could not load dashboard stats" },
      { status: error === "Not authenticated" ? 401 : 500 }
    );
  }
  return NextResponse.json({ data });
}
