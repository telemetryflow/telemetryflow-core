/**
 * Email Provider Interface
 * Abstracts the email sending implementation for different providers (SMTP, SendGrid, etc.)
 */
export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailProvider {
  /**
   * Send an email
   * @param message The email message to send
   * @returns Result indicating success/failure
   */
  send(message: EmailMessage): Promise<EmailResult>;

  /**
   * Verify the connection to the email provider
   * @returns True if connection is valid
   */
  verify(): Promise<boolean>;
}

export const EMAIL_PROVIDER = Symbol("EMAIL_PROVIDER");
