import type { ReminderKind } from "@/lib/types/domain";

export interface RentReminderTemplateInput {
  tenantName: string;
  propertyName: string | null;
  outstandingAmount: string;
  dueDate: string;
  reminderKind: ReminderKind;
  landlordName: string;
  landlordCompany: string | null;
}

function kindLabel(kind: ReminderKind): string {
  switch (kind) {
    case "upcoming":
      return "Upcoming rent reminder";
    case "due":
      return "Rent due today";
    case "late":
      return "Overdue rent notice";
  }
}

function kindIntro(kind: ReminderKind): string {
  switch (kind) {
    case "upcoming":
      return "This is a friendly reminder that your rent payment is coming due soon.";
    case "due":
      return "This is a reminder that your rent payment is due today.";
    case "late":
      return "Our records show that your rent payment is past due. Please contact us to arrange payment as soon as possible.";
  }
}

export function buildRentReminderSubject(input: RentReminderTemplateInput): string {
  const property = input.propertyName ? ` — ${input.propertyName}` : "";
  return `${kindLabel(input.reminderKind)}${property}`;
}

export function buildRentReminderText(input: RentReminderTemplateInput): string {
  const from = input.landlordCompany
    ? `${input.landlordName} (${input.landlordCompany})`
    : input.landlordName;

  return [
    `Hi ${input.tenantName},`,
    "",
    kindIntro(input.reminderKind),
    "",
    `Amount outstanding: ${input.outstandingAmount}`,
    `Due date: ${input.dueDate}`,
    input.propertyName ? `Property: ${input.propertyName}` : "",
    "",
    "Please contact your landlord to arrange payment. This message does not confirm that an online payment was received.",
    "",
    `— ${from}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildRentReminderHtml(input: RentReminderTemplateInput): string {
  const from = input.landlordCompany
    ? `${escapeHtml(input.landlordName)} (${escapeHtml(input.landlordCompany)})`
    : escapeHtml(input.landlordName);

  return `<!DOCTYPE html>
<html>
  <body style="font-family: system-ui, sans-serif; color: #0f172a; line-height: 1.5;">
    <p>Hi ${escapeHtml(input.tenantName)},</p>
    <p>${escapeHtml(kindIntro(input.reminderKind))}</p>
    <table style="margin: 16px 0; border-collapse: collapse;">
      <tr><td style="padding: 4px 12px 4px 0; color: #64748b;">Amount outstanding</td><td><strong>${escapeHtml(input.outstandingAmount)}</strong></td></tr>
      <tr><td style="padding: 4px 12px 4px 0; color: #64748b;">Due date</td><td>${escapeHtml(input.dueDate)}</td></tr>
      ${input.propertyName ? `<tr><td style="padding: 4px 12px 4px 0; color: #64748b;">Property</td><td>${escapeHtml(input.propertyName)}</td></tr>` : ""}
    </table>
    <p>Please contact your landlord to arrange payment. This message does not confirm that an online payment was received.</p>
    <p style="color: #64748b;">— ${from}</p>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
