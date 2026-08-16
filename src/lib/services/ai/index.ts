import OpenAI from "openai";
import type {
  AIProvider,
  CashFlowForecastInput,
  CashFlowForecastResult,
  MaintenanceClassificationInput,
  MaintenanceClassificationResult,
  PropertyInsightInput,
  PropertyInsightResult,
  RentReminderInput,
  RentReminderResult,
  TenantMessageDraftInput,
  TenantMessageDraftResult,
} from "./types";

export * from "./types";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini";

const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null;

export const isAIConfigured = Boolean(OPENAI_API_KEY);

async function askAI(system: string, user: string): Promise<string> {
  if (!openai) {
    throw new Error("OpenAI is not configured.");
  }

  const response = await openai.responses.create({
    model: MODEL,
    instructions: system,
    input: user,
  });

  const output = response.output_text?.trim();

  if (!output) {
    throw new Error("OpenAI returned an empty response.");
  }

  return output;
}

const provider: AIProvider = {
  name: "openai",

  async draftRentReminder(
    input: RentReminderInput
  ): Promise<RentReminderResult> {
    const result = await askAI(
      `You are RentPilot, an AI property-management assistant.

Write concise, professional rent reminders.
Never threaten, shame, or fabricate payment information.

Return valid JSON with exactly these fields:
subject, message, tone.

tone must be either "friendly" or "firm".`,
      JSON.stringify({
        task: "Create a rent reminder.",
        tenant: {
          name: input.tenant.full_name,
          email: input.tenant.email,
          monthlyRent: input.tenant.monthly_rent,
        },
        payment: input.payment,
      })
    );

    return JSON.parse(result) as RentReminderResult;
  },

  async classifyMaintenanceRequest(
    input: MaintenanceClassificationInput
  ): Promise<MaintenanceClassificationResult> {
    const result = await askAI(
      `You are RentPilot's maintenance triage assistant.

Classify the tenant's maintenance request.
Use priority values only:
low, medium, high, emergency.

Do not invent facts.

Return valid JSON with exactly:
category, priority, summary.`,
      input.description
    );

    return JSON.parse(result) as MaintenanceClassificationResult;
  },

  async draftTenantMessage(
    input: TenantMessageDraftInput
  ): Promise<TenantMessageDraftResult> {
    const result = await askAI(
      `You are RentPilot, an AI property-management assistant.

Draft a concise and professional message to a tenant.
Do not fabricate facts or make legal claims.

Return valid JSON with exactly:
subject, message.`,
      JSON.stringify({
        tenant: {
          name: input.tenant.full_name,
          email: input.tenant.email,
        },
        context: input.context,
      })
    );

    return JSON.parse(result) as TenantMessageDraftResult;
  },

  async forecastCashFlow(
    input: CashFlowForecastInput
  ): Promise<CashFlowForecastResult[]> {
    const result = await askAI(
      `You are RentPilot's cash-flow forecasting assistant.

Use only the supplied property and payment data.
Do not invent historical transactions.
Use conservative estimates when the supplied data is insufficient.

Return valid JSON as an array.
Each item must contain:
month, projectedIncome, projectedExpenses.`,
      JSON.stringify({
        properties: input.properties,
        payments: input.payments,
        monthsAhead: input.monthsAhead,
      })
    );

    return JSON.parse(result) as CashFlowForecastResult[];
  },

  async generatePropertyInsights(
    input: PropertyInsightInput
  ): Promise<PropertyInsightResult[]> {
    const result = await askAI(
      `You are RentPilot's property analytics assistant.

Analyze the supplied property and payment information.
Only make claims supported by the supplied data.

Return valid JSON as an array.
Each item must contain:
headline, detail.`,
      JSON.stringify({
        property: input.property,
        payments: input.payments,
      })
    );

    return JSON.parse(result) as PropertyInsightResult[];
  },
};

const unconfiguredProvider: AIProvider = {
  name: "unconfigured",
};

export function getAIProvider(): AIProvider {
  return openai ? provider : unconfiguredProvider;
}
