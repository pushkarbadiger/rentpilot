import { NextResponse } from "next/server";
import { propertySchema } from "@/lib/validation";
import {
  deleteProperty,
  getProperty,
  updateProperty,
} from "@/lib/services/properties";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await getProperty(id);
  if (error || !data) {
    return NextResponse.json(
      { error: error ?? "Property not found" },
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

  const parsed = propertySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const existing = await getProperty(id);
  if (existing.error || !existing.data) {
    return NextResponse.json(
      { error: existing.error ?? "Property not found" },
      { status: 404 }
    );
  }

  const merged = propertySchema.parse({ ...existing.data, ...parsed.data });
  const { data, error } = await updateProperty(id, merged);
  if (error || !data) {
    return NextResponse.json(
      { error: error ?? "Could not update property" },
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
  const { error } = await deleteProperty(id);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
