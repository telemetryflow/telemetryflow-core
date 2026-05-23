import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { IEmailProvider, EmailMessage, EmailResult } from "./IEmailProvider";

/**
 * SMTP Email Provider
 * Implements email sending via SMTP using Nodemailer
 */
@Injectable()
export class SMTPEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(SMTPEmailProvider.name);
  private transporter: Transporter<SMTPTransport.SentMessageInfo>;
  private readonly fromAddress: string;
  private readonly smtpEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.fromAddress =
      this.configService.get<string>("SMTP_FROM_ADDRESS") ||
      "noreply@telemetryflow.id";

    // SMTP_ENABLED controls whether emails are actually sent.
    // When false, send() logs and returns a no-op success so callers don't error.
    const enabledRaw = this.configService.get<string>("SMTP_ENABLED", "false");
    this.smtpEnabled = enabledRaw === "true" || enabledRaw === "1";

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>("SMTP_HOST") || "localhost",
      port: this.configService.get<number>("SMTP_PORT") || 587,
      secure: this.configService.get<boolean>("SMTP_SECURE") || false,
      auth: this.getAuthConfig(),
      tls: {
        rejectUnauthorized:
          this.configService.get<string>("SMTP_TLS_REJECT_UNAUTHORIZED") !== "false",
      },
    });

    if (!this.smtpEnabled) {
      this.logger.warn(
        "SMTP is disabled (SMTP_ENABLED=false). Emails will be logged but NOT sent. " +
          "Set SMTP_ENABLED=true and configure SMTP_HOST/SMTP_USER/SMTP_PASSWORD to enable.",
      );
    }
  }

  private getAuthConfig(): { user: string; pass: string } | undefined {
    const user = this.configService.get<string>("SMTP_USER");
    const pass = this.configService.get<string>("SMTP_PASSWORD");

    if (user && pass) {
      return { user, pass };
    }
    return undefined;
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    if (!this.smtpEnabled) {
      this.logger.log(
        `[SMTP DISABLED] Would send email to ${Array.isArray(message.to) ? message.to.join(", ") : message.to} — subject: "${message.subject}"`,
      );
      return { success: true, messageId: "smtp-disabled" };
    }

    try {
      const result = await this.transporter.sendMail({
        from: message.from || this.fromAddress,
        to: Array.isArray(message.to) ? message.to.join(", ") : message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        replyTo: message.replyTo,
        attachments: message.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      });

      this.logger.log(
        `Email sent successfully to ${message.to}, messageId: ${result.messageId}`,
      );

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to send email to ${message.to}: ${errorMessage}`,
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async verify(): Promise<boolean> {
    if (!this.smtpEnabled) {
      this.logger.warn("SMTP is disabled — skipping connection verification");
      return false;
    }
    try {
      await this.transporter.verify();
      this.logger.log("SMTP connection verified successfully");
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`SMTP connection verification failed: ${errorMessage}`);
      return false;
    }
  }

  isEnabled(): boolean {
    return this.smtpEnabled;
  }
}
