/**
 * Email Service
 *
 * Handles sending authentication-related emails with retry logic
 * Uses branded email templates for consistent user experience
 */

import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";
import { getEmailConfig, EmailConfig } from "../config/email.config";
import {
  loginNotificationTemplate,
  LoginNotificationData,
  passwordChangeTemplate,
  PasswordChangeData,
  passwordResetTemplate,
  PasswordResetData,
  emailVerificationTemplate,
  EmailVerificationData,
  mfaConfirmationTemplate,
  MFAConfirmationData,
  securityAlertTemplate,
  SecurityAlertData,
  SecurityAlertType,
  accountLockoutTemplate,
  AccountLockoutData,
  passwordReminderTemplate,
  PasswordReminderData,
  administratorDeactivationTemplate,
  AdministratorDeactivationData,
} from "../templates";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export { SecurityAlertType };

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly config: EmailConfig;
  private transporter: Transporter | null = null;

  constructor() {
    this.config = getEmailConfig();
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    if (!this.config.enabled) {
      this.logger.warn(
        "Email service is disabled. Emails will be logged to console.",
      );
      return;
    }

    try {
      this.transporter = nodemailer.createTransport(this.config.smtp);
      this.logger.log(
        `Email service initialized with SMTP host: ${this.config.smtp.host}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize email transporter: ${error.message}`,
      );
      this.transporter = null;
    }
  }

  /**
   * Send email with retry logic
   */
  async sendWithRetry(
    message: EmailMessage,
    maxRetries?: number,
  ): Promise<void> {
    const retries = maxRetries ?? this.config.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.send(message);

        if (attempt > 1) {
          this.logger.log(`Email sent successfully on attempt ${attempt}`);
        }

        return;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Email send attempt ${attempt}/${retries} failed: ${error.message}`,
        );

        if (attempt < retries) {
          const delay = this.config.retryDelay * attempt;
          await this.sleep(delay);
        }
      }
    }

    this.logger.error(
      `Failed to send email after ${retries} attempts: ${lastError?.message}`,
    );
    throw lastError;
  }

  /**
   * Send email
   */
  private async send(message: EmailMessage): Promise<void> {
    if (!this.config.enabled || !this.transporter) {
      this.logger.log(
        `[EMAIL MOCK] To: ${message.to}, Subject: ${message.subject}`,
      );
      this.logger.debug(`[EMAIL MOCK] Content: ${message.text}`);
      return;
    }

    const mailOptions = {
      from: `${this.config.from.name} <${this.config.from.address}>`,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      replyTo: this.config.replyTo,
    };

    await this.transporter.sendMail(mailOptions);
    this.logger.log(`Email sent to ${message.to}: ${message.subject}`);
  }

  /**
   * Send login notification email
   */
  async sendLoginNotification(
    email: string,
    deviceInfo: {
      browser: string;
      os: string;
      location?: string;
      ipAddress?: string;
    },
  ): Promise<void> {
    const data: LoginNotificationData = {
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      location: deviceInfo.location,
      ipAddress: deviceInfo.ipAddress,
      timestamp: new Date(),
    };

    const { html, text } = loginNotificationTemplate(data);

    const message: EmailMessage = {
      to: email,
      subject: "New Login Detected - TelemetryFlow",
      html,
      text,
    };

    await this.sendWithRetry(message);
  }

  /**
   * Send password change confirmation email
   */
  async sendPasswordChangeConfirmation(email: string): Promise<void> {
    const data: PasswordChangeData = {
      timestamp: new Date(),
    };

    const { html, text } = passwordChangeTemplate(data);

    const message: EmailMessage = {
      to: email,
      subject: "Password Changed Successfully - TelemetryFlow",
      html,
      text,
    };

    await this.sendWithRetry(message);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    const data: PasswordResetData = {
      resetToken,
      expiryHours: 1,
    };

    const { html, text } = passwordResetTemplate(data);

    const message: EmailMessage = {
      to: email,
      subject: "Reset Your Password - TelemetryFlow",
      html,
      text,
    };

    await this.sendWithRetry(message);
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(
    email: string,
    verificationToken: string,
  ): Promise<void> {
    const data: EmailVerificationData = {
      verificationToken,
      expiryHours: 24,
    };

    const { html, text } = emailVerificationTemplate(data);

    const message: EmailMessage = {
      to: email,
      subject: "Verify Your Email Address - TelemetryFlow",
      html,
      text,
    };

    await this.sendWithRetry(message);
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlert(
    email: string,
    alertType: SecurityAlertType,
    details?: Record<string, any>,
  ): Promise<void> {
    const data: SecurityAlertData = {
      alertType,
      details,
      timestamp: new Date(),
    };

    const { html, text } = securityAlertTemplate(data);

    const alertTitles = {
      [SecurityAlertType.LOGIN_NEW_DEVICE]: "New Device Login",
      [SecurityAlertType.PASSWORD_CHANGED]: "Password Changed",
      [SecurityAlertType.MFA_ENABLED]: "MFA Enabled",
      [SecurityAlertType.MFA_DISABLED]: "MFA Disabled",
      [SecurityAlertType.ACCOUNT_LOCKED]: "Account Locked",
      [SecurityAlertType.DEVICE_REVOKED]: "Device Revoked",
      [SecurityAlertType.SUSPICIOUS_ACTIVITY]: "Suspicious Activity",
    };

    const message: EmailMessage = {
      to: email,
      subject: `Security Alert: ${alertTitles[alertType]} - TelemetryFlow`,
      html,
      text,
    };

    await this.sendWithRetry(message);
  }

  /**
   * Send MFA confirmation email
   */
  async sendMFAConfirmation(email: string, enabled: boolean): Promise<void> {
    const data: MFAConfirmationData = {
      enabled,
      timestamp: new Date(),
    };

    const { html, text } = mfaConfirmationTemplate(data);

    const action = enabled ? "Enabled" : "Disabled";

    const message: EmailMessage = {
      to: email,
      subject: `Multi-Factor Authentication ${action} - TelemetryFlow`,
      html,
      text,
    };

    await this.sendWithRetry(message);
  }

  /**
   * Send account lockout notification
   */
  async sendAccountLockoutNotification(
    email: string,
    lockedUntil?: Date,
  ): Promise<void> {
    const data: AccountLockoutData = {
      lockedUntil,
      reason: "multiple failed login attempts",
      failedAttempts: 5,
    };

    const { html, text } = accountLockoutTemplate(data);

    const message: EmailMessage = {
      to: email,
      subject: "Account Locked - TelemetryFlow",
      html,
      text,
    };

    await this.sendWithRetry(message);
  }

  /**
   * Send password reminder email
   */
  async sendPasswordReminder(email: string, reminder: string): Promise<void> {
    const data: PasswordReminderData = {
      reminder,
    };

    const { html, text } = passwordReminderTemplate(data);

    const message: EmailMessage = {
      to: email,
      subject: "Password Reminder - TelemetryFlow",
      html,
      text,
    };

    await this.sendWithRetry(message);
  }

  /**
   * Send administrator deactivation notification email
   */
  async sendAdministratorDeactivationNotification(
    email: string,
  ): Promise<void> {
    const data: AdministratorDeactivationData = {
      timestamp: new Date(),
    };

    const { html, text } = administratorDeactivationTemplate(data);

    const message: EmailMessage = {
      to: email,
      subject: "Administrator Account Deactivated - TelemetryFlow",
      html,
      text,
    };

    await this.sendWithRetry(message);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
