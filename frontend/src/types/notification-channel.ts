/**
 * Notification Channel Types
 * Type definitions for notification channels, templates, and configurations
 */

export type ChannelType =
  | "email"
  | "slack"
  | "discord"
  | "teams"
  | "zoom"
  | "telegram"
  | "opsgenie"
  | "pagerduty"
  | "webhook";

export interface NotificationChannel {
  id: string;
  name: string;
  type: ChannelType;
  description: string;
  enabled: boolean;
  configuration: Record<string, unknown>;
  labels: string[];
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  lastTestedAt: number | null;
  lastTestResult: "success" | "failure" | null;
  lastNotifiedAt: number | null;
  notificationCount: number;
  failureCount: number;
}

export interface CreateNotificationChannelRequest {
  name: string;
  type: ChannelType;
  description?: string;
  enabled?: boolean;
  configuration: Record<string, unknown>;
  labels?: string[];
}

export interface UpdateNotificationChannelRequest {
  name?: string;
  description?: string;
  enabled?: boolean;
  configuration?: Record<string, unknown>;
  labels?: string[];
}

export interface TestChannelResponse {
  success: boolean;
  message: string;
  responseTime: number;
  testedAt: number;
  details?: Record<string, unknown>;
}

export interface ChannelListQuery {
  type?: ChannelType;
  enabled?: boolean;
  search?: string;
}

export interface ChannelCapability {
  key: string;
  label: string;
  enabled: boolean;
}

export interface ChannelTypeConfig {
  type: ChannelType;
  label: string;
  icon: string;
  description: string;
  capabilities: ChannelCapability[];
  configFields: ChannelConfigField[];
}

export interface ChannelConfigField {
  key: string;
  label: string;
  type: "text" | "textarea" | "password" | "number" | "boolean" | "select" | "tags";
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  category: "alert" | "incident" | "recovery" | "digest" | "security" | "onboarding" | "report";
  variables: string[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
