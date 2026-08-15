import { createClient } from "@/lib/supabase/server";
import {
  buildRentReminderHtml,
  buildRentReminderSubject,
  buildRentReminderText,
} from "@/lib/email-templates/rent-reminder";
import { getEmailProvider, isEmailConfigured } from "@/lib/services/email";
import { createRentCollectionSession } from "@/lib/services/payments/create-collection-session";
import type {
  ReminderKind,
  RentPayment,
  RentReminderLog,
  Tenant,
} from "@/lib/types/domain";
import { formatCurrencyPrecise, formatDate } from "@/lib/utils";
import { getCurrentUser } from "./auth";
import { getPaymentOutstandingAmount } from "./metrics";
import {
  getEffectivePaymentStatus,
  isPaymentOpen,
  toDueDateKey,
  toLocalDateKey,
} from "./payment-status";
import type { ServiceResult } from "./properties";
import { getProfile } from "./profile";
import { getRentPayment, listRentPayments } from "./rent-payments";
import { getTenant } from "./tenants";

/** Days before due date when an "upcoming" reminder is allowed. */
export const UPCOMING_REMINDER_DAYS = 3;

/**
 * Pending reservations older than this are treated as interrupted sends and
 * recovered to failed so the landlord can retry. Chosen to exceed normal
 * provider latency while avoiding indefinite stuck pending rows.
 */
export const STALE_PENDING_MS = 5 * 60 * 1000;

const REMINDER_KINDS: ReminderKind[] = ["upcoming", "due", "late"];

const demoSentReminderKeys = new Set<string>();

function demoReminderKey(
  paymentId: string,
  kind: ReminderKind
): string {
  return `${paymentId}:${kind}`;
}

function isValidEmail(email: string | null | undefined): email is string {
  if (!email) return false;
  const trimmed = email.trim();
  return trimmed.includes("@") && trimmed.length >= 3;
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toLocalDateKey(date);
}

/**
 * Eligibility windows (local calendar dates):
 * - late: effective status is late
 * - due: open payment with due_date === today
 * - upcoming: open payment, due_date is after today and within UPCOMING_REMINDER_DAYS
 */
export function isPaymentEligibleForReminderKind(
  payment: RentPayment,
  kind: ReminderKind,
  referenceDate: Date = new Date()
): boolean {
  if (!isPaymentOpen(payment, referenceDate)) return false;

  const today = toLocalDateKey(referenceDate);
  const dueKey = toDueDateKey(payment.due_date);
  const effective = getEffectivePaymentStatus(payment, referenceDate);

  switch (kind) {
    case "late":
      return effective === "late";
    case "due":
      return dueKey === today && effective !== "late";
    case "upcoming": {
      if (dueKey <= today) return false;
      const windowEnd = addDaysToDateKey(today, UPCOMING_REMINDER_DAYS);
      return dueKey <= windowEnd;
    }
  }
}

export function getEligibleReminderKinds(
  payment: RentPayment,
  referenceDate: Date = new Date()
): ReminderKind[] {
  return REMINDER_KINDS.filter((kind) =>
    isPaymentEligibleForReminderKind(payment, kind, referenceDate)
  );
}

export interface PaymentReminderPreview {
  paymentId: string;
  tenantName: string;
  propertyName: string | null;
  recipientEmail: string | null;
  eligibleKinds: ReminderKind[];
  alreadyRemindedKinds: ReminderKind[];
  missingEmail: boolean;
  canSend: boolean;
}

export interface BatchReminderPreview {
  eligible: number;
  missingEmail: number;
  alreadyReminded: number;
  notEligible: number;
  sendable: number;
  items: PaymentReminderPreview[];
}

export interface SendReminderResult {
  paymentId: string;
  reminderKind: ReminderKind;
  status: "sent" | "failed" | "simulated";
  recipientEmail: string;
}

export interface BatchSendReminderResult {
  eligible: number;
  missingEmail: number;
  alreadyReminded: number;
  notEligible: number;
  sent: number;
  failed: number;
  skipped: number;
  results: SendReminderResult[];
}

