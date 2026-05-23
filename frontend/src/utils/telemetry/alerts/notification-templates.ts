/**
 * Notification Templates for different platforms
 * Based on uptime-kuma implementation patterns
 */

import type { NotificationChannelType, AlertSeverity } from "@/types";
import { brandDefaults } from "@/config";

// Alert state constants
export const AlertState = {
  FIRING: "firing",
  RESOLVED: "resolved",
  PENDING: "pending",
} as const;

export type AlertStateType = (typeof AlertState)[keyof typeof AlertState];

// Theme colors for different states
export const ThemeColors = {
  critical: "dc2626", // Red
  warning: "f59e0b", // Amber
  info: "3b82f6", // Blue
  resolved: "22c55e", // Green
  pending: "6b7280", // Gray
} as const;

// Alert data interface for notification
export interface AlertNotificationData {
  alertName: string;
  alertId?: string;
  severity: AlertSeverity;
  status: AlertStateType;
  message: string;
  description?: string;
  value?: number;
  threshold?: number;
  metric?: string;
  service?: string;
  environment?: string;
  region?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  startsAt?: string;
  endsAt?: string;
  duration?: string;
  url?: string;
}

/**
 * Get theme color based on alert severity and status
 */
export function getThemeColor(
  severity: AlertSeverity,
  status: AlertStateType,
): string {
  if (status === AlertState.RESOLVED) {
    return ThemeColors.resolved;
  }
  if (status === AlertState.PENDING) {
    return ThemeColors.pending;
  }
  return ThemeColors[severity] || ThemeColors.warning;
}

/**
 * Get status emoji based on alert status
 */
export function getStatusEmoji(status: AlertStateType): string {
  switch (status) {
    case AlertState.FIRING:
      return "🔴";
    case AlertState.RESOLVED:
      return "✅";
    case AlertState.PENDING:
      return "🟡";
    default:
      return "⚪";
  }
}

/**
 * Get severity emoji
 */
export function getSeverityEmoji(severity: AlertSeverity): string {
  switch (severity) {
    case "critical":
      return "🚨";
    case "warning":
      return "⚠️";
    case "info":
      return "ℹ️";
    default:
      return "📢";
  }
}

/**
 * Format timestamp to ISO string
 */
export function formatTimestamp(date?: Date | string | number): string {
  if (!date) return new Date().toISOString();
  return new Date(date).toISOString();
}

// ============================================
// EMAIL TEMPLATE
// ============================================
export interface EmailNotificationPayload {
  subject: string;
  html: string;
  text: string;
}

/**
 * Get alert state configuration for email styling
 */
function getAlertStateConfig(
  severity: AlertSeverity,
  status: AlertStateType,
): {
  state: string;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  if (status === AlertState.RESOLVED) {
    return {
      state: "RESOLVED",
      color: "#22c55e",
      bgColor: "#e8f5e9",
      borderColor: "#22c55e",
    };
  }
  if (status === AlertState.PENDING) {
    return {
      state: "PENDING",
      color: "#f59e0b",
      bgColor: "#fff8e1",
      borderColor: "#f59e0b",
    };
  }

  // Firing state - color based on severity
  switch (severity) {
    case "critical":
      return {
        state: "CRITICAL",
        color: "#dc2626",
        bgColor: "#ffebee",
        borderColor: "#dc2626",
      };
    case "warning":
      return {
        state: "WARNING",
        color: "#f59e0b",
        bgColor: "#fff8e1",
        borderColor: "#f59e0b",
      };
    case "info":
    default:
      return {
        state: "INFO",
        color: "#3b82f6",
        bgColor: "#e3f2fd",
        borderColor: "#3b82f6",
      };
  }
}

/**
 * Build message template key-value pairs for email table
 */
