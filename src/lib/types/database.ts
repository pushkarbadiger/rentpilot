// Hand-authored type definitions matching supabase/migrations/0001_init.sql.
// If you use the Supabase CLI, you can replace this with a generated file via:
//   npx supabase gen types typescript --project-id <id> > src/lib/types/database.ts

import type {
  PaymentMethod,
  PaymentStatus,
  PropertyStatus,
  PropertyType,
  TenantStatus,
} from "./domain";

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          company_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          company_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          company_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
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
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          address: string;
          city: string;
          state: string;
          postal_code: string;
          property_type: PropertyType;
          units?: number;
          monthly_rent?: number;
          status?: PropertyStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
        Relationships: [];
      };
      tenants: {
        Row: {
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
        };
        Insert: {
          id?: string;
          owner_id: string;
          property_id?: string | null;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          unit?: string | null;
          lease_start?: string | null;
          lease_end?: string | null;
          monthly_rent?: number;
          security_deposit?: number;
          status?: TenantStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
        Relationships: [];
      };
      rent_payments: {
        Row: {
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
        };
        Insert: {
          id?: string;
          owner_id: string;
          tenant_id: string;
          property_id: string;
          amount: number;
          due_date: string;
          payment_date?: string | null;
          status?: PaymentStatus;
          payment_method?: PaymentMethod | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["rent_payments"]["Insert"]
        >;
        Relationships: [];
      };
    };
  };
}