async function loadReminderLogsForPayments(
  ownerId: string,
  paymentIds: string[],
  isDemo: boolean
): Promise<Map<string, RentReminderLog[]>> {
  const map = new Map<string, RentReminderLog[]>();

  if (paymentIds.length === 0) return map;

  if (isDemo) {
    for (const paymentId of paymentIds) {
      const kinds = REMINDER_KINDS.filter((kind) =>
        demoSentReminderKeys.has(demoReminderKey(paymentId, kind))
      );
      if (kinds.length > 0) {
        map.set(
          paymentId,
          kinds.map(
            (kind) =>
              ({
                id: `demo-log-${paymentId}-${kind}`,
                owner_id: ownerId,
                rent_payment_id: paymentId,
                tenant_id: "",
                reminder_kind: kind,
                channel: "email",
                recipient_email: "",
                subject: "",
                provider: "demo",
                provider_message_id: null,
                status: "simulated",
                error_message: null,
                sent_at: new Date().toISOString(),
                reserved_at: null,
                created_at: new Date().toISOString(),
              }) satisfies RentReminderLog
          )
        );
      }
    }
    return map;
  }

  const supabase = await createClient();
  if (!supabase) return map;

  const { data, error } = await supabase
    .from("rent_reminder_logs")
    .select("*")
    .eq("owner_id", ownerId)
    .in("rent_payment_id", paymentIds)
    .in("status", ["sent", "simulated", "pending"]);

  if (error) {
    console.error("[rent-reminders] log fetch failed", error.message);
    return map;
  }

  for (const row of (data ?? []) as RentReminderLog[]) {
    const existing = map.get(row.rent_payment_id) ?? [];
    existing.push(row);
    map.set(row.rent_payment_id, existing);
  }

  return map;
}

function getSuccessfulReminderKinds(
  logs: RentReminderLog[] | undefined
): ReminderKind[] {
  if (!logs) return [];
  return logs
    .filter((log) => log.status === "sent" || log.status === "simulated")
    .map((log) => log.reminder_kind);
}

function buildPaymentPreview(
  payment: RentPayment,
  tenant: Tenant | null,
  logs: RentReminderLog[] | undefined,
  referenceDate: Date
): PaymentReminderPreview {
  const eligibleKinds = getEligibleReminderKinds(payment, referenceDate);
  const alreadyRemindedKinds = getSuccessfulReminderKinds(logs).filter((kind) =>
    eligibleKinds.includes(kind)
  );
  const recipientEmail = tenant?.email?.trim() || null;
  const missingEmail = !isValidEmail(recipientEmail);
  const remainingKinds = eligibleKinds.filter(
    (kind) => !alreadyRemindedKinds.includes(kind)
  );

  return {
    paymentId: payment.id,
    tenantName: tenant?.full_name ?? payment.tenant?.full_name ?? "Unknown tenant",
    propertyName: payment.property?.name ?? tenant?.property?.name ?? null,
    recipientEmail,
    eligibleKinds,
    alreadyRemindedKinds,
    missingEmail,
    canSend: remainingKinds.length > 0 && !missingEmail,
  };
}

export async function getRentReminderPreview(
  paymentId: string,
  referenceDate: Date = new Date()
): Promise<ServiceResult<PaymentReminderPreview>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const paymentResult = await getRentPayment(paymentId);
  if (paymentResult.error || !paymentResult.data) {
    return { data: null, error: paymentResult.error ?? "Payment not found." };
  }

  const tenantResult = await getTenant(paymentResult.data.tenant_id);
  const logs = await loadReminderLogsForPayments(
    user.id,
    [paymentId],
    user.isDemo
  );

  return {
    data: buildPaymentPreview(
      paymentResult.data,
      tenantResult.data,
      logs.get(paymentId),
      referenceDate
    ),
    error: null,
  };
}

