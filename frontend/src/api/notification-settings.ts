/**
 * Notification Settings API client
 * Manages global notification preferences and message templates
 * Uses collectorClient for real HTTP calls with config.useMock branching
 */

import { collectorClient } from "./collector";
import { config } from "@/config";

// ==================== TYPES ====================
// Note: Types are also available in @/types/notification-settings.ts

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

// ==================== ENDPOINTS ====================

export const NOTIFICATION_SETTINGS_ENDPOINTS = {
  SETTINGS: "/api/v2/notification/settings",
  TEMPLATES: "/api/v2/notification/settings/templates",
  TEMPLATE: (id: string) => `/api/v2/notification/settings/templates/${id}`,
} as const;

// ==================== MOCK DATA ====================

function generateMockSettings(): NotificationSettings {
  const now = Date.now();

  return {
    id: "ns-001",
    userId: "user-001",
    organizationId: "org-devopscorner",
    preferences: {
      emailEnabled: true,
      slackEnabled: true,
      pushEnabled: false,
      digestEnabled: true,
      digestFrequency: "daily",
      digestTime: "09:00",
      quietHoursEnabled: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      quietHoursTimezone: "Asia/Jakarta",
      minimumSeverity: "warning",
      groupByResource: true,
      deduplicationWindow: 300,
      rateLimitPerHour: 50,
      escalationEnabled: true,
      escalationDelayMinutes: 15,
      autoResolveNotify: true,
    },
    categoryOverrides: {
      security: {
        minimumSeverity: "info",
        quietHoursEnabled: false,
        escalationEnabled: true,
        escalationDelayMinutes: 5,
      },
      billing: {
        emailEnabled: true,
        slackEnabled: false,
        digestEnabled: false,
      },
    },
    updatedAt: now - 3 * 24 * 60 * 60 * 1000,
    updatedBy: "user-001",
  };
}

const COMMON_TEMPLATE_VARIABLES: TemplateVariable[] = [
  {
    name: "alert_name",
    description: "Name of the triggered alert",
    example: "High CPU Usage",
    required: true,
  },
  {
    name: "severity",
    description: "Alert severity level",
    example: "critical",
    required: true,
  },
  {
    name: "resource_name",
    description: "Name of the affected resource",
    example: "api-server-01",
    required: true,
  },
  {
    name: "resource_type",
    description: "Type of the affected resource",
    example: "server",
    required: false,
  },
  {
    name: "timestamp",
    description: "Time of the event in ISO 8601 format",
    example: "2024-12-15T10:30:00Z",
    required: true,
  },
  {
    name: "description",
    description: "Alert description or summary",
    example: "CPU usage exceeded 90% threshold",
    required: false,
  },
  {
    name: "dashboard_url",
    description: "Link to the TelemetryFlow dashboard",
    example: "https://dashboard.telemetryflow.id/alerts/alert-001",
    required: false,
  },
  {
    name: "organization_name",
    description: "Organization name",
    example: "DevOpsCorner",
    required: false,
  },
];

