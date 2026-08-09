// Core domain types shared across the app (UI, services, API routes).
// These mirror the Supabase schema defined in supabase/migrations/0001_init.sql.

export type PropertyType =
  | "apartment"
  | "house"
  | "condo"
  | "duplex"
  | "commercial"
  | "other";

export type PropertyStatus = "active" | "inactive";

export interface Property {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  property_type: PropertyType;
  units: number;
  monthly_rent: number;
  status: PropertyStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type TenantStatus = "active" | "pending" | "former";

export interface Tenant {
  id: string;
  owner_id: string;
  property_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  unit: string | null;
  lease_start: string | null;
  lease_end: string | null;
  monthly_rent: number;
  security_deposit: number;
  status: TenantStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Populated by joins for display purposes
  property?: Pick<Property, "id" | "name" | "address"> | null;
}

export type PaymentStatus = "paid" | "pending" | "late" | "partial";

export type PaymentMethod =
  | "bank_transfer"
  | "card"
  | "cash"
  | "check"
  | "other";

export interface RentPayment {
  id: string;
  owner_id: string;
  tenant_id: string;
  property_id: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: PaymentStatus;
  payment_method: PaymentMethod | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Populated by joins for display purposes
  tenant?: Pick<Tenant, "id" | "full_name"> | null;
  property?: Pick<Property, "id" | "name"> | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  monthlyRent: number;
  rentCollected: number;
  outstandingRent: number;
  latePayments: number;
}
