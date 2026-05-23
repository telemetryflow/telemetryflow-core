export const NOTIFICATION_SENDER = Symbol("NOTIFICATION_SENDER");

export interface AlertNotification {
  alertInstanceId: string;
  alertRuleId: string;
  alertRuleName: string;
  severity: string;
  status: "firing" | "resolved";
  title: string;
  description: string;
  currentValue: number;
  threshold: number;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: Date;
  endsAt?: Date;
  organizationId: string;
  fingerprint: string;
}

export interface NotificationChannelConfig {
  // Email configuration
  email?: {
    recipients: string[];
    cc?: string[];
    bcc?: string[];
    subject?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    smtpSecure?: boolean;
    fromName?: string;
    fromEmail?: string;
  };
  // Slack configuration
  slack?: {
    webhookUrl: string;
    channel?: string;
    username?: string;
    iconEmoji?: string;
  };
  // Discord configuration
  discord?: {
    webhookUrl: string;
    username?: string;
    avatarUrl?: string;
    embedColor?: number;
    mentionRoles?: string[];
  };
  // Microsoft Teams configuration
  msteams?: {
    webhookUrl: string;
    title?: string;
  };
  // Zoom configuration
  zoom?: {
    webhookUrl: string;
    authToken?: string;
    botJid?: string;
    headers?: Record<string, string>;
  };
  // Telegram configuration
  telegram?: {
    botToken: string;
    chatId: string;
    parseMode?: "HTML" | "Markdown" | "MarkdownV2";
    disableNotification?: boolean;
  };
  // Webhook configuration
  webhook?: {
    url: string;
    method?: "POST" | "PUT" | "PATCH" | "GET";
    contentType?: "json" | "form" | "text";
    headers?: Record<string, string>;
    authType?: "none" | "basic" | "bearer" | "apikey";
    authToken?: string;
    basicAuth?: {
      username: string;
      password: string;
    };
    apiKey?: {
      header: string;
      value: string;
    };
    signingSecret?: string;
    signingHeader?: string;
    bodyTemplate?: string;
    retryCount?: number;
  };
  // PagerDuty configuration
  pagerduty?: {
    integrationKey: string;
    severity?: "critical" | "error" | "warning" | "info";
  };
  // OpsGenie configuration
  opsgenie?: {
    apiKey: string;
    apiUrl?: string;
    priority?: "P1" | "P2" | "P3" | "P4" | "P5";
  };
  // Legacy teams config (deprecated, use msteams)
  teams?: {
    webhookUrl: string;
  };
}

export interface SendNotificationResult {
  success: boolean;
  channelId: string;
  channelType: string;
  error?: string;
  response?: unknown;
}

/**
 * Report notification payload — passed through the channel dispatch system.
 * Carries enough data for each channel type to format a useful message.
 */
export interface ReportNotification {
  executionId: string;
  reportDefinitionId: string;
  reportName: string;
  reportType: string;
  /** "daily" | "weekly" | "monthly" | "on_demand" */
  schedule: string;
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  /** Human-readable period, e.g. "Apr 1 - Apr 7, 2026" */
  periodRange: string;
  status: "completed" | "failed";
  executionTimeMs: number;
  summary: {
    totalMetrics: number;
    highlightValue: number;
    highlightLabel: string;
    highlightUnit: string;
    overallStatus: "good" | "warning" | "critical";
  } | null;
  /** Key metrics from each section (for channel message bodies) */
  sections: Array<{
    type: string;
    title: string;
    metrics: Array<{ label: string; value: number; unit: string; status?: string }>;
  }>;
  /** Deep-link URL to the execution in the TFO UI */
  reportUrl: string;
}

export interface INotificationSender {
  send(
    channelType: string,
    config: NotificationChannelConfig,
    notification: AlertNotification,
  ): Promise<SendNotificationResult>;

  sendToMultipleChannels(
    channels: Array<{
      type: string;
      config: NotificationChannelConfig;
      id: string;
    }>,
    notification: AlertNotification,
  ): Promise<SendNotificationResult[]>;

  sendReport(
    channelType: string,
    config: NotificationChannelConfig,
    report: ReportNotification,
  ): Promise<SendNotificationResult>;

  sendReportToMultipleChannels(
    channels: Array<{
      type: string;
      config: NotificationChannelConfig;
      id: string;
    }>,
    report: ReportNotification,
  ): Promise<SendNotificationResult[]>;
}