export async function getBatchRentReminderPreview(
  reminderKind: ReminderKind = "late",
  referenceDate: Date = new Date()
): Promise<ServiceResult<BatchReminderPreview>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const paymentsResult = await listRentPayments();
  if (paymentsResult.error || !paymentsResult.data) {
    return { data: null, error: paymentsResult.error ?? "Could not load payments." };
  }

  const paymentIds = paymentsResult.data.map((p) => p.id);
  const logs = await loadReminderLogsForPayments(
    user.id,
    paymentIds,
    user.isDemo
  );

  const tenantCache = new Map<string, Tenant | null>();
  const items: PaymentReminderPreview[] = [];
  let eligible = 0;
  let missingEmail = 0;
  let alreadyReminded = 0;
  let notEligible = 0;
  let sendable = 0;

  for (const payment of paymentsResult.data) {
    if (!isPaymentEligibleForReminderKind(payment, reminderKind, referenceDate)) {
      notEligible++;
      continue;
    }

    eligible++;

    let tenant = tenantCache.get(payment.tenant_id);
    if (tenant === undefined) {
      const tenantResult = await getTenant(payment.tenant_id);
      tenant = tenantResult.data;
      tenantCache.set(payment.tenant_id, tenant);
    }

    const preview = buildPaymentPreview(
      payment,
      tenant,
      logs.get(payment.id),
      referenceDate
    );

    if (preview.missingEmail) missingEmail++;
    if (preview.alreadyRemindedKinds.includes(reminderKind)) alreadyReminded++;
    if (
      !preview.missingEmail &&
      !preview.alreadyRemindedKinds.includes(reminderKind) &&
      preview.eligibleKinds.includes(reminderKind)
    ) {
      sendable++;
    }

    items.push(preview);
  }

  return {
    data: {
      eligible,
      missingEmail,
      alreadyReminded,
      notEligible,
      sendable,
      items,
    },
    error: null,
  };
}

async function getLandlordContext(userId: string, isDemo: boolean) {
  if (isDemo) {
    return {
      fullName: "Demo Landlord",
      companyName: "RentPilot Demo Portfolio",
    };
  }

  const profileResult = await getProfile();
  return {
    fullName: profileResult.data?.full_name?.trim() || "Your landlord",
    companyName: profileResult.data?.company_name?.trim() || null,
  };
}

type ReminderLogReservation = {
  id: string;
  status: string;
  created_at: string;
  reserved_at: string | null;
};

function getReservationTimestamp(log: ReminderLogReservation): string {
  return log.reserved_at ?? log.created_at;
}

function isPendingReservationStale(log: ReminderLogReservation): boolean {
  const reservedAt = getReservationTimestamp(log);
  return Date.now() - new Date(reservedAt).getTime() >= STALE_PENDING_MS;
}

