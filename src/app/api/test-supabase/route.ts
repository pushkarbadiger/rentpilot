import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json(
      {
        configured: false,
        reachable: false,
        error: "Supabase is not configured for this environment.",
      },
      { status: 503 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    const { error } = await supabase
      .from("properties")
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          configured: true,
          reachable: false,
          error: "Supabase could not verify the expected schema.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      configured: true,
      reachable: true,
      message: "RentPilot can reach the configured Supabase project.",
    });
  } catch {
    return NextResponse.json(
      {
        configured: true,
        reachable: false,
        error: "Supabase could not be reached.",
      },
      { status: 503 }
    );
  }
}
