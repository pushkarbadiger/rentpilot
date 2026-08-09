import { NextResponse } from "next/server";
import { rentPaymentSchema } from "@/lib/validation";
import {
  deleteRentPayment,
  getRentPayment,
  updateRentPayment,
} from "@/lib/services/rent-payments";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await getRentPayment(id);
  if (error || !data) {
    return NextResponse.json(
      { error: error ?? "Payment not found" },
      { status: error === "Not authenticated" ? 401 : 404 }
    );
  }
  return NextResponse.json({ data });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = rentPaymentSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const existing = await getRentPayment(id);
  if (existing.error || !existing.data) {
    return NextResponse.json(
      { error: existing.error ?? "Payment not found" },
      { status: 404 }
    );
  }

  const merged = rentPaymentSchema.parse({
    ...existing.data,
    payment_date: existing.data.payment_date ?? "",
    payment_method: existing.data.payment_method ?? "",
    notes: existing.data.notes ?? "",
    ...parsed.data,
  });

  const { data, error } = await updateRentPayment(id, merged);
  if (error || !data) {
    return NextResponse.json(
      { error: error ?? "Could not update payment" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await deleteRentPayment(id);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
