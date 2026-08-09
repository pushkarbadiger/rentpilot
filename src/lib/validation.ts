import { z } from "zod";

export const propertySchema = z.object({
  name: z.string().trim().min(2, "Property name is required"),
  address: z.string().trim().min(3, "Address is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(2, "State is required").max(2, "Use a 2-letter state code"),
  postal_code: z.string().trim().min(3, "Postal code is required"),
  property_type: z.enum([
    "apartment",
    "house",
    "condo",
    "duplex",
    "commercial",
    "other",
  ]),
  units: z.coerce.number().int().min(1, "Must have at least 1 unit"),
  monthly_rent: z.coerce.number().min(0, "Rent can't be negative"),
  status: z.enum(["active", "inactive"]),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type PropertyFormValues = z.infer<typeof propertySchema>;

export const tenantSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  property_id: z.string().trim().optional().or(z.literal("")),
  unit: z.string().trim().max(50).optional().or(z.literal("")),
  lease_start: z.string().trim().optional().or(z.literal("")),
  lease_end: z.string().trim().optional().or(z.literal("")),
  monthly_rent: z.coerce.number().min(0, "Rent can't be negative"),
  security_deposit: z.coerce.number().min(0, "Deposit can't be negative"),
  status: z.enum(["active", "pending", "former"]),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type TenantFormValues = z.infer<typeof tenantSchema>;

export const rentPaymentSchema = z.object({
  tenant_id: z.string().trim().min(1, "Select a tenant"),
  property_id: z.string().trim().min(1, "Select a property"),
  amount: z.coerce.number().min(0.01, "Enter an amount"),
  due_date: z.string().trim().min(1, "Due date is required"),
  payment_date: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["paid", "pending", "late", "partial"]),
  payment_method: z
    .enum(["bank_transfer", "card", "cash", "check", "other"])
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type RentPaymentFormValues = z.infer<typeof rentPaymentSchema>;

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name"),
    email: z.string().trim().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

/** Formats the first Zod error for each field into a flat string map. */
export function flattenZodErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
