/**
 * API types for TelemetryFlow-Viz
 */

export interface ApiResponse<T> {
  status: "success" | "error";
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  status: "success" | "error";
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  error?: string;
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface CollectorConfig {
  httpEndpoint: string;
  grpcEndpoint: string;
  wsEndpoint: string;
  streaming: boolean;
  refreshInterval: number;
}

export interface CollectorStatus {
  connected: boolean;
  collectorReachable?: boolean;
  clickhouseAlive?: boolean;
  dataFlowing?: boolean;
  collectorVersion?: string;
  version?: string;
  uptime?: number | string;
  snapshot?: string;
  metrics: {
    received: number;
    processed: number;
    errors: number;
  };
  logs: {
    received: number;
    processed: number;
    errors: number;
  };
  traces: {
    received: number;
    processed: number;
    errors: number;
  };
}

export interface StreamMessage<T = unknown> {
  type: "metric" | "log" | "trace" | "exemplar" | "status";
  timestamp: number;
  data: T;
}

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  query: string;
  condition: AlertCondition;
  duration: string;
  severity: AlertSeverity;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  channelIds?: string[];
  useDefaultChannels?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertCondition {
  operator: "gt" | "gte" | "lt" | "lte" | "eq" | "neq";
  threshold: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  status: AlertStatus;
  severity: AlertSeverity;
  value: number;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: number;
  endsAt?: number;
  updatedAt: number;
}

export type AlertStatus = "firing" | "pending" | "resolved";

export interface ServiceInfo {
  name: string;
  instances: number;
  spanCount: number;
  errorRate: number;
  avgLatency: number;
  lastSeen: number;
}

// Notification Channel Types
export type NotificationChannelType =
  | "email"
  | "slack"
  | "discord"
  | "msteams"
  | "zoom"
  | "telegram"
  | "webhook"
  | "pagerduty"
  | "opsgenie";

export interface NotificationChannelBase {
  id: string;
  name: string;
  type: NotificationChannelType;
  enabled: boolean;
  description?: string;
  sendResolved?: boolean;
  sendReminder?: boolean;
  reminderInterval?: string;
  lastUsedAt?: number;
  lastError?: string;
  errorCount?: number;
  createdAt: number;
  updatedAt: number;
}

export interface EmailNotificationChannel extends NotificationChannelBase {
  type: "email";
  config: {
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
}

export interface SlackNotificationChannel extends NotificationChannelBase {
  type: "slack";
  config: {
    webhookUrl: string;
    channel?: string;
    username?: string;
    iconEmoji?: string;
  };
}

export interface DiscordNotificationChannel extends NotificationChannelBase {
  type: "discord";
  config: {
    webhookUrl: string;
    username?: string;
    avatarUrl?: string;
  };
}

export interface MSTeamsNotificationChannel extends NotificationChannelBase {
  type: "msteams";
  config: {
    webhookUrl: string;
    title?: string;
    themeColor?: string;
  };
}

export interface ZoomNotificationChannel extends NotificationChannelBase {
  type: "zoom";
  config: {
    webhookUrl: string;
    authToken?: string;
    botJid?: string;
    headers?: Record<string, string>;
  };
}

export interface TelegramNotificationChannel extends NotificationChannelBase {
  type: "telegram";
  config: {
    botToken: string;
    chatId: string;
    parseMode?: "HTML" | "Markdown" | "MarkdownV2";
    disableNotification?: boolean;
  };
}

export interface WebhookNotificationChannel extends NotificationChannelBase {
  type: "webhook";
  config: {
    url: string;
    method: "POST" | "PUT" | "PATCH" | "GET";
    contentType?: "json" | "form" | "text";
    headers?: Record<string, string>;
    bodyTemplate?: string;
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
    retryCount?: number;
  };
}

export interface PagerDutyNotificationChannel extends NotificationChannelBase {
  type: "pagerduty";
  config: {
    integrationKey: string;
    severity?: "critical" | "error" | "warning" | "info";
    dedupKey?: string;
  };
}

export interface OpsGenieNotificationChannel extends NotificationChannelBase {
  type: "opsgenie";
  config: {
    apiKey: string;
    apiUrl?: string;
    priority?: "P1" | "P2" | "P3" | "P4" | "P5";
    tags?: string[];
  };
}

export type NotificationChannel =
  | EmailNotificationChannel
  | SlackNotificationChannel
  | DiscordNotificationChannel
  | MSTeamsNotificationChannel
  | ZoomNotificationChannel
  | TelegramNotificationChannel
  | WebhookNotificationChannel
  | PagerDutyNotificationChannel
  | OpsGenieNotificationChannel;
