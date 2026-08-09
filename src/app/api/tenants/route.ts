import { NextResponse } from "next/server";
import { tenantSchema } from "@/lib/validation";
import { createTenant, listTenants } from "@/lib/services/tenants";

export async function GET() {
  const { data, error } = await listTenants();
  if (error) {
    return NextResponse.json({ error }, { status: error === "Not authenticated" ? 401 : 500 });
  }
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = tenantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const { data, error } = await createTenant(parsed.data);
  if (error || !data) {
    return NextResponse.json(
      { error: error ?? "Could not create tenant" },
      { status: error === "Not authenticated" ? 401 : 500 }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
