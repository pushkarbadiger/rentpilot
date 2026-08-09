import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    connected: true,
    message: "RentPilot API is working!",
  });
}
