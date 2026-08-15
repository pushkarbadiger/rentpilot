import type { EmailProvider, SendEmailInput, SendEmailResult } from "./types";

export * from "./types";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;

export const isEmailConfigured = Boolean(RESEND_API_KEY && EMAIL_FROM);

class ResendEmailProvider implements EmailProvider {
  name = "resend";

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    if (!RESEND_API_KEY || !EMAIL_FROM) {
      throw new Error("Email provider is not configured.");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
        ...(input.idempotencyKey
          ? { "Idempotency-Key": input.idempotencyKey }
          : {}),
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };

    if (!response.ok) {
      console.error("[email] resend send failed", {
        status: response.status,
        message: payload.message,
      });
      throw new Error("Email delivery failed.");
    }

    return {
      provider: this.name,
      messageId: payload.id ?? null,
    };
  }
}

const unconfiguredProvider: EmailProvider = {
  name: "unconfigured",
  async send() {
    throw new Error("Email provider is not configured.");
  },
};

let resendProvider: ResendEmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (!isEmailConfigured) return unconfiguredProvider;
  if (!resendProvider) resendProvider = new ResendEmailProvider();
  return resendProvider;
}
