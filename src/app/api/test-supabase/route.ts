import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { connected: false, error: "Supabase environment variables are missing" },
      { status: 500 }
    );
  }

  const supabase = createClient(url, key);

  const { error } = await supabase.from("properties").select("id").limit(1);

  if (error) {
    return NextResponse.json(
      { connected: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    connected: true,
    message: "RentPilot is connected to Supabase.",
  });
}