function generateMockTemplates(): NotificationTemplate[] {
  const now = Date.now();

  return [
    {
      id: "tpl-001",
      name: "Alert Triggered - Email",
      description: "Default email template for when an alert condition is met",
      category: "alert",
      channelType: "email",
      subject: "[{{severity}}] {{alert_name}} - {{resource_name}}",
      body: `<h2>Alert: {{alert_name}}</h2>
<p><strong>Severity:</strong> {{severity}}</p>
<p><strong>Resource:</strong> {{resource_name}} ({{resource_type}})</p>
<p><strong>Time:</strong> {{timestamp}}</p>
<p>{{description}}</p>
<p><a href="{{dashboard_url}}">View in Dashboard</a></p>`,
      variables: COMMON_TEMPLATE_VARIABLES,
      isDefault: true,
      isActive: true,
      createdAt: now - 365 * 24 * 60 * 60 * 1000,
      updatedAt: now - 30 * 24 * 60 * 60 * 1000,
      updatedBy: "system",
      previewHtml:
        "<h2>Alert: High CPU Usage</h2><p><strong>Severity:</strong> critical</p>",
    },
    {
      id: "tpl-002",
      name: "Alert Triggered - Slack",
      description: "Default Slack message template for alert notifications",
      category: "alert",
      channelType: "slack",
      subject: ":rotating_light: [{{severity}}] {{alert_name}}",
      body: `*Alert:* {{alert_name}}
*Severity:* {{severity}}
*Resource:* {{resource_name}} ({{resource_type}})
*Time:* {{timestamp}}

{{description}}

<{{dashboard_url}}|View in Dashboard>`,
      variables: COMMON_TEMPLATE_VARIABLES,
      isDefault: true,
      isActive: true,
      createdAt: now - 365 * 24 * 60 * 60 * 1000,
      updatedAt: now - 30 * 24 * 60 * 60 * 1000,
      updatedBy: "system",
    },
    {
      id: "tpl-003",
      name: "Incident Opened - Email",
      description: "Email template for when a new incident is created",
      category: "incident",
      channelType: "email",
      subject: "[Incident] {{alert_name}} - {{resource_name}} is down",
      body: `<h2>Incident Report</h2>
<p>An incident has been opened for <strong>{{resource_name}}</strong>.</p>
<p><strong>Alert:</strong> {{alert_name}}</p>
<p><strong>Severity:</strong> {{severity}}</p>
<p><strong>Started:</strong> {{timestamp}}</p>
<p>{{description}}</p>
<p><a href="{{dashboard_url}}">Manage Incident</a></p>`,
      variables: COMMON_TEMPLATE_VARIABLES,
      isDefault: true,
      isActive: true,
      createdAt: now - 365 * 24 * 60 * 60 * 1000,
      updatedAt: now - 60 * 24 * 60 * 60 * 1000,
      updatedBy: "system",
    },
    {
      id: "tpl-004",
      name: "Recovery - Email",
      description: "Email template for when an alert condition has recovered",
      category: "recovery",
      channelType: "email",
      subject: "[Resolved] {{alert_name}} - {{resource_name}}",
      body: `<h2>Resolved: {{alert_name}}</h2>
<p>The alert condition for <strong>{{resource_name}}</strong> has been resolved.</p>
<p><strong>Resolved at:</strong> {{timestamp}}</p>
<p><a href="{{dashboard_url}}">View Details</a></p>`,
      variables: COMMON_TEMPLATE_VARIABLES.filter(
        (v) => v.name !== "description",
      ),
      isDefault: true,
      isActive: true,
      createdAt: now - 365 * 24 * 60 * 60 * 1000,
      updatedAt: now - 60 * 24 * 60 * 60 * 1000,
      updatedBy: "system",
    },
    {
      id: "tpl-005",
      name: "Daily Digest - Email",
      description: "Daily summary of all alerts and incidents",
      category: "digest",
      channelType: "email",
      subject: "[Daily Digest] {{organization_name}} - Alert Summary",
      body: `<h2>Daily Alert Digest</h2>
<p>Summary for {{organization_name}} on {{timestamp}}</p>
<h3>Active Alerts</h3>
<p>{{description}}</p>
<p><a href="{{dashboard_url}}">View All Alerts</a></p>`,
      variables: [
        ...COMMON_TEMPLATE_VARIABLES.filter((v) =>
          [
            "organization_name",
            "timestamp",
            "description",
            "dashboard_url",
          ].includes(v.name),
        ),
        {
          name: "total_alerts",
          description: "Total number of active alerts",
          example: "12",
          required: true,
        },
        {
          name: "critical_count",
          description: "Number of critical alerts",
          example: "2",
          required: true,
        },
        {
          name: "resolved_count",
          description: "Number of resolved alerts today",
          example: "5",
          required: true,
        },
      ],
      isDefault: true,
      isActive: true,
      createdAt: now - 365 * 24 * 60 * 60 * 1000,
      updatedAt: now - 45 * 24 * 60 * 60 * 1000,
      updatedBy: "system",
    },
    {
      id: "tpl-006",
      name: "Security Event - Email",
      description: "Email template for security-related notifications",
      category: "security",
      channelType: "email",
      subject: "[Security] {{alert_name}} detected on {{resource_name}}",
      body: `<h2>Security Event</h2>
<p><strong>Event:</strong> {{alert_name}}</p>
<p><strong>Resource:</strong> {{resource_name}}</p>
<p><strong>Time:</strong> {{timestamp}}</p>
<p><strong>Details:</strong> {{description}}</p>
<p style="color: red;"><strong>Please review this event immediately.</strong></p>
<p><a href="{{dashboard_url}}">View Security Details</a></p>`,
      variables: COMMON_TEMPLATE_VARIABLES,
      isDefault: true,
      isActive: true,
      createdAt: now - 365 * 24 * 60 * 60 * 1000,
      updatedAt: now - 15 * 24 * 60 * 60 * 1000,
      updatedBy: "user-001",
    },
    {
      id: "tpl-007",
      name: "Alert Triggered - Webhook",
      description: "JSON payload template for generic webhook integrations",
      category: "alert",
      channelType: "webhook",
      subject: "{{alert_name}}",
      body: `{
  "event": "alert.triggered",
  "alert": {
    "name": "{{alert_name}}",
    "severity": "{{severity}}",
    "resource": "{{resource_name}}",
    "resource_type": "{{resource_type}}",
    "description": "{{description}}"
  },
  "timestamp": "{{timestamp}}",
  "dashboard_url": "{{dashboard_url}}",
  "organization": "{{organization_name}}"
}`,
      variables: COMMON_TEMPLATE_VARIABLES,
      isDefault: true,
      isActive: true,
      createdAt: now - 365 * 24 * 60 * 60 * 1000,
      updatedAt: now - 90 * 24 * 60 * 60 * 1000,
      updatedBy: "system",
    },
  ];
}