async function recoverStalePendingReservation(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  ownerId: string,
  logId: string
): Promise<"recovered" | "still_pending" | "finalized"> {
  const { data, error } = await supabase
    .from("rent_reminder_logs")
    .update({
      status: "failed",
      error_message:
        "Send interrupted before completion (stale pending recovered).",
      sent_at: null,
    })
    .eq("id", logId)
    .eq("owner_id", ownerId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[rent-reminders] stale pending recovery failed", error.message);
    return "still_pending";
  }

  if (data) return "recovered";

  const { data: current, error: fetchError } = await supabase
    .from("rent_reminder_logs")
    .select("status")
    .eq("id", logId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (fetchError || !current) return "still_pending";
  if (current.status === "pending") return "still_pending";
  return "finalized";
}

async function reserveReminderLog(params: {
  ownerId: string;
  payment: RentPayment;
  tenant: Tenant;
  reminderKind: ReminderKind;
  recipientEmail: string;
  subject: string;
  provider: string;
}): Promise<ServiceResult<{ logId: string }>> {
  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase client unavailable" };

  const reservedAt = new Date().toISOString();

  const { data: initial, error: fetchError } = await supabase
    .from("rent_reminder_logs")
    .select("id, status, created_at, reserved_at")
    .eq("owner_id", params.ownerId)
    .eq("rent_payment_id", params.payment.id)
    .eq("reminder_kind", params.reminderKind)
    .maybeSingle();

  if (fetchError) {
    console.error("[rent-reminders] reserve fetch failed", fetchError.message);
    return { data: null, error: "Could not send reminder. Please try again." };
  }

  let existing = initial as ReminderLogReservation | null;

  if (existing?.status === "pending") {
    if (!isPendingReservationStale(existing)) {
      return { data: null, error: "A reminder is already being sent." };
    }

    const recovery = await recoverStalePendingReservation(
      supabase,
      params.ownerId,
      existing.id
    );

    if (recovery === "still_pending") {
      return { data: null, error: "A reminder is already being sent." };
    }

    if (recovery === "finalized") {
      const { data: refetched, error: refetchError } = await supabase
        .from("rent_reminder_logs")
        .select("id, status, created_at, reserved_at")
        .eq("owner_id", params.ownerId)
        .eq("rent_payment_id", params.payment.id)
        .eq("reminder_kind", params.reminderKind)
        .maybeSingle();

      if (refetchError) {
        console.error("[rent-reminders] reserve refetch failed", refetchError.message);
        return { data: null, error: "Could not send reminder. Please try again." };
      }

      existing = refetched as ReminderLogReservation | null;

      if (existing?.status === "sent" || existing?.status === "simulated") {
        return { data: null, error: "A reminder of this type was already sent." };
      }

      if (existing?.status === "pending") {
        return { data: null, error: "A reminder is already being sent." };
      }
    } else {
      existing = { ...existing, status: "failed" };
    }
  }

  if (existing?.status === "sent" || existing?.status === "simulated") {
    return { data: null, error: "A reminder of this type was already sent." };
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("rent_reminder_logs")
      .update({
        status: "pending",
        recipient_email: params.recipientEmail,
        subject: params.subject,
        provider: params.provider,
        provider_message_id: null,
        error_message: null,
        sent_at: null,
        reserved_at: reservedAt,
      })
      .eq("id", existing.id)
      .eq("owner_id", params.ownerId);

    if (updateError) {
      console.error("[rent-reminders] reserve update failed", updateError.message);
      return { data: null, error: "Could not send reminder. Please try again." };
    }

    return { data: { logId: existing.id }, error: null };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("rent_reminder_logs")
    .insert({
      owner_id: params.ownerId,
      rent_payment_id: params.payment.id,
      tenant_id: params.tenant.id,
      reminder_kind: params.reminderKind,
      channel: "email",
      recipient_email: params.recipientEmail,
      subject: params.subject,
      provider: params.provider,
      status: "pending",
      reserved_at: reservedAt,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return { data: null, error: "A reminder of this type was already sent." };
    }
    console.error("[rent-reminders] reserve insert failed", insertError.message);
    return { data: null, error: "Could not send reminder. Please try again." };
  }

  return { data: { logId: inserted.id }, error: null };
}

async function finalizeReminderLog(params: {
  ownerId: string;
  logId: string;
  status: "sent" | "failed";
  providerMessageId?: string | null;
  errorMessage?: string | null;
}): Promise<void> {
  const supabase = await createClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("rent_reminder_logs")
    .update({
      status: params.status,
      provider_message_id: params.providerMessageId ?? null,
      error_message: params.errorMessage ?? null,
      sent_at: params.status === "sent" ? new Date().toISOString() : null,
    })
    .eq("id", params.logId)
    .eq("owner_id", params.ownerId);

  if (error) {
    console.error("[rent-reminders] finalize failed", error.message);
  }
}

export async function sendRentReminder(
  paymentId: string,
  reminderKind: ReminderKind,
  referenceDate: Date = new Date()
): Promise<ServiceResult<SendReminderResult>> {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const paymentResult = await getRentPayment(paymentId);
  if (paymentResult.error || !paymentResult.data) {
    return { data: null, error: paymentResult.error ?? "Payment not found." };
  }

  const payment = paymentResult.data;
  if (payment.owner_id !== user.id) {
    return { data: null, error: "Payment not found." };
  }

  if (!isPaymentEligibleForReminderKind(payment, reminderKind, referenceDate)) {
    return { data: null, error: "This payment is not eligible for that reminder." };
  }

  const tenantResult = await getTenant(payment.tenant_id);
  if (tenantResult.error || !tenantResult.data) {
    return { data: null, error: "Tenant not found." };
  }

  const tenant = tenantResult.data;
  if (tenant.owner_id !== user.id) {
    return { data: null, error: "Tenant not found." };
  }

  const recipientEmail = tenant.email?.trim();
  if (!isValidEmail(recipientEmail)) {
    return { data: null, error: "This tenant does not have an email address on file." };
  }

  const logs = await loadReminderLogsForPayments(user.id, [paymentId], user.isDemo);
  if (getSuccessfulReminderKinds(logs.get(paymentId)).includes(reminderKind)) {
    return { data: null, error: "A reminder of this type was already sent." };
  }

  const landlord = await getLandlordContext(user.id, user.isDemo);
  const outstanding = getPaymentOutstandingAmount(payment, tenant.monthly_rent, referenceDate);
    const collectionResult = await createRentCollectionSession(paymentId);

if (collectionResult.error) {
  console.error(
    "[rent-reminders] payment link creation failed:",
    collectionResult.error
  );
}

const paymentUrl = collectionResult.data?.collectionUrl?.trim() || null;
  const templateInput = {
    tenantName: tenant.full_name,
    propertyName: payment.property?.name ?? null,
    outstandingAmount: formatCurrencyPrecise(outstanding),
    dueDate: formatDate(payment.due_date),
    reminderKind,
    landlordName: landlord.fullName,
    landlordCompany: landlord.companyName,
    paymentUrl,
  };
  const subject = buildRentReminderSubject(templateInput);
  const text = buildRentReminderText(templateInput);
  const html = buildRentReminderHtml(templateInput);

  if (user.isDemo) {
    demoSentReminderKeys.add(demoReminderKey(paymentId, reminderKind));
    return {
      data: {
        paymentId,
        reminderKind,
        status: "simulated",
        recipientEmail,
      },
      error: null,
    };
  }

  if (!isEmailConfigured) {
    return {
      data: null,
      error: "Email is not configured. Contact your administrator.",
    };
  }

  const provider = getEmailProvider();
  const idempotencyKey = `${user.id}:${payment.id}:${reminderKind}`;

  const reserved = await reserveReminderLog({
    ownerId: user.id,
    payment,
    tenant,
    reminderKind,
    recipientEmail,
    subject,
    provider: provider.name,
  });

  if (reserved.error || !reserved.data) {
    return { data: null, error: reserved.error ?? "Could not send reminder." };
  }

  try {
    const sendResult = await provider.send({
      to: recipientEmail,
      subject,
      html,
      text,
      idempotencyKey,
    });

    await finalizeReminderLog({
      ownerId: user.id,
      logId: reserved.data.logId,
      status: "sent",
      providerMessageId: sendResult.messageId,
    });

    return {
      data: {
        paymentId,
        reminderKind,
        status: "sent",
        recipientEmail,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email delivery failed.";
    await finalizeReminderLog({
      ownerId: user.id,
      logId: reserved.data.logId,
      status: "failed",
      errorMessage: message,
    });
    return { data: null, error: `Email failed: ${message}` };
  }
}

export async function sendRentReminderBatch(
  reminderKind: ReminderKind = "late",
  referenceDate: Date = new Date()
): Promise<ServiceResult<BatchSendReminderResult>> {
  const previewResult = await getBatchRentReminderPreview(reminderKind, referenceDate);
  if (previewResult.error || !previewResult.data) {
    return { data: null, error: previewResult.error ?? "Could not preview reminders." };
  }

  const preview = previewResult.data;
  const results: SendReminderResult[] = [];
  let sent = 0;
  let failed = 0;

  for (const item of preview.items) {
    if (
      item.missingEmail ||
      item.alreadyRemindedKinds.includes(reminderKind) ||
      !item.eligibleKinds.includes(reminderKind)
    ) {
      continue;
    }

    const sendResult = await sendRentReminder(
      item.paymentId,
      reminderKind,
      referenceDate
    );

    if (sendResult.data) {
      sent++;
      results.push(sendResult.data);
    } else {
      failed++;
      console.error(
        "[rent-reminders] batch item failed",
        item.paymentId,
        sendResult.error
      );
    }
  }

  return {
    data: {
      eligible: preview.eligible,
      missingEmail: preview.missingEmail,
      alreadyReminded: preview.alreadyReminded,
      notEligible: preview.notEligible,
      sent,
      failed,
      skipped: preview.missingEmail + preview.alreadyReminded,
      results,
    },
    error: null,
  };
}
