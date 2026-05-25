import { Injectable, Logger, Inject } from "@nestjs/common";
import { Job } from "bullmq";
import { BaseProcessor } from "./base.processor";
import {
  JobData,
  QUEUE_SERVICE,
  QUEUE_NAMES,
} from "../interfaces/queue.interface";
import { QueueService } from "../queue.service";
import { EmailService } from "@/modules/auth/services/email.service";

/**
 * Notification Job Types
 */
export enum NotificationJobType {
  // Email notifications
  SEND_EMAIL = "notification.email.send",
  SEND_EMAIL_VERIFICATION = "notification.email.verification",
  SEND_PASSWORD_RESET = "notification.email.password_reset",
  SEND_WELCOME = "notification.email.welcome",
  SEND_ALERT_EMAIL = "notification.email.alert",

  // Slack notifications
  SEND_SLACK = "notification.slack.send",
  SEND_SLACK_ALERT = "notification.slack.alert",

  // PagerDuty notifications
  SEND_PAGERDUTY = "notification.pagerduty.send",
  SEND_PAGERDUTY_ALERT = "notification.pagerduty.alert",
  RESOLVE_PAGERDUTY = "notification.pagerduty.resolve",

  // Microsoft Teams notifications
  SEND_TEAMS = "notification.teams.send",
  SEND_TEAMS_ALERT = "notification.teams.alert",

  // Webhook notifications
  SEND_WEBHOOK = "notification.webhook.send",

  // Batch notifications
  SEND_BATCH = "notification.batch",
}

/**
 * Notifications Processor
 * Handles delivery of notifications across multiple channels
 */
@Injectable()
export class NotificationsProcessor extends BaseProcessor {
  protected readonly logger = new Logger(NotificationsProcessor.name);
  protected readonly processorName = "NotificationsProcessor";

  constructor(
    private readonly emailService: EmailService,
    @Inject(QUEUE_SERVICE)
    private readonly queueService: QueueService,
  ) {
    super();
  }

  async process(job: Job<JobData>): Promise<void> {
    this.validateJobData(job);
    const correlationId = this.getCorrelationId(job);

    this.logger.debug(`Processing notification job ${job.id}`, {
      type: job.data.type,
      correlationId,
    });

    switch (job.data.type) {
      // Email notifications
      case NotificationJobType.SEND_EMAIL:
        await this.sendEmail(job);
        break;
      case NotificationJobType.SEND_EMAIL_VERIFICATION:
        await this.sendEmailVerification(job);
        break;
      case NotificationJobType.SEND_PASSWORD_RESET:
        await this.sendPasswordReset(job);
        break;
      case NotificationJobType.SEND_WELCOME:
        await this.sendWelcomeEmail(job);
        break;
      case NotificationJobType.SEND_ALERT_EMAIL:
        await this.sendAlertEmail(job);
        break;

      // Slack notifications
      case NotificationJobType.SEND_SLACK:
      case NotificationJobType.SEND_SLACK_ALERT:
        await this.sendSlack(job);
        break;

      // PagerDuty notifications
      case NotificationJobType.SEND_PAGERDUTY:
      case NotificationJobType.SEND_PAGERDUTY_ALERT:
        await this.sendPagerDuty(job);
        break;
      case NotificationJobType.RESOLVE_PAGERDUTY:
        await this.resolvePagerDuty(job);
        break;

      // Microsoft Teams notifications
      case NotificationJobType.SEND_TEAMS:
      case NotificationJobType.SEND_TEAMS_ALERT:
        await this.sendTeams(job);
        break;

      // Webhook notifications
      case NotificationJobType.SEND_WEBHOOK:
        await this.sendWebhook(job);
        break;

      // Batch notifications
      case NotificationJobType.SEND_BATCH:
        await this.sendBatch(job);
        break;

      default:
        this.logger.warn(`Unknown notification job type: ${job.data.type}`);
    }

    this.onComplete(job);
  }

