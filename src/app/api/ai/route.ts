import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      instructions:
        "You are RentPilot AI, a professional property-management copilot. Help landlords understand rentals, tenants, properties, payments and maintenance. Never invent data. Never claim an action happened unless the application actually performed it. Keep responses concise and useful. You are currently read-only.",
      input: message,
    });

    return NextResponse.json({
      message:
        response.output_text || "I could not generate a response.",
    });
  } catch (error) {
    console.error("[ai] request failed", error);

    return NextResponse.json(
      { error: "AI request failed. Please try again." },
      { status: 500 }
    );
  }
}