// ==================== API CLIENT ====================

export const notificationSettingsApi = {
  /**
   * Get notification settings for the current user/organization
   * Returns preferences, quiet hours, digest config, and category overrides
   */
  async getSettings(): Promise<NotificationSettings> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return generateMockSettings();
    }

    const response = await collectorClient.get<NotificationSettings>(
      NOTIFICATION_SETTINGS_ENDPOINTS.SETTINGS,
    );
    return response.data;
  },

  /**
   * Update notification settings
   * Supports partial updates of preferences and category overrides
   */
  async updateSettings(
    data: UpdateNotificationSettingsRequest,
  ): Promise<NotificationSettings> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const current = generateMockSettings();
      return {
        ...current,
        preferences: {
          ...current.preferences,
          ...(data.preferences || {}),
        },
        categoryOverrides: data.categoryOverrides || current.categoryOverrides,
        updatedAt: Date.now(),
        updatedBy: "user-001",
      };
    }

    const response = await collectorClient.put<NotificationSettings>(
      NOTIFICATION_SETTINGS_ENDPOINTS.SETTINGS,
      data,
    );
    return response.data;
  },

  /**
   * List all notification templates
   * Templates define the message format for each channel type and event category
   */
  async getTemplates(): Promise<NotificationTemplate[]> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return generateMockTemplates();
    }

    const response = await collectorClient.get<NotificationTemplate[]>(
      NOTIFICATION_SETTINGS_ENDPOINTS.TEMPLATES,
    );
    return response.data;
  },

  /**
   * Update a notification template
   * Allows customization of subject, body, and active status
   */
  async updateTemplate(
    id: string,
    data: UpdateTemplateRequest,
  ): Promise<UpdateTemplateResponse> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const templates = generateMockTemplates();
      const template = templates.find((t) => t.id === id) || templates[0];
      const updated: NotificationTemplate = {
        ...template,
        id,
        subject: data.subject || template.subject,
        body: data.body || template.body,
        isActive:
          data.isActive !== undefined ? data.isActive : template.isActive,
        updatedAt: Date.now(),
        updatedBy: "user-001",
      };
      return {
        template: updated,
        message: "Template updated successfully",
      };
    }

    const response = await collectorClient.put<UpdateTemplateResponse>(
      NOTIFICATION_SETTINGS_ENDPOINTS.TEMPLATE(id),
      data,
    );
    return response.data;
  },
};

export default notificationSettingsApi;
