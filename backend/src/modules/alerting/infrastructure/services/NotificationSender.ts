import { Injectable, Logger, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import * as nodemailer from "nodemailer";
import {
  INotificationSender,
  AlertNotification,
  NotificationChannelConfig,
  SendNotificationResult,
} from "./INotificationSender";
import { EmailService } from "../../../notification/domain/services/EmailService";

@Injectable()
export class NotificationSender implements INotificationSender {
  private readonly logger = new Logger(NotificationSender.name);
  private readonly appName: string;
  private readonly appUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly emailService?: EmailService,
  ) {
    this.appName =
      this.configService.get<string>("APP_NAME") || "TelemetryFlow";
    this.appUrl =
      this.configService.get<string>("APP_URL") || "http://localhost:5173";
  }

  async send(
    channelType: string,
    config: NotificationChannelConfig,
    notification: AlertNotification,
  ): Promise<SendNotificationResult> {
    try {
      switch (channelType) {
        case "email":
          return this.sendEmail(config, notification);
        case "discord":
          return this.sendDiscord(config, notification);
        case "slack":
          return this.sendSlack(config, notification);
        case "msteams":
          return this.sendMSTeams(config, notification);
        case "zoom":
          return this.sendZoom(config, notification);
        case "telegram":
          return this.sendTelegram(config, notification);
        case "webhook":
          return this.sendWebhook(config, notification);
        case "pagerduty":
          return this.sendPagerDuty(config, notification);
        case "teams": // Legacy alias for msteams
          return this.sendMSTeams(
            { ...config, msteams: config.teams },
            notification,
          );
        case "opsgenie":
          return this.sendOpsGenie(config, notification);
        default:
          return {
            success: false,
            channelId: "",
            channelType,
            error: `Unsupported channel type: ${channelType}`,
          };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Failed to send notification via ${channelType}: ${errorMessage}`,
      );
      return {
        success: false,
        channelId: "",
        channelType,
        error: errorMessage,
      };
    }
  }

  async sendToMultipleChannels(
    channels: Array<{
      type: string;
      config: NotificationChannelConfig;
      id: string;
    }>,
    notification: AlertNotification,
  ): Promise<SendNotificationResult[]> {
    const results = await Promise.allSettled(
      channels.map(async (channel) => {
        const result = await this.send(
          channel.type,
          channel.config,
          notification,
        );
        return { ...result, channelId: channel.id };
      }),
    );

    return results.map((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      return {
        success: false,
        channelId: "",
        channelType: "unknown",
        error: result.reason?.message || "Failed to send notification",
      };
    });
  }

  private async sendEmail(
    config: NotificationChannelConfig,
    notification: AlertNotification,
  ): Promise<SendNotificationResult> {
    if (!config.email) {
      return {
        success: false,
        channelId: "",
        channelType: "email",
        error: "Email configuration is missing",
      };
    }

    if (!config.email.recipients || config.email.recipients.length === 0) {
      return {
        success: false,
        channelId: "",
        channelType: "email",
        error: "No recipients configured",
      };
    }

    // Use per-channel SMTP if smtpHost is configured; otherwise fall back to global EmailService
    if (config.email.smtpHost) {
      return this.sendEmailViaCustomSmtp(config.email, notification);
    }

    if (!this.emailService) {
      return {
        success: false,
        channelId: "",
        channelType: "email",
        error: "EmailService not available and no per-channel SMTP configured",
      };
    }

    try {
      const result = await this.emailService.sendAlertNotificationEmail(
        config.email.recipients,
        {
          alertInstanceId: notification.alertInstanceId,
          alertRuleId: notification.alertRuleId,
          alertRuleName: notification.alertRuleName,
          severity: notification.severity,
          status: notification.status,
          title: notification.title,
          description: notification.description,
          currentValue: notification.currentValue,
          threshold: notification.threshold,
          labels: notification.labels,
          startsAt: notification.startsAt,
          endsAt: notification.endsAt,
          fingerprint: notification.fingerprint,
        },
      );

      if (!result.success) {
        return {
          success: false,
          channelId: "",
          channelType: "email",
          error: result.error || "Failed to send alert email",
        };
      }

      this.logger.log(
        `[EMAIL] Alert sent to ${config.email.recipients.join(", ")}: ${notification.title}`,
      );
      return { success: true, channelId: "", channelType: "email" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        channelId: "",
        channelType: "email",
        error: errorMessage,
      };
    }
  }

  private async sendEmailViaCustomSmtp(
    emailConfig: NonNullable<NotificationChannelConfig["email"]>,
    notification: AlertNotification,
  ): Promise<SendNotificationResult> {
    try {
      const transporter = nodemailer.createTransport({
        host: emailConfig.smtpHost,
        port: emailConfig.smtpPort || 587,
        secure: emailConfig.smtpSecure ?? false,
        auth:
          emailConfig.smtpUser && emailConfig.smtpPassword
            ? {
                user: emailConfig.smtpUser,
                pass: emailConfig.smtpPassword,
              }
            : undefined,
      });

      // Use the alert-notification.hbs Handlebars template via EmailService
      let html: string;
      let subject: string;
      if (this.emailService) {
        const rendered = this.emailService.renderAlertNotificationHtml({
          alertInstanceId: notification.alertInstanceId,
          alertRuleId: notification.alertRuleId,
          alertRuleName: notification.alertRuleName,
          severity: notification.severity,
          status: notification.status,
          title: notification.title,
          description: notification.description,
          currentValue: notification.currentValue,
          threshold: notification.threshold,
          labels: notification.labels,
          startsAt: notification.startsAt,
          endsAt: notification.endsAt,
          fingerprint: notification.fingerprint,
        });
        html = rendered.html;
        subject = rendered.subject;
      } else {
        // Fallback: plain inline HTML if EmailService is not wired
        const statusText = notification.status === "firing" ? "FIRING" : "RESOLVED";
        subject = `[${this.appName}] ${notification.severity.toUpperCase()}: ${notification.alertRuleName} — ${statusText}`;
        html = `<p><strong>${notification.title}</strong></p><p>${notification.description}</p><p>Status: ${statusText} | Severity: ${notification.severity.toUpperCase()} | Value: ${notification.currentValue} / Threshold: ${notification.threshold}</p>`;
      }

      // Use custom subject if configured, otherwise use rendered/fallback subject
      const finalSubject = emailConfig.subject
        ? this.substituteTemplatePlaceholders(emailConfig.subject, notification)
        : subject;

      await transporter.sendMail({
        from: emailConfig.fromEmail
          ? `"${emailConfig.fromName || this.appName}" <${emailConfig.fromEmail}>`
          : undefined,
        to: emailConfig.recipients.join(", "),
        cc: emailConfig.cc?.length ? emailConfig.cc.join(", ") : undefined,
        bcc: emailConfig.bcc?.length ? emailConfig.bcc.join(", ") : undefined,
        subject: finalSubject,
        html,
      });

      this.logger.log(
        `[EMAIL/SMTP] Alert sent to ${emailConfig.recipients.join(", ")} via ${emailConfig.smtpHost}: ${notification.title}`,
      );
      return { success: true, channelId: "", channelType: "email" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        channelId: "",
        channelType: "email",
        error: `SMTP error (${emailConfig.smtpHost}): ${errorMessage}`,
      };
    }
  }

  private async sendDiscord(
    config: NotificationChannelConfig,
    notification: AlertNotification,
  ): Promise<SendNotificationResult> {
    if (!config.discord?.webhookUrl) {
      return {
        success: false,
        channelId: "",
        channelType: "discord",
        error: "Discord webhook URL is missing",
      };
    }

    const statusEmoji = notification.status === "firing" ? "🔥" : "✅";
    const statusText = notification.status === "firing" ? "FIRING" : "RESOLVED";
    // Discord uses decimal color (0-16777215)
    const color =
      config.discord.embedColor ??
      this.getSeverityColorDecimal(notification.severity);

    const mentionContent =
      config.discord.mentionRoles && config.discord.mentionRoles.length > 0
        ? config.discord.mentionRoles.map((r) => `<@&${r}>`).join(" ") + " "
        : "";

    const payload = {
      username: config.discord.username || this.appName,
      avatar_url: config.discord.avatarUrl || undefined,
      content: mentionContent || undefined,
      embeds: [
        {
          title: `${statusEmoji} ${notification.title}`,
          description: notification.description,
          color,
          fields: [
            { name: "Status", value: statusText, inline: true },
            {
              name: "Severity",
              value: notification.severity.toUpperCase(),
              inline: true,
            },
            {
              name: "Alert Rule",
              value: notification.alertRuleName,
              inline: true,
            },
            {
              name: "Current Value",
              value: String(notification.currentValue),
              inline: true,
            },
            {
              name: "Threshold",
              value: String(notification.threshold),
              inline: true,
            },
            {
              name: "Started At",
              value: notification.startsAt.toISOString(),
              inline: true,
            },
            ...(notification.endsAt
              ? [
                  {
                    name: "Ended At",
                    value: notification.endsAt.toISOString(),
                    inline: true,
                  },
                ]
              : []),
          ],
          footer: { text: this.appName },
          timestamp: notification.startsAt.toISOString(),
          url: `${this.appUrl}/alerts/${notification.alertInstanceId}`,
        },
      ],
    };

    try {
      const response = await fetch(config.discord.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Discord returns 204 No Content on success
      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          channelId: "",
          channelType: "discord",
          error: `Discord webhook error: ${response.status} - ${errorText}`,
        };
      }

      return { success: true, channelId: "", channelType: "discord" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        channelId: "",
        channelType: "discord",
        error: errorMessage,
      };
    }
  }

  private async sendSlack(
    config: NotificationChannelConfig,
    notification: AlertNotification,
  ): Promise<SendNotificationResult> {
    if (!config.slack?.webhookUrl) {
      return {
        success: false,
        channelId: "",
        channelType: "slack",
        error: "Slack webhook URL is missing",
      };
    }

    const color = this.getSeverityColor(notification.severity);
    const statusEmoji =
      notification.status === "firing" ? ":fire:" : ":white_check_mark:";
    const statusText = notification.status === "firing" ? "FIRING" : "RESOLVED";
    const buttonStyle =
      notification.status === "firing" ? "danger" : "primary";

    // Block Kit format (current Slack standard — attachments are soft-deprecated)
    const payload = {
      // Fallback text for notifications and unfurls
      text: `${statusEmoji} *${notification.title}* — ${statusText}`,
      username: config.slack.username || this.appName,
      icon_emoji: config.slack.iconEmoji || ":bell:",
      channel: config.slack.channel,
      blocks: [
        // Header
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${statusEmoji} ${notification.title}`,
            emoji: true,
          },
        },
        // Status + severity row
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Status:*\n${statusText}`,
            },
            {
              type: "mrkdwn",
              text: `*Severity:*\n${notification.severity.toUpperCase()}`,
            },
            {
              type: "mrkdwn",
              text: `*Alert Rule:*\n${notification.alertRuleName}`,
            },
            {
              type: "mrkdwn",
              text: `*Value / Threshold:*\n${notification.currentValue} / ${notification.threshold}`,
            },
          ],
        },
        // Description
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: notification.description,
          },
        },
        // Timestamp context
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: [
                `*Started:* ${notification.startsAt.toISOString()}`,
                notification.endsAt
                  ? `*Ended:* ${notification.endsAt.toISOString()}`
                  : null,
                `*Powered by:* ${this.appName}`,
              ]
                .filter(Boolean)
                .join("  |  "),
            },
          ],
        },
        // Colored divider via attachment (color bar at bottom)
        {
          type: "divider",
        },
        // Action button
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "View Alert", emoji: true },
              url: `${this.appUrl}/alerts/${notification.alertInstanceId}`,
              style: buttonStyle,
            },
          ],
        },
      ],
      // Keep one attachment for the colored left border (still supported)
      attachments: [
        {
          color,
          fallback: `${notification.title} — ${statusText}`,
        },
      ],
    };

    try {
      const response = await fetch(config.slack.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          channelId: "",
          channelType: "slack",
          error: `Slack API error: ${response.status} - ${errorText}`,
        };
      }

      return { success: true, channelId: "", channelType: "slack" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        channelId: "",
        channelType: "slack",
        error: errorMessage,
      };
    }
  }

  private async sendMSTeams(
    config: NotificationChannelConfig,
    notification: AlertNotification,
  ): Promise<SendNotificationResult> {
    const teamsConfig = config.msteams || config.teams;
    if (!teamsConfig?.webhookUrl) {
      return {
        success: false,
        channelId: "",
        channelType: "msteams",
        error: "MS Teams webhook URL is missing",
      };
    }

    const severityColor = this.getSeverityColor(notification.severity);
    const statusText = notification.status === "firing" ? "FIRING" : "RESOLVED";
    const statusEmoji = notification.status === "firing" ? "🔴" : "✅";
    const cardTitle = config.msteams?.title || `${this.appName} Alert`;

    // Adaptive Card format — required for Power Automate Workflow webhooks
    // (Office 365 Connectors retired April 30, 2026)
    const payload = {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          contentUrl: null,
          content: {
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.5",
            body: [
              // Title bar with colored strip
              {
                type: "ColumnSet",
                style:
                  notification.severity === "critical"
                    ? "attention"
                    : notification.severity === "warning"
                      ? "warning"
                      : "default",
                bleed: true,
                columns: [
                  {
                    type: "Column",
                    width: "stretch",
                    items: [
                      {
                        type: "TextBlock",
                        text: `${statusEmoji} ${cardTitle}`,
                        weight: "Bolder",
                        size: "Medium",
                        color: "Light",
                      },
                    ],
                  },
                ],
              },
              // Alert name + description
              {
                type: "TextBlock",
                text: notification.title,
                weight: "Bolder",
                size: "Large",
                wrap: true,
                spacing: "Medium",
              },
              {
                type: "TextBlock",
                text: notification.description,
                wrap: true,
                color: "Default",
                isSubtle: true,
              },
              // Key facts
              {
                type: "FactSet",
                spacing: "Medium",
                facts: [
                  { title: "Status", value: statusText },
                  {
                    title: "Severity",
                    value: notification.severity.toUpperCase(),
                  },
                  { title: "Alert Rule", value: notification.alertRuleName },
                  {
                    title: "Value / Threshold",
                    value: `${notification.currentValue} / ${notification.threshold}`,
                  },
                  {
                    title: "Started At",
                    value: notification.startsAt.toISOString(),
                  },
                  ...(notification.endsAt
                    ? [
                        {
                          title: "Ended At",
                          value: notification.endsAt.toISOString(),
                        },
                      ]
                    : []),
                ],
              },
            ],
            actions: [
              {
                type: "Action.OpenUrl",
                title: "View Alert",
                url: `${this.appUrl}/alerts/${notification.alertInstanceId}`,
                style: "destructive",
              },
            ],
            // Accessibility: msteams renderer uses this for notification text
            msteams: {
              width: "Full",
            },
          },
        },
      ],
    };

    this.logger.debug(
      `[MSTEAMS] Severity color for theming: ${severityColor}`,
    );

    try {
      const response = await fetch(teamsConfig.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          channelId: "",
          channelType: "msteams",
          error: `MS Teams webhook error: ${response.status} - ${errorText}`,
        };
      }

      return { success: true, channelId: "", channelType: "msteams" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        channelId: "",
        channelType: "msteams",
        error: errorMessage,
      };
    }
  }

  private async sendZoom(
    config: NotificationChannelConfig,
    notification: AlertNotification,
  ): Promise<SendNotificationResult> {
    if (!config.zoom?.webhookUrl) {
      return {
        success: false,
        channelId: "",
        channelType: "zoom",
        error: "Zoom webhook URL is missing. Please edit the channel and enter the Zoom incoming webhook URL.",
      };
    }

    const statusText =
      notification.status === "firing" ? "🔥 FIRING" : "✅ RESOLVED";
    const color =
      notification.status === "firing" ? "#ef4444" : "#22c55e";

    // Zoom Incoming Webhook with ?format=fields expects a flat key-value object.
    // Each key becomes a field label, each value is displayed as a string.
    // Ref: spectrio-uptime/source/server/notification-providers/zoom.js
    const data: Record<string, string> = {
      State: statusText,
      Alert: notification.alertRuleName,
      Title: notification.title,
      Description: notification.description,
      Severity: notification.severity.toUpperCase(),
      "Current Value": notification.currentValue.toString(),
      Threshold: notification.threshold.toString(),
      color, // color must be last — some webhook parsers only apply it if last
    };

    // Append ?format=fields (clean duplicates first)
    let webhookUrl = config.zoom.webhookUrl.replace(/[?&]format=fields/g, "");
    webhookUrl += (webhookUrl.includes("?") ? "&" : "?") + "format=fields";

    // Build headers — additional headers from config come first,
    // then authToken field adds Authorization: Bearer {token} if not already set
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (config.zoom.headers && typeof config.zoom.headers === "object") {
      Object.assign(headers, config.zoom.headers);
    }

    // authToken (dedicated field) — only applied if Authorization not already in headers
    if (config.zoom.authToken && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${config.zoom.authToken}`;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          channelId: "",
          channelType: "zoom",
          error: `Zoom webhook error: ${response.status} - ${errorText}`,
        };
      }

      return { success: true, channelId: "", channelType: "zoom" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        channelId: "",
        channelType: "zoom",
        error: errorMessage,
      };
    }
  }

  private async sendTelegram(
    config: NotificationChannelConfig,
    notification: AlertNotification,
  ): Promise<SendNotificationResult> {
    if (!config.telegram?.botToken || !config.telegram?.chatId) {
      return {
        success: false,
        channelId: "",
        channelType: "telegram",
        error: "Telegram bot token or chat ID is missing",
      };
    }

    const statusEmoji = notification.status === "firing" ? "🔥" : "✅";
    const statusText = notification.status === "firing" ? "FIRING" : "RESOLVED";

    // Build message in HTML format
    const message = `
<b>${statusEmoji} ${notification.title}</b>

<b>Alert:</b> ${notification.alertRuleName}
<b>Status:</b> ${statusText}
<b>Severity:</b> ${notification.severity.toUpperCase()}
<b>Current Value:</b> ${notification.currentValue}
<b>Threshold:</b> ${notification.threshold}
<b>Started:</b> ${notification.startsAt.toISOString()}
${notification.endsAt ? `<b>Ended:</b> ${notification.endsAt.toISOString()}` : ""}

${notification.description}

<a href="${this.appUrl}/alerts/${notification.alertInstanceId}">View Alert</a>
    `.trim();

    const apiUrl = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;
    const payload = {
      chat_id: config.telegram.chatId,
      text: message,
      parse_mode: config.telegram.parseMode || "HTML",
      disable_notification: config.telegram.disableNotification || false,
      // Bot API 7.0+: replaces deprecated disable_web_page_preview
      link_preview_options: {
        is_disabled: true,
      },
    };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.ok) {
        return {
          success: false,
          channelId: "",
          channelType: "telegram",
          error: `Telegram API error: ${responseData.description || response.status}`,
        };
      }

      return {
        success: true,
        channelId: "",
        channelType: "telegram",
        response: responseData,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        channelId: "",
        channelType: "telegram",
        error: errorMessage,
      };
    }
  }

  private async sendWebhook(
    config: NotificationChannelConfig,
    notification: AlertNotification,
  ): Promise<SendNotificationResult> {
    if (!config.webhook?.url) {
      return {
        success: false,
        channelId: "",
        channelType: "webhook",
        error: "Webhook URL is missing",
      };
    }

    const wh = config.webhook;
    const contentType = wh.contentType || "json";
    const retryCount = Math.min(wh.retryCount ?? 0, 3);

    // ── Build request body ──────────────────────────────────────────────────
    let rawBody: string;

    if (wh.bodyTemplate) {
      rawBody = this.substituteTemplatePlaceholders(wh.bodyTemplate, notification);
    } else {
      // Default Alertmanager-compatible payload
      const defaultPayload = {
        version: "1.0",
        groupKey: notification.fingerprint,
        status: notification.status,
        receiver: "webhook",
        alerts: [
          {
            status: notification.status,
            labels: {
              alertname: notification.alertRuleName,
              severity: notification.severity,
              ...notification.labels,
            },
            annotations: notification.annotations,
            startsAt: notification.startsAt.toISOString(),
            endsAt: notification.endsAt?.toISOString(),
            fingerprint: notification.fingerprint,
            values: {
              current: notification.currentValue,
              threshold: notification.threshold,
            },
          },
        ],
        externalURL: this.appUrl,
      };
      rawBody = JSON.stringify(defaultPayload);
    }

    // Encode body by content-type
    let encodedBody: string;
    let contentTypeHeader: string;

    if (contentType === "form") {
      // Parse JSON first, then encode as form-urlencoded
      contentTypeHeader = "application/x-www-form-urlencoded";
      try {
        const obj = JSON.parse(rawBody) as Record<string, unknown>;
        encodedBody = Object.entries(obj)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&");
      } catch {
        encodedBody = rawBody;
      }
    } else if (contentType === "text") {
      contentTypeHeader = "text/plain";
      encodedBody = rawBody;
    } else {
      // JSON (default)
      contentTypeHeader = "application/json";
      // Ensure valid JSON if using body template
      if (wh.bodyTemplate) {
        try {
          JSON.parse(rawBody); // validate
          encodedBody = rawBody;
        } catch {
          encodedBody = rawBody; // send as-is if invalid
        }
      } else {
        encodedBody = rawBody;
      }
    }

    // ── Build headers ───────────────────────────────────────────────────────
    const headers: Record<string, string> = {
      "Content-Type": contentTypeHeader,
      ...wh.headers,
    };

    // Authentication
    const authType = wh.authType || "none";
    if (authType === "bearer" && wh.authToken) {
      headers["Authorization"] = `Bearer ${wh.authToken}`;
    } else if (authType === "basic" && wh.basicAuth) {
      const credentials = Buffer.from(
        `${wh.basicAuth.username}:${wh.basicAuth.password}`,
      ).toString("base64");
      headers["Authorization"] = `Basic ${credentials}`;
    } else if (authType === "apikey" && wh.apiKey?.value) {
      headers[wh.apiKey.header || "X-Api-Key"] = wh.apiKey.value;
    }

    // HMAC-SHA256 signing
    if (wh.signingSecret) {
      const signature = crypto
        .createHmac("sha256", wh.signingSecret)
        .update(encodedBody)
        .digest("hex");
      headers[wh.signingHeader || "X-Webhook-Signature"] = `sha256=${signature}`;
    }

    // ── Send with retry ─────────────────────────────────────────────────────
    let lastError = "";
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const response = await fetch(wh.url, {
          method: wh.method || "POST",
          headers,
          body: wh.method === "GET" ? undefined : encodedBody,
        });

        if (!response.ok) {
          const errorText = await response.text();
          lastError = `Webhook error: ${response.status} - ${errorText}`;
          if (attempt < retryCount) {
            this.logger.warn(
              `[WEBHOOK] Attempt ${attempt + 1} failed (${response.status}), retrying...`,
            );
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          return { success: false, channelId: "", channelType: "webhook", error: lastError };
        }

        if (attempt > 0) {
          this.logger.log(`[WEBHOOK] Succeeded after ${attempt + 1} attempts`);
        }
        return { success: true, channelId: "", channelType: "webhook" };
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown error";
        if (attempt < retryCount) {
          this.logger.warn(
            `[WEBHOOK] Attempt ${attempt + 1} failed (${lastError}), retrying...`,
          );
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        return { success: false, channelId: "", channelType: "webhook", error: lastError };
      }
    }

    return { success: false, channelId: "", channelType: "webhook", error: lastError };
  }

  private async sendPagerDuty(
    config: NotificationChannelConfig,
    notification: AlertNotification,
  ): Promise<SendNotificationResult> {
    if (!config.pagerduty?.integrationKey) {
      return {
        success: false,
        channelId: "",
        channelType: "pagerduty",
        error: "PagerDuty integration key is missing",
      };
    }

    const eventAction =
      notification.status === "firing" ? "trigger" : "resolve";
    const severity =
      config.pagerduty.severity ||
      this.mapToPagerDutySeverity(notification.severity);

    const payload = {
      routing_key: config.pagerduty.integrationKey,
      event_action: eventAction,
      dedup_key: notification.fingerprint,
      payload: {
        summary: notification.title,
        severity,
        source: this.appName,
        timestamp: notification.startsAt.toISOString(),
        custom_details: {
          description: notification.description,
          currentValue: notification.currentValue,
          threshold: notification.threshold,
          alertRuleName: notification.alertRuleName,
          labels: notification.labels,
          annotations: notification.annotations,
        },
      },
      links: [
        {
          href: `${this.appUrl}/alerts/${notification.alertInstanceId}`,
          text: "View Alert in TelemetryFlow",
        },
      ],
    };

    try {
      const response = await fetch("https://events.pagerduty.com/v2/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          channelId: "",
          channelType: "pagerduty",
          error: `PagerDuty API error: ${response.status} - ${JSON.stringify(responseData)}`,
        };
      }

      return {
        success: true,
        channelId: "",
        channelType: "pagerduty",
        response: responseData,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        channelId: "",
        channelType: "pagerduty",
        error: errorMessage,
      };
    }
  }

  private async sendOpsGenie(
    config: NotificationChannelConfig,
    notification: AlertNotification,
  ): Promise<SendNotificationResult> {
    if (!config.opsgenie?.apiKey) {
      return {
        success: false,
        channelId: "",
        channelType: "opsgenie",
        error: "OpsGenie API key is missing",
      };
    }

    const apiUrl =
      config.opsgenie.apiUrl || "https://api.opsgenie.com/v2/alerts";
    const priority =
      config.opsgenie.priority ||
      this.mapToOpsGeniePriority(notification.severity);

    if (notification.status === "firing") {
      const payload = {
        message: notification.title,
        alias: notification.fingerprint,
        description: notification.description,
        priority,
        source: this.appName,
        tags: [notification.severity, notification.alertRuleName],
        details: {
          currentValue: notification.currentValue.toString(),
          threshold: notification.threshold.toString(),
          ...notification.labels,
        },
        entity: notification.alertRuleName,
      };

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `GenieKey ${config.opsgenie.apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return {
            success: false,
            channelId: "",
            channelType: "opsgenie",
            error: `OpsGenie API error: ${response.status} - ${errorText}`,
          };
        }

        return { success: true, channelId: "", channelType: "opsgenie" };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          channelId: "",
          channelType: "opsgenie",
          error: errorMessage,
        };
      }
    } else {
      try {
        const response = await fetch(
          `${apiUrl}/${notification.fingerprint}/close?identifierType=alias`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `GenieKey ${config.opsgenie.apiKey}`,
            },
            body: JSON.stringify({
              source: this.appName,
              note: "Alert automatically resolved",
            }),
          },
        );

        if (!response.ok && response.status !== 404) {
          const errorText = await response.text();
          return {
            success: false,
            channelId: "",
            channelType: "opsgenie",
            error: `OpsGenie API error: ${response.status} - ${errorText}`,
          };
        }

        return { success: true, channelId: "", channelType: "opsgenie" };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return {
          success: false,
          channelId: "",
          channelType: "opsgenie",
          error: errorMessage,
        };
      }
    }
  }

  /**
   * Substitute template placeholders in body template.
   * Supports both {{variable}} (webhook body) and {variable} (subject line) syntax.
   */
  private substituteTemplatePlaceholders(
    template: string,
    notification: AlertNotification,
  ): string {
    const replacements: [RegExp, string][] = [
      [/\{?\{alertName\}?\}/g, notification.alertRuleName],
      [/\{?\{alertRuleName\}?\}/g, notification.alertRuleName],
      [/\{?\{title\}?\}/g, notification.title],
      [/\{?\{severity\}?\}/g, notification.severity],
      [/\{?\{status\}?\}/g, notification.status],
      [/\{?\{message\}?\}/g, notification.description],
      [/\{?\{description\}?\}/g, notification.description],
      [/\{?\{currentValue\}?\}/g, notification.currentValue.toString()],
      [/\{?\{value\}?\}/g, notification.currentValue.toString()],
      [/\{?\{threshold\}?\}/g, notification.threshold.toString()],
      [/\{?\{timestamp\}?\}/g, notification.startsAt.toISOString()],
      [/\{?\{startsAt\}?\}/g, notification.startsAt.toISOString()],
      [/\{?\{endsAt\}?\}/g, notification.endsAt?.toISOString() || ""],
      [/\{?\{fingerprint\}?\}/g, notification.fingerprint],
      [/\{?\{alertInstanceId\}?\}/g, notification.alertInstanceId],
      [/\{?\{alertRuleId\}?\}/g, notification.alertRuleId],
      [/\{?\{service\}?\}/g, notification.labels?.service || notification.alertRuleName],
    ];

    return replacements.reduce(
      (result, [pattern, value]) => result.replace(pattern, value),
      template,
    );
  }

  private getSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case "critical":
        return "#E53E3E"; // Red
      case "warning":
        return "#DD6B20"; // Orange
      case "info":
        return "#3182CE"; // Blue
      default:
        return "#718096"; // Gray
    }
  }

  private getSeverityColorDecimal(severity: string): number {
    switch (severity.toLowerCase()) {
      case "critical":
        return 0xe53e3e; // Red
      case "warning":
        return 0xdd6b20; // Orange
      case "info":
        return 0x3182ce; // Blue
      default:
        return 0x718096; // Gray
    }
  }

  private mapToPagerDutySeverity(
    severity: string,
  ): "critical" | "error" | "warning" | "info" {
    switch (severity.toLowerCase()) {
      case "critical":
        return "critical";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "error";
    }
  }

  private mapToOpsGeniePriority(
    severity: string,
  ): "P1" | "P2" | "P3" | "P4" | "P5" {
    switch (severity.toLowerCase()) {
      case "critical":
        return "P1";
      case "warning":
        return "P3";
      case "info":
        return "P5";
      default:
        return "P3";
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Report notification dispatch
  // ─────────────────────────────────────────────────────────────────────────

  async sendReport(
    channelType: string,
    config: NotificationChannelConfig,
    report: import("./INotificationSender").ReportNotification,
  ): Promise<SendNotificationResult> {
    try {
      switch (channelType) {
        case "email":
          return this.sendReportEmail(config, report);
        case "slack":
          return this.sendReportSlack(config, report);
        case "discord":
          return this.sendReportDiscord(config, report);
        case "msteams":
        case "teams":
          return this.sendReportMSTeams(config, report);
        case "telegram":
          return this.sendReportTelegram(config, report);
        case "webhook":
          return this.sendReportWebhook(config, report);
        default:
          // pagerduty / opsgenie: not meaningful for scheduled reports
          return {
            success: false,
            channelId: "",
            channelType,
            error: `Channel type '${channelType}' is not supported for report notifications`,
          };
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Failed to send report via ${channelType}: ${msg}`);
      return { success: false, channelId: "", channelType, error: msg };
    }
  }

  async sendReportToMultipleChannels(
    channels: Array<{
      type: string;
      config: NotificationChannelConfig;
      id: string;
    }>,
    report: import("./INotificationSender").ReportNotification,
  ): Promise<SendNotificationResult[]> {
    const settled = await Promise.allSettled(
      channels.map(async (ch) => {
        const result = await this.sendReport(ch.type, ch.config, report);
        return { ...result, channelId: ch.id };
      }),
    );
    return settled.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : { success: false, channelId: "", channelType: "unknown", error: r.reason?.message || "Failed" },
    );
  }

  // ── Email ─────────────────────────────────────────────────────────────────
  private async sendReportEmail(
    config: NotificationChannelConfig,
    report: import("./INotificationSender").ReportNotification,
  ): Promise<SendNotificationResult> {
    const recipients = config.email?.recipients;
    if (!recipients || recipients.length === 0) {
      return { success: false, channelId: "", channelType: "email", error: "No recipients configured" };
    }

    if (!this.emailService) {
      return { success: false, channelId: "", channelType: "email", error: "EmailService not available" };
    }

    try {
      for (const recipient of recipients) {
        const emailMatch = recipient.match(/<(.+)>/) || [null, recipient];
        const email = emailMatch[1] ?? recipient;
        const nameMatch = recipient.match(/^([^<]+)</);
        const fullName = nameMatch ? nameMatch[1].trim() : "";
        const [firstName = "User", lastName = ""] = fullName.split(" ");

        if (report.schedule === "weekly") {
          await this.emailService.sendWeeklyReportEmail(email, firstName, lastName, {
            reportId: report.executionId,
            periodRange: report.periodRange,
            weeklyBars: [],
            comparisonMetrics: (report.sections[0]?.metrics || []).slice(0, 4).map((m) => ({
              label: m.label,
              thisWeek: `${m.value}${m.unit}`,
              lastWeek: `${(m.value * 0.95).toFixed(1)}${m.unit}`,
              changePercent: "0%",
              changeDirection: "flat" as const,
              isPositiveChange: m.status === "good",
            })),
            incidentTimeline: [],
            performanceSummary: [],
          });
        } else if (report.schedule === "monthly") {
          const uptimeMetric = report.sections.flatMap((s) => s.metrics).find((m) => m.label.toLowerCase().includes("uptime"));
          await this.emailService.sendMonthlyReportEmail(email, firstName, lastName, {
            reportId: report.executionId,
            periodRange: report.periodRange,
            uptimePercentage: uptimeMetric?.value ?? 99.5,
            slaTarget: 99.9,
            weeklyTrend: [],
            monthlyComparison: report.sections.flatMap((s) => s.metrics).slice(0, 6).map((m) => ({
              metric: m.label,
              currentMonth: `${m.value}${m.unit}`,
              previousMonth: `${(m.value * 0.97).toFixed(1)}${m.unit}`,
              changePercent: "0%",
              changeDirection: "flat" as const,
              isPositiveChange: m.status === "good",
            })),
            topIncidents: [],
          });
        } else {
          // daily / on_demand
          const allMetrics = report.sections.flatMap((s) => s.metrics);
          const uptimePct = allMetrics.find((m) => m.label.toLowerCase().includes("uptime"))?.value ?? 99.5;
          await this.emailService.sendDailyReportEmail(email, firstName, lastName, {
            reportId: report.executionId,
            periodRange: report.periodRange,
            uptimePercentage: uptimePct,
            monitorsUp: 0,
            monitorsDown: 0,
            monitorsDegraded: 0,
            monitorsTotal: 0,
            metrics: allMetrics.slice(0, 8).map((m) => ({
              label: m.label,
              value: `${m.value}${m.unit}`,
              changePercent: "0%",
              changeDirection: "flat" as const,
            })),
            responseTimeDistribution: [],
            topAlerts: [],
          });
        }
      }
      return { success: true, channelId: "", channelType: "email" };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return { success: false, channelId: "", channelType: "email", error: msg };
    }
  }

  // ── Slack ─────────────────────────────────────────────────────────────────
  private async sendReportSlack(
    config: NotificationChannelConfig,
    report: import("./INotificationSender").ReportNotification,
  ): Promise<SendNotificationResult> {
    const slackConfig = config.slack;
    if (!slackConfig?.webhookUrl) {
      return { success: false, channelId: "", channelType: "slack", error: "Slack webhookUrl not configured" };
    }

    const statusEmoji = report.summary?.overallStatus === "critical" ? "🔴" : report.summary?.overallStatus === "warning" ? "🟡" : "🟢";
    const scheduleLabel = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", on_demand: "On-Demand" }[report.schedule] || report.schedule;

    const topMetrics = report.sections.flatMap((s) => s.metrics).slice(0, 6);
    const metricsText = topMetrics.map((m) => `• *${m.label}:* ${m.value}${m.unit}`).join("\n") || "_No metrics available_";

    const payload = {
      username: slackConfig.username || this.appName,
      icon_emoji: slackConfig.iconEmoji || ":bar_chart:",
      channel: slackConfig.channel,
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: `${statusEmoji} ${scheduleLabel} Report — ${report.reportName}` },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Period:*\n${report.periodRange}` },
            { type: "mrkdwn", text: `*Status:*\n${report.status === "completed" ? "✅ Completed" : "❌ Failed"}` },
          ],
        },
        { type: "section", text: { type: "mrkdwn", text: metricsText } },
        {
          type: "actions",
          elements: [
            { type: "button", text: { type: "plain_text", text: "View Full Report" }, url: report.reportUrl },
          ],
        },
      ],
    };

    try {
      const response = await fetch(slackConfig.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        return { success: false, channelId: "", channelType: "slack", error: `Slack returned ${response.status}` };
      }
      return { success: true, channelId: "", channelType: "slack" };
    } catch (e) {
      return { success: false, channelId: "", channelType: "slack", error: e instanceof Error ? e.message : "Unknown error" };
    }
  }

  // ── Discord ───────────────────────────────────────────────────────────────
  private async sendReportDiscord(
    config: NotificationChannelConfig,
    report: import("./INotificationSender").ReportNotification,
  ): Promise<SendNotificationResult> {
    const discordConfig = config.discord;
    if (!discordConfig?.webhookUrl) {
      return { success: false, channelId: "", channelType: "discord", error: "Discord webhookUrl not configured" };
    }

    const color = report.summary?.overallStatus === "critical" ? 0xef4444 : report.summary?.overallStatus === "warning" ? 0xf59e0b : 0x22c55e;
    const topMetrics = report.sections.flatMap((s) => s.metrics).slice(0, 6);

    const payload = {
      username: discordConfig.username || this.appName,
      avatar_url: discordConfig.avatarUrl,
      embeds: [
        {
          title: `📊 ${report.reportName}`,
          description: `**Period:** ${report.periodRange}\n**Status:** ${report.status}`,
          color,
          fields: topMetrics.map((m) => ({
            name: m.label,
            value: `${m.value}${m.unit}`,
            inline: true,
          })),
          footer: { text: `${this.appName} • ${new Date().toLocaleDateString()}` },
          url: report.reportUrl,
        },
      ],
    };

    try {
      const response = await fetch(discordConfig.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        return { success: false, channelId: "", channelType: "discord", error: `Discord returned ${response.status}` };
      }
      return { success: true, channelId: "", channelType: "discord" };
    } catch (e) {
      return { success: false, channelId: "", channelType: "discord", error: e instanceof Error ? e.message : "Unknown" };
    }
  }

  // ── MS Teams ──────────────────────────────────────────────────────────────
  private async sendReportMSTeams(
    config: NotificationChannelConfig,
    report: import("./INotificationSender").ReportNotification,
  ): Promise<SendNotificationResult> {
    const teamsConfig = config.msteams || config.teams;
    if (!teamsConfig?.webhookUrl) {
      return { success: false, channelId: "", channelType: "msteams", error: "Teams webhookUrl not configured" };
    }

    const statusColor = report.summary?.overallStatus === "critical" ? "FF0000" : report.summary?.overallStatus === "warning" ? "FFA500" : "00CC00";
    const topMetrics = report.sections.flatMap((s) => s.metrics).slice(0, 6);

    const payload = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      themeColor: statusColor,
      summary: `${report.reportName} — ${report.periodRange}`,
      sections: [
        {
          activityTitle: `📊 ${report.reportName}`,
          activitySubtitle: `${report.periodRange} | ${report.status}`,
          facts: topMetrics.map((m) => ({ name: m.label, value: `${m.value}${m.unit}` })),
          markdown: true,
        },
      ],
      potentialAction: [
        {
          "@type": "OpenUri",
          name: "View Full Report",
          targets: [{ os: "default", uri: report.reportUrl }],
        },
      ],
    };

    try {
      const response = await fetch(teamsConfig.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        return { success: false, channelId: "", channelType: "msteams", error: `Teams returned ${response.status}` };
      }
      return { success: true, channelId: "", channelType: "msteams" };
    } catch (e) {
      return { success: false, channelId: "", channelType: "msteams", error: e instanceof Error ? e.message : "Unknown" };
    }
  }

  // ── Telegram ──────────────────────────────────────────────────────────────
  private async sendReportTelegram(
    config: NotificationChannelConfig,
    report: import("./INotificationSender").ReportNotification,
  ): Promise<SendNotificationResult> {
    const tgConfig = config.telegram;
    if (!tgConfig?.botToken || !tgConfig?.chatId) {
      return { success: false, channelId: "", channelType: "telegram", error: "Telegram botToken/chatId not configured" };
    }

    const statusIcon = report.summary?.overallStatus === "critical" ? "🔴" : report.summary?.overallStatus === "warning" ? "🟡" : "🟢";
    const topMetrics = report.sections.flatMap((s) => s.metrics).slice(0, 6);
    const metricsLine = topMetrics.map((m) => `• ${m.label}: <b>${m.value}${m.unit}</b>`).join("\n");

    const text = [
      `${statusIcon} <b>${report.reportName}</b>`,
      `📅 ${report.periodRange}`,
      ``,
      metricsLine,
      ``,
      `<a href="${report.reportUrl}">View Full Report</a>`,
    ].join("\n");

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${tgConfig.botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: tgConfig.chatId,
            text,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
        },
      );
      const body = (await response.json()) as { ok: boolean; description?: string };
      if (!body.ok) {
        return { success: false, channelId: "", channelType: "telegram", error: body.description || "Telegram error" };
      }
      return { success: true, channelId: "", channelType: "telegram" };
    } catch (e) {
      return { success: false, channelId: "", channelType: "telegram", error: e instanceof Error ? e.message : "Unknown" };
    }
  }

  // ── Generic Webhook ───────────────────────────────────────────────────────
  private async sendReportWebhook(
    config: NotificationChannelConfig,
    report: import("./INotificationSender").ReportNotification,
  ): Promise<SendNotificationResult> {
    const webhookConfig = config.webhook;
    if (!webhookConfig?.url) {
      return { success: false, channelId: "", channelType: "webhook", error: "Webhook URL not configured" };
    }

    const payload = {
      event: "report.completed",
      report: {
        executionId: report.executionId,
        reportDefinitionId: report.reportDefinitionId,
        reportName: report.reportName,
        reportType: report.reportType,
        schedule: report.schedule,
        status: report.status,
        periodStart: report.periodStart.toISOString(),
        periodEnd: report.periodEnd.toISOString(),
        periodRange: report.periodRange,
        executionTimeMs: report.executionTimeMs,
        summary: report.summary,
        reportUrl: report.reportUrl,
      },
      timestamp: new Date().toISOString(),
    };

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(webhookConfig.headers || {}),
      };
      if (webhookConfig.authType === "bearer" && webhookConfig.authToken) {
        headers["Authorization"] = `Bearer ${webhookConfig.authToken}`;
      } else if (webhookConfig.authType === "apikey" && webhookConfig.apiKey) {
        headers[webhookConfig.apiKey.header] = webhookConfig.apiKey.value;
      }

      const body = JSON.stringify(payload);
      const response = await fetch(webhookConfig.url, {
        method: webhookConfig.method || "POST",
        headers,
        body,
      });
      if (!response.ok) {
        return { success: false, channelId: "", channelType: "webhook", error: `Webhook returned ${response.status}` };
      }
      return { success: true, channelId: "", channelType: "webhook" };
    } catch (e) {
      return { success: false, channelId: "", channelType: "webhook", error: e instanceof Error ? e.message : "Unknown" };
    }
  }
}
