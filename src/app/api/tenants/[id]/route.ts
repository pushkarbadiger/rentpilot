import { NextResponse } from "next/server";
import { tenantSchema } from "@/lib/validation";
import { deleteTenant, getTenant, updateTenant } from "@/lib/services/tenants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await getTenant(id);
  if (error || !data) {
    return NextResponse.json(
      { error: error ?? "Tenant not found" },
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

  const parsed = tenantSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const existing = await getTenant(id);
  if (existing.error || !existing.data) {
    return NextResponse.json(
      { error: existing.error ?? "Tenant not found" },
      { status: existing.error === "Not authenticated" ? 401 : 404 }
    );
  }

  const merged = tenantSchema.parse({
    ...existing.data,
    property_id: existing.data.property_id ?? "",
    email: existing.data.email ?? "",
    phone: existing.data.phone ?? "",
    unit: existing.data.unit ?? "",
    lease_start: existing.data.lease_start ?? "",
    lease_end: existing.data.lease_end ?? "",
    notes: existing.data.notes ?? "",
    ...parsed.data,
  });

  const { data, error } = await updateTenant(id, merged);
  if (error || !data) {
    return NextResponse.json(
      { error: error ?? "Could not update tenant" },
      { status: error === "Not authenticated" ? 401 : 500 }
    );
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await deleteTenant(id);
  if (error) {
    return NextResponse.json(
      { error },
      { status: error === "Not authenticated" ? 401 : 500 }
    );
  }
  return NextResponse.json({ success: true });
}
