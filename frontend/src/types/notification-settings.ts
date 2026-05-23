/**
 * Notification Settings Types
 * Type definitions for user notification preferences and templates
 */

export interface NotificationPreferences {
  emailEnabled: boolean;
  slackEnabled: boolean;
  pushEnabled: boolean;
  digestEnabled: boolean;
  digestFrequency: "hourly" | "daily" | "weekly";
  digestTime: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  quietHoursTimezone: string;
  minimumSeverity: "info" | "warning" | "critical";
  groupByResource: boolean;
  deduplicationWindow: number;
  rateLimitPerHour: number;
  escalationEnabled: boolean;
  escalationDelayMinutes: number;
  autoResolveNotify: boolean;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  organizationId: string;
  preferences: NotificationPreferences;
  categoryOverrides: Record<string, Partial<NotificationPreferences>>;
  updatedAt: number;
  updatedBy: string;
}

export interface UpdateNotificationSettingsRequest {
  preferences?: Partial<NotificationPreferences>;
  categoryOverrides?: Record<string, Partial<NotificationPreferences>>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  category:
    | "alert"
    | "incident"
    | "recovery"
    | "digest"
    | "system"
    | "security";
  channelType: "email" | "slack" | "webhook" | "generic";
  subject: string;
  body: string;
  variables: TemplateVariable[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  updatedBy: string;
  previewHtml?: string;
}

export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
  required: boolean;
}

export interface UpdateTemplateRequest {
  subject?: string;
  body?: string;
  isActive?: boolean;
}

export interface UpdateTemplateResponse {
  template: NotificationTemplate;
  message: string;
}
