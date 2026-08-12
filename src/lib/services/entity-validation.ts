import { createClient } from "@/lib/supabase/server";
import { demoProperties, demoTenants } from "@/lib/demo-data";

const PROPERTY_NOT_FOUND =
  "The selected property was not found or does not belong to your account.";
const TENANT_NOT_FOUND =
  "The selected tenant was not found or does not belong to your account.";
const PROPERTY_TENANT_MISMATCH =
  "The selected property does not match this tenant's assigned property.";
const PROPERTY_REQUIRED =
  "Select a property for this payment.";

/** Verifies a property belongs to the given owner. */
export async function validatePropertyOwnership(
  ownerId: string,
  propertyId: string,
  isDemo: boolean
): Promise<string | null> {
  if (isDemo) {
    const property = demoProperties.find((p) => p.id === propertyId);
    if (!property || property.owner_id !== ownerId) return PROPERTY_NOT_FOUND;
    return null;
  }

  const supabase = await createClient();
  if (!supabase) return PROPERTY_NOT_FOUND;

  const { data, error } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("id", propertyId)
    .maybeSingle();

  if (error || !data) return PROPERTY_NOT_FOUND;
  return null;
}

/** Verifies a tenant belongs to the given owner and returns the tenant record. */
export async function resolveOwnedTenant(
  ownerId: string,
  tenantId: string,
  isDemo: boolean
): Promise<{
  tenant: { id: string; property_id: string | null } | null;
  error: string | null;
}> {
  if (isDemo) {
    const tenant = demoTenants.find(
      (t) => t.id === tenantId && t.owner_id === ownerId
    );
    if (!tenant) return { tenant: null, error: TENANT_NOT_FOUND };
    return {
      tenant: { id: tenant.id, property_id: tenant.property_id },
      error: null,
    };
  }

  const supabase = await createClient();
  if (!supabase) return { tenant: null, error: TENANT_NOT_FOUND };

  const { data, error } = await supabase
    .from("tenants")
    .select("id, property_id")
    .eq("owner_id", ownerId)
    .eq("id", tenantId)
    .maybeSingle();

  if (error || !data) return { tenant: null, error: TENANT_NOT_FOUND };
  return { tenant: data, error: null };
}

/**
 * Validates rent-payment tenant/property relationships and returns the
 * authoritative property_id (derived from the tenant when assigned).
 */
export async function resolveRentPaymentPropertyId(
  ownerId: string,
  tenantId: string,
  submittedPropertyId: string,
  isDemo: boolean
): Promise<{ propertyId: string | null; error: string | null }> {
  const { tenant, error: tenantError } = await resolveOwnedTenant(
    ownerId,
    tenantId,
    isDemo
  );
  if (tenantError || !tenant) {
    return { propertyId: null, error: tenantError ?? TENANT_NOT_FOUND };
  }

  if (tenant.property_id) {
    if (submittedPropertyId && submittedPropertyId !== tenant.property_id) {
      return { propertyId: null, error: PROPERTY_TENANT_MISMATCH };
    }
    const propertyError = await validatePropertyOwnership(
      ownerId,
      tenant.property_id,
      isDemo
    );
    if (propertyError) return { propertyId: null, error: propertyError };
    return { propertyId: tenant.property_id, error: null };
  }

  if (!submittedPropertyId) {
    return { propertyId: null, error: PROPERTY_REQUIRED };
  }

  const propertyError = await validatePropertyOwnership(
    ownerId,
    submittedPropertyId,
    isDemo
  );
  if (propertyError) return { propertyId: null, error: propertyError };
  return { propertyId: submittedPropertyId, error: null };
}
