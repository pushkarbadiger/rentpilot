// Provider-agnostic contracts for AI features planned beyond Phase 1.
// Nothing here calls a real model yet — this only defines the shape so an
// AI provider (OpenAI, Anthropic, etc.) can be dropped in later without
// touching UI or route code.

import type { Property, RentPayment, Tenant } from "@/lib/types/domain";

export interface RentReminderInput {
  tenant: Tenant;
  payment: RentPayment;
}

export interface RentReminderResult {
  subject: string;
  message: string;
  tone: "friendly" | "firm";
}

export interface MaintenanceClassificationInput {
  description: string;
}

export type MaintenancePriority = "low" | "medium" | "high" | "emergency";

export interface MaintenanceClassificationResult {
  category: string;
  priority: MaintenancePriority;
  summary: string;
}

export interface TenantMessageDraftInput {
  tenant: Tenant;
  context: string;
}

export interface TenantMessageDraftResult {
  subject: string;
  message: string;
}

export interface CashFlowForecastInput {
  properties: Property[];
  payments: RentPayment[];
  monthsAhead: number;
}

export interface CashFlowForecastResult {
  month: string;
  projectedIncome: number;
  projectedExpenses: number;
}

export interface PropertyInsightInput {
  property: Property;
  payments: RentPayment[];
}

export interface PropertyInsightResult {
  headline: string;
  detail: string;
}

/**
 * Implemented by any future AI provider. Each method is optional so a
 * provider can support a subset of features first.
 */
export interface AIProvider {
  name: string;
  draftRentReminder?(input: RentReminderInput): Promise<RentReminderResult>;
  classifyMaintenanceRequest?(
    input: MaintenanceClassificationInput
  ): Promise<MaintenanceClassificationResult>;
  draftTenantMessage?(
    input: TenantMessageDraftInput
  ): Promise<TenantMessageDraftResult>;
  forecastCashFlow?(
    input: CashFlowForecastInput
  ): Promise<CashFlowForecastResult[]>;
  generatePropertyInsights?(
    input: PropertyInsightInput
  ): Promise<PropertyInsightResult[]>;
}