  private async sendEmail(job: Job<JobData>): Promise<void> {
    const { to, subject, template, context } = job.data
      .payload as {
      to: string | string[];
      subject: string;
      template: string;
      context: Record<string, unknown>;
    };

    this.logger.debug(`Sending email`, { to, subject, template });

    try {
      const recipients = Array.isArray(to) ? to : [to];

      for (const recipient of recipients) {
        // Build email message (simplified - templates would be more sophisticated)
        const message = {
          to: recipient,
          subject,
          html: `<html><body>${context.message || template}</body></html>`,
          text: String(context.message || template),
        };

        await this.emailService.sendWithRetry(message);
      }

      this.logger.log(`Email sent to ${recipients.length} recipient(s)`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async sendEmailVerification(job: Job<JobData>): Promise<void> {
    const { userId, email, token } = job.data.payload as {
      userId: string;
      email: string;
      token: string;
    };

    this.logger.debug(`Sending email verification`, { userId, email });

    try {
      await this.emailService.sendVerificationEmail(email, token);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async sendPasswordReset(job: Job<JobData>): Promise<void> {
    const { userId, email, token } = job.data.payload as {
      userId: string;
      email: string;
      token: string;
    };

    this.logger.debug(`Sending password reset email`, { userId, email });

    try {
      await this.emailService.sendPasswordResetEmail(email, token);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async sendWelcomeEmail(job: Job<JobData>): Promise<void> {
    const { userId, email, firstName, organizationName } = job.data.payload as {
      userId: string;
      email: string;
      firstName: string;
      organizationName?: string;
    };

    this.logger.debug(`Sending welcome email`, { userId, email });

    try {
      const message = {
        to: email,
        subject: "Welcome to TelemetryFlow!",
        html: `
          <html>
            <body>
              <h1>Welcome to TelemetryFlow, ${firstName}!</h1>
              <p>We're excited to have you onboard${organizationName ? ` at ${organizationName}` : ""}.</p>
              <p>Get started by exploring your dashboard and setting up your first monitors.</p>
            </body>
          </html>
        `,
        text: `Welcome to TelemetryFlow, ${firstName}! We're excited to have you onboard${organizationName ? ` at ${organizationName}` : ""}.`,
      };

      await this.emailService.sendWithRetry(message);
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async sendAlertEmail(job: Job<JobData>): Promise<void> {
    const { alertId, ruleName, severity, message, recipients } = job.data
      .payload as {
      alertId: string;
      ruleName: string;
      severity: "critical" | "warning" | "info";
      message: string;
      recipients: string[];
    };

    this.logger.debug(`Sending alert email`, { alertId, ruleName, severity });

    try {
      const severityColors = {
        critical: "#FF0000",
        warning: "#FFA500",
        info: "#0000FF",
      };

      for (const recipient of recipients) {
        const emailMessage = {
          to: recipient,
          subject: `[${severity.toUpperCase()}] Alert: ${ruleName}`,
          html: `
            <html>
              <body>
                <div style="border-left: 4px solid ${severityColors[severity]}; padding-left: 16px;">
                  <h2 style="color: ${severityColors[severity]};">[${severity.toUpperCase()}] ${ruleName}</h2>
                  <p>${message}</p>
                  <p><small>Alert ID: ${alertId}</small></p>
                </div>
              </body>
            </html>
          `,
          text: `[${severity.toUpperCase()}] ${ruleName}\n\n${message}\n\nAlert ID: ${alertId}`,
        };

        await this.emailService.sendWithRetry(emailMessage);
      }

      this.logger.log(`Alert email sent to ${recipients.length} recipient(s)`);
    } catch (error) {
      this.logger.error(
        `Failed to send alert email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async sendSlack(job: Job<JobData>): Promise<void> {
    const { webhookUrl, channel, text, blocks, attachments } = job.data
      .payload as {
      webhookUrl: string;
      channel?: string;
      text: string;
      blocks?: unknown[];
      attachments?: unknown[];
    };

    this.logger.debug(`Sending Slack notification`, { channel });

    try {
      const payload = {
        channel,
        text,
        blocks,
        attachments,
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Slack webhook returned ${response.status}: ${await response.text()}`,
        );
      }

      this.logger.log(
        `Slack notification sent to ${channel || "default channel"}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send Slack notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async sendPagerDuty(job: Job<JobData>): Promise<void> {
    const {
      integrationKey,
      severity,
      summary,
      source,
      dedupKey,
      customDetails,
    } = job.data.payload as {
      integrationKey: string;
      severity: "critical" | "error" | "warning" | "info";
      summary: string;
      source: string;
      dedupKey?: string;
      customDetails?: Record<string, unknown>;
    };

    this.logger.debug(`Sending PagerDuty notification`, { severity, source });

    try {
      const payload = {
        routing_key: integrationKey,
        event_action: "trigger",
        dedup_key: dedupKey,
        payload: {
          summary,
          source,
          severity,
          custom_details: customDetails,
        },
      };

      const response = await fetch("https://events.pagerduty.com/v2/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `PagerDuty API returned ${response.status}: ${await response.text()}`,
        );
      }

      const result = await response.json();
      this.logger.log(
        `PagerDuty incident triggered: ${result.dedup_key || dedupKey}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send PagerDuty notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async resolvePagerDuty(job: Job<JobData>): Promise<void> {
    const { integrationKey, dedupKey } = job.data.payload as {
      integrationKey: string;
      dedupKey: string;
    };

    this.logger.debug(`Resolving PagerDuty incident`, { dedupKey });

    try {
      const payload = {
        routing_key: integrationKey,
        event_action: "resolve",
        dedup_key: dedupKey,
      };

      const response = await fetch("https://events.pagerduty.com/v2/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `PagerDuty API returned ${response.status}: ${await response.text()}`,
        );
      }

      this.logger.log(`PagerDuty incident resolved: ${dedupKey}`);
    } catch (error) {
      this.logger.error(
        `Failed to resolve PagerDuty incident: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async sendTeams(job: Job<JobData>): Promise<void> {
    const { webhookUrl, title, text, themeColor, sections } = job.data
      .payload as {
      webhookUrl: string;
      title: string;
      text: string;
      themeColor?: string;
      sections?: unknown[];
    };

    this.logger.debug(`Sending Microsoft Teams notification`, { title });

    try {
      // Microsoft Teams MessageCard format
      const payload = {
        "@type": "MessageCard",
        "@context": "https://schema.org/extensions",
        themeColor: themeColor || "0078D4",
        title,
        text,
        sections,
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Teams webhook returned ${response.status}: ${await response.text()}`,
        );
      }

      this.logger.log(`Teams notification sent: ${title}`);
    } catch (error) {
      this.logger.error(
        `Failed to send Teams notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async sendWebhook(job: Job<JobData>): Promise<void> {
    const { url, method, headers, body, timeout } = job.data.payload as {
      url: string;
      method: "POST" | "PUT";
      headers?: Record<string, string>;
      body: unknown;
      timeout?: number;
    };

    this.logger.debug(`Sending webhook`, { url, method });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout || 30000);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Webhook returned ${response.status}: ${await response.text()}`,
        );
      }

      this.logger.log(`Webhook delivered to ${url} (${method})`);
    } catch (error) {
      if (error.name === "AbortError") {
        this.logger.error(
          `Webhook timeout after ${timeout || 30000}ms: ${url}`,
        );
      } else {
        this.logger.error(
          `Failed to send webhook: ${error.message}`,
          error.stack,
        );
      }
      throw error;
    }
  }

  private async sendBatch(job: Job<JobData>): Promise<void> {
    const { notifications } = job.data.payload as {
      notifications: Array<{
        type: NotificationJobType;
        payload: Record<string, unknown>;
      }>;
    };

    this.logger.debug(`Sending batch notifications`, {
      count: notifications.length,
    });

    try {
      // Queue individual notification jobs
      for (const notification of notifications) {
        await this.queueService.addJob(QUEUE_NAMES.NOTIFICATIONS, {
          type: notification.type,
          payload: notification.payload,
          metadata: job.data.metadata,
        });
      }

      this.logger.log(`Queued ${notifications.length} notification jobs`);
    } catch (error) {
      this.logger.error(
        `Failed to queue batch notifications: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
