export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Provider-specific idempotency key to reduce duplicate sends on retry. */
  idempotencyKey?: string;
}

export interface SendEmailResult {
  provider: string;
  messageId: string | null;
}

export interface EmailProvider {
  name: string;
  send(input: SendEmailInput): Promise<SendEmailResult>;
}
