import { NextResponse } from "next/server";
import OpenAI from "openai";
import { listProperties } from "@/lib/services/properties";
import { listTenants } from "@/lib/services/tenants";
import { listRentPayments } from "@/lib/services/rent-payments";

const openai = new OpenAI({
  baseURL: "http://127.0.0.1:11434/v1",
  apiKey: "ollama",
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const [propertiesResult, tenantsResult, paymentsResult] =
      await Promise.all([
        listProperties(),
        listTenants(),
        listRentPayments(),
      ]);

    if (propertiesResult.error) {
      return NextResponse.json(
        { error: propertiesResult.error },
        { status: 500 }
      );
    }

    if (tenantsResult.error) {
      return NextResponse.json(
        { error: tenantsResult.error },
        { status: 500 }
      );
    }

    if (paymentsResult.error) {
      return NextResponse.json(
        { error: paymentsResult.error },
        { status: 500 }
      );
    }

    const data = {
      properties: propertiesResult.data ?? [],
      tenants: tenantsResult.data ?? [],
      rentPayments: paymentsResult.data ?? [],
    };

    const response = await openai.chat.completions.create({
      model: process.env.LOCAL_AI_MODEL || "llama3.2",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are RentPilot AI. Answer only from the supplied RentPilot data. Currency is Indian Rupees. Always use ₹. Never invent data. Never confuse payment amounts with monthly rent. When asked for total monthly rent, add the monthly_rent values from the properties array exactly once. Never use rentPayments amounts for monthly rent. Keep answers concise and professional.",
        },
        {
          role: "user",
          content: JSON.stringify({
            question: message,
            rentPilotData: data,
          }),
        },
      ],
    });

    const answer =
      response.choices[0]?.message?.content?.trim() ||
      "I could not generate a response.";

    return NextResponse.json({ message: answer });
  } catch (error) {
    console.error("[ai] request failed", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Local AI request failed.",
      },
      { status: 500 }
    );
  }
}