function buildEmailMessageTemplate(
  data: AlertNotificationData,
): Record<string, string | null> {
  const statusEmoji = getStatusEmoji(data.status);
  const severityEmoji = getSeverityEmoji(data.severity);

  const template: Record<string, string | null> = {
    "🚨 Alert": `${data.alertName} is ${data.status.toUpperCase()}`,
    "📊 Service": data.service || data.alertName,
    "📊 Status": `${statusEmoji} ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`,
    [`${severityEmoji} Severity`]: data.severity.toUpperCase(),
  };

  if (data.metric) {
    template["📈 Metric"] = data.metric;
  }
  if (data.value !== undefined) {
    template["📊 Current Value"] = String(data.value);
  }
  if (data.threshold !== undefined) {
    template["📉 Threshold"] = String(data.threshold);
  }
  if (data.environment) {
    template["🌍 Environment"] = data.environment;
  }
  if (data.region) {
    template["🌐 Region"] = data.region;
  }
  if (data.startsAt) {
    template["🕐 Started At"] = data.startsAt;
  }
  if (data.duration) {
    template["⏱️ Duration"] = data.duration;
  }

  template["💬 Message"] = data.message;

  if (data.url) {
    template["🔗 Dashboard"] = data.url;
  }

  return template;
}

export function formatEmailNotification(
  data: AlertNotificationData,
): EmailNotificationPayload {
  const statusEmoji = getStatusEmoji(data.status);
  const severityEmoji = getSeverityEmoji(data.severity);
  const config = getAlertStateConfig(data.severity, data.status);
  const messageTemplate = buildEmailMessageTemplate(data);

  const subject = `${statusEmoji} [${data.severity.toUpperCase()}] ${data.alertName} - ${data.status.toUpperCase()}`;

  // Build table rows from message template
  const tableRows = Object.entries(messageTemplate)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(
      ([key, value]) => `
                <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #424242; width: 180px;">
                        ${key}
                    </td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; color: #616161; word-break: break-word;">
                        ${escapeHtml(String(value))}
                    </td>
                </tr>
            `,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brandDefaults.companyName} Alert Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; max-width: 100%;">

                    <!-- Header with Logo and Title -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px 20px; text-align: center;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <div style="width: 60px; height: 60px; margin-bottom: 15px; border-radius: 12px; background: rgba(255,255,255,0.2); display: inline-flex; align-items: center; justify-content: center;">
                                            <span style="font-size: 32px;">${severityEmoji}</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                            ${brandDefaults.companyName}
                                        </h1>
                                        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">
                                            Alerting System
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Alert Status Banner -->
                    <tr>
                        <td style="padding: 0;">
                            <div style="background-color: ${config.bgColor}; border-left: 6px solid ${config.borderColor}; padding: 20px 24px;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td>
                                            <span style="display: inline-block; background-color: ${config.color}; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                                                ${config.state}
                                            </span>
                                            <span style="margin-left: 12px; font-size: 16px; font-weight: 600; color: #424242;">
                                                ${data.alertName}
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>

                    <!-- Alert Information Table -->
                    <tr>
                        <td style="padding: 30px 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">
                                ${tableRows}
                            </table>
                        </td>
                    </tr>

                    ${
                      data.url
                        ? `
                    <!-- Action Button -->
                    <tr>
                        <td style="padding: 0 24px 24px 24px; text-align: center;">
                            <a href="${escapeHtml(data.url)}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                                View in Dashboard
                            </a>
                        </td>
                    </tr>
                    `
                        : ""
                    }

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f9f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0; color: #9e9e9e; font-size: 13px; line-height: 1.6;">
                                This is an automated notification from <strong>${brandDefaults.companyName}</strong><br>
                                Monitoring your services 24/7
                            </p>
                            <p style="margin: 15px 0 0 0; color: #bdbdbd; font-size: 12px;">
                                &copy; ${new Date().getFullYear()} ${brandDefaults.companyName}. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`.trim();

  // Plain text version
  const text =
    Object.entries(messageTemplate)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n") +
    `

--
This is an automated notification from ${brandDefaults.companyName}
© ${new Date().getFullYear()} ${brandDefaults.companyName}. All rights reserved.`;

  return { subject, html, text };
}

// ============================================
// SLACK TEMPLATE
// ============================================
export interface SlackNotificationPayload {
  text: string;
  attachments: Array<{
    color: string;
    title: string;
    title_link?: string;
    text?: string;
    fields: Array<{
      title: string;
      value: string;
      short: boolean;
    }>;
    footer: string;
    ts: number;
  }>;
}

export function formatSlackNotification(
  data: AlertNotificationData,
): SlackNotificationPayload {
  const statusEmoji = getStatusEmoji(data.status);
  const severityEmoji = getSeverityEmoji(data.severity);
  const color = `#${getThemeColor(data.severity, data.status)}`;

  const fields: Array<{ title: string; value: string; short: boolean }> = [
    {
      title: "Status",
      value: `${statusEmoji} ${data.status.toUpperCase()}`,
      short: true,
    },
    {
      title: "Severity",
      value: `${severityEmoji} ${data.severity.toUpperCase()}`,
      short: true,
    },
  ];

  if (data.service) {
    fields.push({ title: "Service", value: data.service, short: true });
  }
  if (data.environment) {
    fields.push({ title: "Environment", value: data.environment, short: true });
  }
  if (data.metric) {
    fields.push({ title: "Metric", value: data.metric, short: true });
  }
  if (data.value !== undefined) {
    fields.push({
      title: "Value",
      value: `${data.value}${data.threshold !== undefined ? ` / ${data.threshold}` : ""}`,
      short: true,
    });
  }
  if (data.startsAt) {
    fields.push({ title: "Started At", value: data.startsAt, short: true });
  }
  if (data.duration) {
    fields.push({ title: "Duration", value: data.duration, short: true });
  }

  return {
    text: `${severityEmoji} *Alert: ${data.alertName}*`,
    attachments: [
      {
        color,
        title: data.alertName,
        title_link: data.url,
        text: data.message,
        fields,
        footer: brandDefaults.alertingLabel,
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

// ============================================
// DISCORD TEMPLATE (Webhook Embeds)
// ============================================
export interface DiscordNotificationPayload {
  content: string;
  username?: string;
  avatar_url?: string;
  embeds: Array<{
    title: string;
    description?: string;
    url?: string;
    color: number;
    fields: Array<{
      name: string;
      value: string;
      inline: boolean;
    }>;
    footer: {
      text: string;
    };
    timestamp: string;
  }>;
}

export function formatDiscordNotification(
  data: AlertNotificationData,
): DiscordNotificationPayload {
  const statusEmoji = getStatusEmoji(data.status);
  const severityEmoji = getSeverityEmoji(data.severity);
  const colorHex = getThemeColor(data.severity, data.status);
  const color = parseInt(colorHex, 16);

  const fields: Array<{ name: string; value: string; inline: boolean }> = [
    {
      name: "Status",
      value: `${statusEmoji} ${data.status.toUpperCase()}`,
      inline: true,
    },
    {
      name: "Severity",
      value: `${severityEmoji} ${data.severity.toUpperCase()}`,
      inline: true,
    },
  ];

  if (data.service) {
    fields.push({ name: "Service", value: data.service, inline: true });
  }
  if (data.environment) {
    fields.push({ name: "Environment", value: data.environment, inline: true });
  }
  if (data.metric) {
    fields.push({ name: "Metric", value: data.metric, inline: true });
  }
  if (data.value !== undefined) {
    fields.push({
      name: "Value",
      value: `${data.value}${data.threshold !== undefined ? ` / ${data.threshold}` : ""}`,
      inline: true,
    });
  }
  if (data.startsAt) {
    fields.push({ name: "Started At", value: data.startsAt, inline: true });
  }
  if (data.duration) {
    fields.push({ name: "Duration", value: data.duration, inline: true });
  }

  fields.push({ name: "Message", value: data.message, inline: false });

  return {
    content: `${severityEmoji} **Alert: ${data.alertName}** - ${data.status.toUpperCase()}`,
    embeds: [
      {
        title: `${severityEmoji} ${data.alertName}`,
        description: data.description || data.message,
        url: data.url,
        color,
        fields,
        footer: {
          text: brandDefaults.alertingLabel,
        },
        timestamp: data.startsAt || new Date().toISOString(),
      },
    ],
  };
}

// ============================================
// MS TEAMS TEMPLATE (Adaptive Card)
// ============================================
export interface MSTeamsNotificationPayload {
  "@type": string;
  "@context": string;
  themeColor: string;
  summary: string;
  sections: Array<{
    activityTitle: string;
    activitySubtitle?: string;
    activityImage?: string;
    facts: Array<{ name: string; value: string }>;
    markdown: boolean;
  }>;
  potentialAction?: Array<{
    "@type": string;
    name: string;
    targets: Array<{ os: string; uri: string }>;
  }>;
}

export function formatMSTeamsNotification(
  data: AlertNotificationData,
): MSTeamsNotificationPayload {
  const statusEmoji = getStatusEmoji(data.status);
  const severityEmoji = getSeverityEmoji(data.severity);
  const color = getThemeColor(data.severity, data.status);

  const facts: Array<{ name: string; value: string }> = [
    { name: "Status", value: `${statusEmoji} ${data.status.toUpperCase()}` },
    {
      name: "Severity",
      value: `${severityEmoji} ${data.severity.toUpperCase()}`,
    },
    { name: "Message", value: data.message },
  ];

  if (data.service) {
    facts.push({ name: "Service", value: data.service });
  }
  if (data.environment) {
    facts.push({ name: "Environment", value: data.environment });
  }
  if (data.metric) {
    facts.push({ name: "Metric", value: data.metric });
  }
  if (data.value !== undefined) {
    facts.push({
      name: "Value",
      value: `${data.value}${data.threshold !== undefined ? ` (Threshold: ${data.threshold})` : ""}`,
    });
  }
  if (data.startsAt) {
    facts.push({ name: "Started At", value: data.startsAt });
  }
  if (data.duration) {
    facts.push({ name: "Duration", value: data.duration });
  }

  const payload: MSTeamsNotificationPayload = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor: color,
    summary: `${severityEmoji} ${data.alertName} - ${data.status.toUpperCase()}`,
    sections: [
      {
        activityTitle: `${severityEmoji} ${data.alertName}`,
        activitySubtitle: `Alert ${data.status === AlertState.FIRING ? "triggered" : data.status}`,
        facts,
        markdown: true,
      },
    ],
  };

  if (data.url) {
    payload.potentialAction = [
      {
        "@type": "OpenUri",
        name: "View in Dashboard",
        targets: [{ os: "default", uri: data.url }],
      },
    ];
  }

  return payload;
}

// ============================================
// ZOOM TEMPLATE (format=fields style)
// ============================================
export interface ZoomNotificationPayload {
  [key: string]: string;
}

export function formatZoomNotification(
  data: AlertNotificationData,
): ZoomNotificationPayload {
  const statusEmoji = getStatusEmoji(data.status);
  const severityEmoji = getSeverityEmoji(data.severity);
  const color = getThemeColor(data.severity, data.status);

  // Build flat key-value object (uptime-kuma style with ?format=fields)
  const payload: ZoomNotificationPayload = {};

  // State field first (for color parsing)
  payload["State"] = data.status.toUpperCase();

  // Alert header
  payload["🚨 Alert"] = `${data.alertName} is ${data.status.toUpperCase()}`;

  // Core fields
  payload["📊 Service"] = data.service || data.alertName;
  payload["📊 Status"] = `${statusEmoji} ${data.status.toUpperCase()}`;
  payload[`${severityEmoji} Severity`] = data.severity.toUpperCase();

  // Optional fields
  if (data.metric) {
    payload["📈 Metric"] = data.metric;
  }
  if (data.value !== undefined) {
    payload["📊 Value"] = String(data.value);
  }
  if (data.threshold !== undefined) {
    payload["📉 Threshold"] = String(data.threshold);
  }
  if (data.environment) {
    payload["🌍 Environment"] = data.environment;
  }
  if (data.region) {
    payload["🌍 Region"] = data.region;
  }
  if (data.startsAt) {
    payload["🕐 Time"] = data.startsAt;
  }
  if (data.duration) {
    payload["⏱️ Duration"] = data.duration;
  }

  // Message
  payload["💬 Message"] = data.message;

  // Link
  if (data.url) {
    payload["🔗 Dashboard"] = data.url;
  }

  // Color MUST be last for proper parsing
  payload["color"] = color;

  return payload;
}

// ============================================
// TELEGRAM TEMPLATE (HTML/Markdown)
// ============================================
export interface TelegramNotificationPayload {
  text: string;
  parse_mode: "HTML" | "Markdown" | "MarkdownV2";
}

export function formatTelegramNotification(
  data: AlertNotificationData,
  parseMode: "HTML" | "Markdown" | "MarkdownV2" = "HTML",
): TelegramNotificationPayload {
  const statusEmoji = getStatusEmoji(data.status);
  const severityEmoji = getSeverityEmoji(data.severity);

  let text: string;

  if (parseMode === "HTML") {
    text = `
${severityEmoji} <b>Alert: ${escapeHtml(data.alertName)}</b>

<b>Status:</b> ${statusEmoji} ${data.status.toUpperCase()}
<b>Severity:</b> ${severityEmoji} ${data.severity.toUpperCase()}
<b>Message:</b> ${escapeHtml(data.message)}
${data.service ? `<b>Service:</b> ${escapeHtml(data.service)}` : ""}
${data.environment ? `<b>Environment:</b> ${escapeHtml(data.environment)}` : ""}
${data.metric ? `<b>Metric:</b> ${escapeHtml(data.metric)}` : ""}
${data.value !== undefined ? `<b>Value:</b> ${data.value}${data.threshold !== undefined ? ` (Threshold: ${data.threshold})` : ""}` : ""}
${data.startsAt ? `<b>Started:</b> ${escapeHtml(data.startsAt)}` : ""}
${data.duration ? `<b>Duration:</b> ${escapeHtml(data.duration)}` : ""}
${data.url ? `\n<a href="${escapeHtml(data.url)}">View in Dashboard</a>` : ""}

<i>${brandDefaults.alertingLabel}</i>
`.trim();
  } else {
    // Markdown format
    text = `
${severityEmoji} *Alert: ${escapeMarkdown(data.alertName)}*

*Status:* ${statusEmoji} ${data.status.toUpperCase()}
*Severity:* ${severityEmoji} ${data.severity.toUpperCase()}
*Message:* ${escapeMarkdown(data.message)}
${data.service ? `*Service:* ${escapeMarkdown(data.service)}` : ""}
${data.environment ? `*Environment:* ${escapeMarkdown(data.environment)}` : ""}
${data.metric ? `*Metric:* ${escapeMarkdown(data.metric)}` : ""}
${data.value !== undefined ? `*Value:* ${data.value}${data.threshold !== undefined ? ` (Threshold: ${data.threshold})` : ""}` : ""}
${data.startsAt ? `*Started:* ${escapeMarkdown(data.startsAt)}` : ""}
${data.duration ? `*Duration:* ${escapeMarkdown(data.duration)}` : ""}
${data.url ? `\n[View in Dashboard](${data.url})` : ""}

_${brandDefaults.alertingLabel}_
`.trim();
  }

  return { text, parse_mode: parseMode };
}

// ============================================
// OPSGENIE TEMPLATE
// ============================================
export interface OpsGenieNotificationPayload {
  message: string;
  alias?: string;
  description?: string;
  responders?: Array<{ type: string; id?: string; name?: string }>;
  visibleTo?: Array<{ type: string; id?: string; name?: string }>;
  actions?: string[];
  tags?: string[];
  details?: Record<string, string>;
  entity?: string;
  source?: string;
  priority?: "P1" | "P2" | "P3" | "P4" | "P5";
  note?: string;
}

export function formatOpsGenieNotification(
  data: AlertNotificationData,
  config?: {
    priority?: "P1" | "P2" | "P3" | "P4" | "P5";
    tags?: string[];
    responders?: Array<{ type: string; id?: string; name?: string }>;
  },
): OpsGenieNotificationPayload {
  const severityEmoji = getSeverityEmoji(data.severity);

  // Map severity to priority if not specified
  const defaultPriority = (): "P1" | "P2" | "P3" | "P4" | "P5" => {
    switch (data.severity) {
      case "critical":
        return "P1";
      case "warning":
        return "P2";
      case "info":
        return "P4";
      default:
        return "P3";
    }
  };

  const details: Record<string, string> = {
    status: data.status,
    severity: data.severity,
  };

  if (data.metric) details["metric"] = data.metric;
  if (data.value !== undefined) details["value"] = String(data.value);
  if (data.threshold !== undefined)
    details["threshold"] = String(data.threshold);
  if (data.service) details["service"] = data.service;
  if (data.environment) details["environment"] = data.environment;
  if (data.startsAt) details["startsAt"] = data.startsAt;
  if (data.duration) details["duration"] = data.duration;

  // Add labels to details
  if (data.labels) {
    Object.entries(data.labels).forEach(([key, value]) => {
      details[`label_${key}`] = value;
    });
  }

  const payload: OpsGenieNotificationPayload = {
    message: `${severityEmoji} ${data.alertName} - ${data.status.toUpperCase()}`,
    alias: data.alertId || `telemetryflow-${data.alertName}-${Date.now()}`,
    description:
      data.message + (data.description ? `\n\n${data.description}` : ""),
    priority: config?.priority || defaultPriority(),
    tags: [...(config?.tags || []), data.severity, data.status],
    details,
    entity: data.service || data.alertName,
    source: brandDefaults.companyName,
  };

  if (config?.responders) {
    payload.responders = config.responders;
  }

  if (data.url) {
    payload.note = `View in Dashboard: ${data.url}`;
  }

  return payload;
}

// ============================================
// PAGERDUTY TEMPLATE (Events API v2)
// ============================================
export interface PagerDutyNotificationPayload {
  routing_key: string;
  event_action: "trigger" | "acknowledge" | "resolve";
  dedup_key?: string;
  payload: {
    summary: string;
    source: string;
    severity: "critical" | "error" | "warning" | "info";
    timestamp?: string;
    component?: string;
    group?: string;
    class?: string;
    custom_details?: Record<string, string | number>;
  };
  links?: Array<{ href: string; text: string }>;
  images?: Array<{ src: string; href?: string; alt?: string }>;
}

export function formatPagerDutyNotification(
  data: AlertNotificationData,
  routingKey: string,
  config?: {
    dedupKey?: string;
    severity?: "critical" | "error" | "warning" | "info";
  },
): PagerDutyNotificationPayload {
  const severityEmoji = getSeverityEmoji(data.severity);

  // Map alert severity to PagerDuty severity
  const pdSeverity = (): "critical" | "error" | "warning" | "info" => {
    if (config?.severity) return config.severity;
    switch (data.severity) {
      case "critical":
        return "critical";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "error";
    }
  };

  // Determine event action based on status
  const eventAction = (): "trigger" | "acknowledge" | "resolve" => {
    switch (data.status) {
      case AlertState.RESOLVED:
        return "resolve";
      case AlertState.PENDING:
        return "acknowledge";
      default:
        return "trigger";
    }
  };

  const customDetails: Record<string, string | number> = {
    alert_name: data.alertName,
    status: data.status,
    severity: data.severity,
    message: data.message,
  };

  if (data.metric) customDetails["metric"] = data.metric;
  if (data.value !== undefined) customDetails["value"] = data.value;
  if (data.threshold !== undefined) customDetails["threshold"] = data.threshold;
  if (data.environment) customDetails["environment"] = data.environment;
  if (data.startsAt) customDetails["started_at"] = data.startsAt;
  if (data.duration) customDetails["duration"] = data.duration;

  // Add labels
  if (data.labels) {
    Object.entries(data.labels).forEach(([key, value]) => {
      customDetails[key] = value;
    });
  }

  const payload: PagerDutyNotificationPayload = {
    routing_key: routingKey,
    event_action: eventAction(),
    dedup_key:
      config?.dedupKey || data.alertId || `telemetryflow-${data.alertName}`,
    payload: {
      summary: `${severityEmoji} ${data.alertName}: ${data.message}`,
      source: brandDefaults.companyName,
      severity: pdSeverity(),
      timestamp: data.startsAt || new Date().toISOString(),
      component: data.service,
      group: data.environment,
      class: data.metric,
      custom_details: customDetails,
    },
  };

  if (data.url) {
    payload.links = [
      { href: data.url, text: `View in ${brandDefaults.companyName} Dashboard` },
    ];
  }

  return payload;
}

// ============================================
// WEBHOOK TEMPLATE (Generic JSON)
// ============================================
export interface WebhookNotificationPayload {
  alertName: string;
  alertId?: string;
  status: string;
  severity: string;
  message: string;
  description?: string;
  metric?: string;
  value?: number;
  threshold?: number;
  service?: string;
  environment?: string;
  region?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  startsAt?: string;
  endsAt?: string;
  duration?: string;
  url?: string;
  timestamp: string;
  source: string;
}

export function formatWebhookNotification(
  data: AlertNotificationData,
): WebhookNotificationPayload {
  return {
    alertName: data.alertName,
    alertId: data.alertId,
    status: data.status,
    severity: data.severity,
    message: data.message,
    description: data.description,
    metric: data.metric,
    value: data.value,
    threshold: data.threshold,
    service: data.service,
    environment: data.environment,
    region: data.region,
    labels: data.labels,
    annotations: data.annotations,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    duration: data.duration,
    url: data.url,
    timestamp: new Date().toISOString(),
    source: brandDefaults.companyName,
  };
}

// ============================================
// TEMPLATE FORMATTER BY CHANNEL TYPE
// ============================================
export function formatNotificationByType(
  channelType: NotificationChannelType,
  data: AlertNotificationData,
  config?: Record<string, unknown>,
): unknown {
  switch (channelType) {
    case "email":
      return formatEmailNotification(data);
    case "slack":
      return formatSlackNotification(data);
    case "discord":
      return formatDiscordNotification(data);
    case "msteams":
      return formatMSTeamsNotification(data);
    case "zoom":
      return formatZoomNotification(data);
    case "telegram":
      return formatTelegramNotification(
        data,
        config?.parseMode as "HTML" | "Markdown" | "MarkdownV2",
      );
    case "opsgenie":
      return formatOpsGenieNotification(
        data,
        config as {
          priority?: "P1" | "P2" | "P3" | "P4" | "P5";
          tags?: string[];
        },
      );
    case "pagerduty":
      return formatPagerDutyNotification(
        data,
        config?.routingKey as string,
        config as { dedupKey?: string },
      );
    case "webhook":
      return formatWebhookNotification(data);
    default:
      return formatWebhookNotification(data);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

// ============================================
// PREVIEW TEMPLATE GENERATOR
// ============================================
export function generatePreviewData(): AlertNotificationData {
  return {
    alertName: "High CPU Usage Alert",
    alertId: "alert-123456",
    severity: "critical",
    status: "firing",
    message: "CPU usage has exceeded 90% threshold for more than 5 minutes",
    description:
      "The web-server-01 instance is experiencing high CPU utilization",
    value: 94.5,
    threshold: 90,
    metric: "system.cpu.utilization",
    service: "web-server-01",
    environment: "production",
    region: "us-east-1",
    labels: {
      team: "platform",
      tier: "critical",
    },
    startsAt: new Date().toISOString(),
    duration: "5m 32s",
    url: "https://telemetryflow.telemetryflow.id/alerts/alert-123456",
  };
}

export function getTemplatePreview(
  channelType: NotificationChannelType,
): string {
  const data = generatePreviewData();
  const payload = formatNotificationByType(channelType, data);
  return JSON.stringify(payload, null, 2);
}
