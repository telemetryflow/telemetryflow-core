/**
 * Notification Channels API client
 * Manages notification delivery channels (email, Slack, PagerDuty, webhooks, etc.)
 * Uses iamClient (platform API at /api/v2/) for real HTTP calls
 */

import { iamClient } from "./iam";
import { config } from "@/config";

// ==================== TYPES ====================
// Note: Types are also available in @/types/notification-channel.ts

export type ChannelType =
  | "email"
  | "slack"
  | "discord"
  | "msteams"
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
  config: Record<string, unknown>;
  sendResolved?: boolean;
  sendReminder?: boolean;
  reminderInterval?: string;
}

export interface UpdateNotificationChannelRequest {
  name?: string;
  description?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
  sendResolved?: boolean;
  sendReminder?: boolean;
  reminderInterval?: string;
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

// ==================== CHANNEL DEFAULTS & CAPABILITIES ====================

export const CHANNEL_TYPE_CONFIGS: Record<ChannelType, ChannelTypeConfig> = {
  email: {
    type: "email",
    label: "Email",
    icon: "carbon:email",
    description: "Send alert notifications via email with customizable templates",
    capabilities: [
      { key: "templates", label: "Email Templates (HTML/Text)", enabled: true },
      { key: "attachments", label: "File Attachments", enabled: true },
      { key: "rich_formatting", label: "Rich HTML Formatting", enabled: true },
      { key: "cc_bcc", label: "CC/BCC Recipients", enabled: true },
      { key: "digest", label: "Digest Mode (Batched)", enabled: true },
      { key: "priority_headers", label: "Priority Headers", enabled: true },
      { key: "custom_headers", label: "Custom Headers", enabled: true },
      { key: "reply_to", label: "Reply-To Address", enabled: true },
    ],
    configFields: [
      { key: "recipients", label: "Recipients", type: "tags", required: true, placeholder: "Enter email addresses" },
      { key: "cc", label: "CC", type: "tags", placeholder: "CC recipients" },
      { key: "bcc", label: "BCC", type: "tags", placeholder: "BCC recipients" },
      { key: "subject_prefix", label: "Subject Prefix", type: "text", placeholder: "[TelemetryFlow Alert]" },
      { key: "from_name", label: "From Name", type: "text", placeholder: "TelemetryFlow" },
      { key: "reply_to", label: "Reply-To", type: "text", placeholder: "noreply@telemetryflow.id" },
      { key: "template_id", label: "Email Template", type: "select", options: [] },
      { key: "html_enabled", label: "HTML Emails", type: "boolean" },
      { key: "include_details", label: "Include Alert Details", type: "boolean" },
      { key: "include_graph", label: "Include Graph Snapshot", type: "boolean" },
    ],
  },
  slack: {
    type: "slack",
    label: "Slack",
    icon: "mdi:slack",
    description: "Send notifications to Slack channels via incoming webhooks or Slack API",
    capabilities: [
      { key: "webhook", label: "Incoming Webhook", enabled: true },
      { key: "blocks", label: "Block Kit Formatting", enabled: true },
      { key: "threads", label: "Thread Replies", enabled: true },
      { key: "mentions", label: "User/Group Mentions", enabled: true },
      { key: "unfurl", label: "Link Unfurling", enabled: true },
      { key: "reactions", label: "Emoji Reactions", enabled: true },
      { key: "file_upload", label: "File Upload", enabled: true },
    ],
    configFields: [
      { key: "webhook_url", label: "Webhook URL", type: "password", required: true, placeholder: "https://hooks.slack.com/services/..." },
      { key: "channel", label: "Channel", type: "text", required: true, placeholder: "#incidents" },
      { key: "username", label: "Bot Username", type: "text", placeholder: "TelemetryFlow Bot" },
      { key: "icon_emoji", label: "Icon Emoji", type: "text", placeholder: ":warning:" },
      { key: "mention_users", label: "Mention Users", type: "tags", placeholder: "@oncall, @sre-team" },
      { key: "thread_replies", label: "Use Thread Replies", type: "boolean" },
    ],
  },
  discord: {
    type: "discord",
    label: "Discord",
    icon: "mdi:discord",
    description: "Send notifications to Discord channels via webhooks with rich embeds",
    capabilities: [
      { key: "webhook", label: "Webhook Integration", enabled: true },
      { key: "embeds", label: "Rich Embeds", enabled: true },
      { key: "mentions", label: "Role/User Mentions", enabled: true },
      { key: "threads", label: "Forum/Thread Posts", enabled: true },
      { key: "file_upload", label: "File Attachments", enabled: true },
    ],
    configFields: [
      { key: "webhook_url", label: "Webhook URL", type: "password", required: true, placeholder: "https://discord.com/api/webhooks/..." },
      { key: "username", label: "Bot Username", type: "text", placeholder: "TelemetryFlow" },
      { key: "avatar_url", label: "Avatar URL", type: "text", placeholder: "https://cdn.telemetryflow.id/avatar.png" },
      { key: "embed_color", label: "Embed Color (Decimal)", type: "number", placeholder: "16711680" },
      { key: "mention_roles", label: "Mention Roles", type: "tags", placeholder: "Role IDs to mention" },
    ],
  },
  msteams: {
    type: "msteams",
    label: "MS Teams",
    icon: "mdi:microsoft-teams",
    description: "Send notifications to Microsoft Teams channels via connectors or Workflows",
    capabilities: [
      { key: "webhook", label: "Incoming Webhook / Workflow", enabled: true },
      { key: "adaptive_cards", label: "Adaptive Cards", enabled: true },
      { key: "actions", label: "Actionable Buttons", enabled: true },
      { key: "mentions", label: "User Mentions", enabled: true },
      { key: "images", label: "Inline Images", enabled: true },
    ],
    configFields: [
      { key: "webhook_url", label: "Webhook URL", type: "password", required: true, placeholder: "https://outlook.office.com/webhook/..." },
      { key: "card_title", label: "Card Title", type: "text", placeholder: "TelemetryFlow Alert" },
      { key: "include_actions", label: "Include Action Buttons", type: "boolean" },
      { key: "mention_users", label: "Mention Users", type: "tags", placeholder: "user@company.com" },
    ],
  },
  zoom: {
    type: "zoom",
    label: "Zoom",
    icon: "mdi:video-outline",
    description: "Send notifications to Zoom Team Chat channels via incoming webhooks",
    capabilities: [
      { key: "webhook", label: "Incoming Webhook", enabled: true },
      { key: "rich_text", label: "Rich Text Formatting", enabled: true },
      { key: "mentions", label: "User Mentions", enabled: true },
      { key: "links", label: "Action Links", enabled: true },
    ],
    configFields: [
      { key: "webhook_url", label: "Webhook URL", type: "password", required: true, placeholder: "https://inbots.zoom.us/incoming/hook/..." },
      { key: "channel_id", label: "Channel ID", type: "text", required: true, placeholder: "Zoom channel ID" },
      { key: "bot_name", label: "Bot Name", type: "text", placeholder: "TelemetryFlow" },
      { key: "verification_token", label: "Verification Token", type: "password", placeholder: "Zoom verification token" },
    ],
  },
  telegram: {
    type: "telegram",
    label: "Telegram",
    icon: "mdi:send",
    description: "Send notifications to Telegram groups/channels via Bot API",
    capabilities: [
      { key: "bot_api", label: "Bot API Integration", enabled: true },
      { key: "html_markdown", label: "HTML/Markdown Formatting", enabled: true },
      { key: "inline_buttons", label: "Inline Keyboard Buttons", enabled: true },
      { key: "silent_mode", label: "Silent Notifications", enabled: true },
      { key: "topics", label: "Forum Topic Support", enabled: true },
    ],
    configFields: [
      { key: "bot_token", label: "Bot Token", type: "password", required: true, placeholder: "0000000000:XXXXXXXXXXXXXXXXXX" },
      { key: "chat_id", label: "Chat ID", type: "text", required: true, placeholder: "-1001234567890" },
      { key: "parse_mode", label: "Parse Mode", type: "select", options: [{ label: "HTML", value: "HTML" }, { label: "Markdown", value: "MarkdownV2" }] },
      { key: "message_thread_id", label: "Topic Thread ID", type: "text", placeholder: "For forum groups" },
      { key: "disable_notification", label: "Silent Notification", type: "boolean" },
    ],
  },
  opsgenie: {
    type: "opsgenie",
    label: "OpsGenie",
    icon: "mdi:bell-alert-outline",
    description: "Create and manage OpsGenie alerts with priority and team routing",
    capabilities: [
      { key: "api_integration", label: "API Integration", enabled: true },
      { key: "priority_mapping", label: "Priority Mapping (P1-P5)", enabled: true },
      { key: "team_routing", label: "Team Routing", enabled: true },
      { key: "tags", label: "Alert Tags", enabled: true },
      { key: "auto_close", label: "Auto-Close on Recovery", enabled: true },
      { key: "custom_actions", label: "Custom Actions", enabled: true },
      { key: "schedules", label: "On-Call Schedules", enabled: true },
    ],
    configFields: [
      { key: "api_key", label: "API Key", type: "password", required: true, placeholder: "OpsGenie API key" },
      { key: "team", label: "Team", type: "text", required: true, placeholder: "platform-engineering" },
      { key: "priority_mapping", label: "Priority Mapping", type: "textarea", placeholder: '{"critical": "P1", "warning": "P2", "info": "P3"}' },
      { key: "tags", label: "Default Tags", type: "tags", placeholder: "telemetryflow, production" },
      { key: "auto_close", label: "Auto-Close on Recovery", type: "boolean" },
    ],
  },
  pagerduty: {
    type: "pagerduty",
    label: "PagerDuty",
    icon: "mdi:page-layout-header",
    description: "Trigger PagerDuty incidents with severity mapping and auto-resolve",
    capabilities: [
      { key: "events_v2", label: "Events API v2", enabled: true },
      { key: "severity_mapping", label: "Severity Mapping", enabled: true },
      { key: "dedup", label: "Alert Deduplication", enabled: true },
      { key: "auto_resolve", label: "Auto-Resolve on Recovery", enabled: true },
      { key: "escalation", label: "Escalation Policies", enabled: true },
      { key: "custom_details", label: "Custom Alert Details", enabled: true },
      { key: "change_events", label: "Change Events", enabled: true },
    ],
    configFields: [
      { key: "routing_key", label: "Routing Key", type: "password", required: true, placeholder: "PagerDuty integration routing key" },
      { key: "severity_mapping", label: "Severity Mapping", type: "textarea", placeholder: '{"critical": "critical", "warning": "warning", "info": "info"}' },
      { key: "dedup_key_prefix", label: "Dedup Key Prefix", type: "text", placeholder: "telemetryflow" },
      { key: "auto_resolve", label: "Auto-Resolve", type: "boolean" },
    ],
  },
  webhook: {
    type: "webhook",
    label: "Webhook",
    icon: "carbon:webhook",
    description: "Send HTTP webhook requests with customizable payload templates",
    capabilities: [
      { key: "custom_url", label: "Custom URL", enabled: true },
      { key: "methods", label: "HTTP Methods (POST/PUT/PATCH)", enabled: true },
      { key: "custom_headers", label: "Custom Headers", enabled: true },
      { key: "auth", label: "Authentication (Bearer/Basic/HMAC)", enabled: true },
      { key: "template", label: "Payload Template (Mustache)", enabled: true },
      { key: "retry", label: "Retry on Failure", enabled: true },
      { key: "ssl_verify", label: "SSL Verification", enabled: true },
    ],
    configFields: [
      { key: "url", label: "Webhook URL", type: "text", required: true, placeholder: "https://your-endpoint.com/webhook" },
      { key: "method", label: "HTTP Method", type: "select", options: [{ label: "POST", value: "POST" }, { label: "PUT", value: "PUT" }, { label: "PATCH", value: "PATCH" }] },
      { key: "headers", label: "Custom Headers (JSON)", type: "textarea", placeholder: '{"Authorization": "Bearer xxx"}' },
      { key: "payload_template", label: "Payload Template", type: "textarea", placeholder: '{"alert": "{{alert_name}}", "severity": "{{severity}}"}' },
      { key: "timeout", label: "Timeout (ms)", type: "number", placeholder: "10000" },
      { key: "retry_count", label: "Retry Count", type: "number", placeholder: "3" },
      { key: "ssl_verify", label: "Verify SSL", type: "boolean" },
    ],
  },
};

// ==================== DEFAULT EMAIL TEMPLATES ====================

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "tpl-alert-default",
    name: "Alert Notification",
    subject: "[{{severity}}] {{alert_name}} - {{service_name}}",
    bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:{{severity_color}};color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
    <h2 style="margin:0">{{severity_icon}} {{alert_name}}</h2>
    <p style="margin:4px 0 0;opacity:0.9">{{service_name}} &middot; {{timestamp}}</p>
  </div>
  <div style="background:#f8f9fa;padding:24px;border:1px solid #e9ecef;border-top:0;border-radius:0 0 8px 8px">
    <p><strong>Description:</strong> {{description}}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px;border-bottom:1px solid #dee2e6"><strong>Severity</strong></td><td style="padding:8px;border-bottom:1px solid #dee2e6">{{severity}}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #dee2e6"><strong>Service</strong></td><td style="padding:8px;border-bottom:1px solid #dee2e6">{{service_name}}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #dee2e6"><strong>Environment</strong></td><td style="padding:8px;border-bottom:1px solid #dee2e6">{{environment}}</td></tr>
      <tr><td style="padding:8px"><strong>Triggered At</strong></td><td style="padding:8px">{{timestamp}}</td></tr>
    </table>
    <a href="{{alert_url}}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600">View Alert</a>
  </div>
</div>`,
    bodyText: "[{{severity}}] {{alert_name}}\nService: {{service_name}}\nDescription: {{description}}\nTriggered: {{timestamp}}\nView: {{alert_url}}",
    category: "alert",
    variables: ["alert_name", "severity", "severity_color", "severity_icon", "service_name", "description", "environment", "timestamp", "alert_url"],
    isDefault: true,
    isActive: true,
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: "tpl-incident-default",
    name: "Incident Created",
    subject: "[INCIDENT] {{incident_title}} - Severity: {{severity}}",
    bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#dc2626;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
    <h2 style="margin:0">Incident: {{incident_title}}</h2>
    <p style="margin:4px 0 0;opacity:0.9">ID: {{incident_id}} &middot; {{timestamp}}</p>
  </div>
  <div style="background:#f8f9fa;padding:24px;border:1px solid #e9ecef;border-top:0;border-radius:0 0 8px 8px">
    <p>{{description}}</p>
    <p><strong>Assigned to:</strong> {{assigned_to}}</p>
    <p><strong>Affected Services:</strong> {{affected_services}}</p>
    <a href="{{incident_url}}" style="display:inline-block;background:#dc2626;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600">View Incident</a>
  </div>
</div>`,
    bodyText: "[INCIDENT] {{incident_title}}\nID: {{incident_id}}\nSeverity: {{severity}}\nDescription: {{description}}\nAssigned: {{assigned_to}}\nView: {{incident_url}}",
    category: "incident",
    variables: ["incident_id", "incident_title", "severity", "description", "assigned_to", "affected_services", "timestamp", "incident_url"],
    isDefault: true,
    isActive: true,
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: "tpl-recovery-default",
    name: "Recovery Notification",
    subject: "[RESOLVED] {{alert_name}} - {{service_name}}",
    bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#10b981;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
    <h2 style="margin:0">Resolved: {{alert_name}}</h2>
    <p style="margin:4px 0 0;opacity:0.9">{{service_name}} &middot; Duration: {{duration}}</p>
  </div>
  <div style="background:#f8f9fa;padding:24px;border:1px solid #e9ecef;border-top:0;border-radius:0 0 8px 8px">
    <p>The alert <strong>{{alert_name}}</strong> has been resolved.</p>
    <p><strong>Duration:</strong> {{duration}}</p>
    <p><strong>Resolved At:</strong> {{resolved_at}}</p>
    <a href="{{alert_url}}" style="display:inline-block;background:#10b981;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600">View Details</a>
  </div>
</div>`,
    bodyText: "[RESOLVED] {{alert_name}}\nService: {{service_name}}\nDuration: {{duration}}\nResolved At: {{resolved_at}}\nView: {{alert_url}}",
    category: "recovery",
    variables: ["alert_name", "service_name", "duration", "resolved_at", "alert_url"],
    isDefault: true,
    isActive: true,
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: "tpl-digest-default",
    name: "Daily Digest",
    subject: "[Digest] TelemetryFlow Daily Summary - {{date}}",
    bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#3b82f6;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
    <h2 style="margin:0">Daily Summary</h2>
    <p style="margin:4px 0 0;opacity:0.9">{{date}} &middot; {{organization_name}}</p>
  </div>
  <div style="background:#f8f9fa;padding:24px;border:1px solid #e9ecef;border-top:0;border-radius:0 0 8px 8px">
    <h3>Alert Summary</h3>
    <p>Critical: {{critical_count}} | Warning: {{warning_count}} | Info: {{info_count}}</p>
    <h3>Top Services</h3>
    <p>{{top_services}}</p>
    <a href="{{dashboard_url}}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600">View Dashboard</a>
  </div>
</div>`,
    bodyText: "Daily Summary - {{date}}\n\nCritical: {{critical_count}} | Warning: {{warning_count}} | Info: {{info_count}}\nTop Services: {{top_services}}\n\nDashboard: {{dashboard_url}}",
    category: "digest",
    variables: ["date", "organization_name", "critical_count", "warning_count", "info_count", "top_services", "dashboard_url"],
    isDefault: true,
    isActive: true,
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: "tpl-security-default",
    name: "Security Alert",
    subject: "[SECURITY] {{alert_type}} detected - {{source_ip}}",
    bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#7c3aed;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
    <h2 style="margin:0">Security Alert: {{alert_type}}</h2>
    <p style="margin:4px 0 0;opacity:0.9">Source: {{source_ip}} &middot; {{timestamp}}</p>
  </div>
  <div style="background:#f8f9fa;padding:24px;border:1px solid #e9ecef;border-top:0;border-radius:0 0 8px 8px">
    <p><strong>Type:</strong> {{alert_type}}</p>
    <p><strong>Source IP:</strong> {{source_ip}}</p>
    <p><strong>User:</strong> {{user_email}}</p>
    <p><strong>Details:</strong> {{details}}</p>
    <a href="{{security_url}}" style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600">Investigate</a>
  </div>
</div>`,
    bodyText: "[SECURITY] {{alert_type}}\nSource: {{source_ip}}\nUser: {{user_email}}\nDetails: {{details}}\nInvestigate: {{security_url}}",
    category: "security",
    variables: ["alert_type", "source_ip", "user_email", "details", "timestamp", "security_url"],
    isDefault: true,
    isActive: true,
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: "tpl-onboarding-welcome",
    name: "Welcome Email",
    subject: "Welcome to TelemetryFlow - {{user_name}}",
    bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#3b82f6;color:#fff;padding:24px;text-align:center;border-radius:8px 8px 0 0">
    <h1 style="margin:0">Welcome to TelemetryFlow</h1>
  </div>
  <div style="background:#f8f9fa;padding:24px;border:1px solid #e9ecef;border-top:0;border-radius:0 0 8px 8px">
    <p>Hello <strong>{{user_name}}</strong>,</p>
    <p>Your account has been created for <strong>{{organization_name}}</strong>.</p>
    <p><strong>Role:</strong> {{role_name}}</p>
    <p>Please log in and change your password on first access.</p>
    <a href="{{login_url}}" style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600">Log In</a>
  </div>
</div>`,
    bodyText: "Welcome to TelemetryFlow, {{user_name}}!\n\nOrganization: {{organization_name}}\nRole: {{role_name}}\n\nLog in: {{login_url}}",
    category: "onboarding",
    variables: ["user_name", "organization_name", "role_name", "login_url"],
    isDefault: true,
    isActive: true,
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: "tpl-report-weekly",
    name: "Weekly Report",
    subject: "TelemetryFlow Weekly Report - {{week_range}}",
    bodyHtml: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#0ea5e9;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
    <h2 style="margin:0">Weekly Report</h2>
    <p style="margin:4px 0 0;opacity:0.9">{{week_range}} &middot; {{organization_name}}</p>
  </div>
  <div style="background:#f8f9fa;padding:24px;border:1px solid #e9ecef;border-top:0;border-radius:0 0 8px 8px">
    <h3>Uptime: {{uptime_pct}}%</h3>
    <p>Total Alerts: {{total_alerts}} ({{resolved_count}} resolved)</p>
    <p>MTTR: {{mttr}}</p>
    <p>Top Issue: {{top_issue}}</p>
    <a href="{{report_url}}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600">View Full Report</a>
  </div>
</div>`,
    bodyText: "Weekly Report - {{week_range}}\n\nUptime: {{uptime_pct}}%\nTotal Alerts: {{total_alerts}}\nResolved: {{resolved_count}}\nMTTR: {{mttr}}\n\nReport: {{report_url}}",
    category: "report",
    variables: ["week_range", "organization_name", "uptime_pct", "total_alerts", "resolved_count", "mttr", "top_issue", "report_url"],
    isDefault: true,
    isActive: true,
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
];

// ==================== ENDPOINTS ====================

export const NOTIFICATION_CHANNEL_ENDPOINTS = {
  LIST: "/notification-channels",
  CREATE: "/notification-channels",
  SINGLE: (id: string) => `/notification-channels/${id}`,
  TEST: (id: string) => `/notification-channels/${id}/test`,
  DEFAULTS: "/notification-channels/defaults",
} as const;

// ==================== MOCK DATA ====================

function generateMockChannels(): NotificationChannel[] {
  const now = Date.now();

  return [
    {
      id: "nc-001",
      name: "DevOps Team Email",
      type: "email",
      description: "Primary email notification channel for the DevOps team",
      enabled: true,
      configuration: {
        recipients: [
          "devops-alerts@telemetryflow.id",
          "sre-team@telemetryflow.id",
        ],
        subject_prefix: "[TelemetryFlow Alert]",
        include_details: true,
        html_enabled: true,
      },
      labels: ["critical", "production"],
      createdAt: now - 180 * 24 * 60 * 60 * 1000,
      updatedAt: now - 15 * 24 * 60 * 60 * 1000,
      createdBy: "user-001",
      lastTestedAt: now - 7 * 24 * 60 * 60 * 1000,
      lastTestResult: "success",
      lastNotifiedAt: now - 2 * 60 * 60 * 1000,
      notificationCount: 1247,
      failureCount: 3,
    },
    {
      id: "nc-002",
      name: "Slack #incidents",
      type: "slack",
      description:
        "Slack notifications to the #incidents channel in DevOpsCorner workspace",
      enabled: true,
      configuration: {
        webhook_url:
          "https://hooks.slack.com/services/T0XXXXXX/B0XXXXXX/xxxxxxxxxxxxxxxxxxxxxxxx",
        channel: "#incidents",
        username: "TelemetryFlow Bot",
        icon_emoji: ":warning:",
        mention_users: ["@oncall"],
        thread_replies: true,
      },
      labels: ["critical", "production", "incidents"],
      createdAt: now - 150 * 24 * 60 * 60 * 1000,
      updatedAt: now - 5 * 24 * 60 * 60 * 1000,
      createdBy: "user-002",
      lastTestedAt: now - 3 * 24 * 60 * 60 * 1000,
      lastTestResult: "success",
      lastNotifiedAt: now - 30 * 60 * 1000,
      notificationCount: 3842,
      failureCount: 12,
    },
    {
      id: "nc-003",
      name: "PagerDuty On-Call",
      type: "pagerduty",
      description: "PagerDuty escalation for critical production alerts",
      enabled: true,
      configuration: {
        routing_key: "R0XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        severity_mapping: {
          critical: "critical",
          warning: "warning",
          info: "info",
        },
        dedup_key_prefix: "telemetryflow",
        auto_resolve: true,
      },
      labels: ["critical", "production", "oncall"],
      createdAt: now - 120 * 24 * 60 * 60 * 1000,
      updatedAt: now - 30 * 24 * 60 * 60 * 1000,
      createdBy: "user-001",
      lastTestedAt: now - 14 * 24 * 60 * 60 * 1000,
      lastTestResult: "success",
      lastNotifiedAt: now - 4 * 60 * 60 * 1000,
      notificationCount: 567,
      failureCount: 1,
    },
    {
      id: "nc-004",
      name: "Infrastructure Webhook",
      type: "webhook",
      description:
        "Generic webhook for infrastructure automation and runbook triggers",
      enabled: true,
      configuration: {
        url: "https://automation.devopscorner.id/webhooks/alerts",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": "whsec_xxxxxxxxxxxx",
        },
        timeout: 10000,
        retry_count: 3,
        payload_template:
          '{"alert": "{{alert_name}}", "severity": "{{severity}}", "timestamp": "{{timestamp}}"}',
      },
      labels: ["automation", "infrastructure"],
      createdAt: now - 90 * 24 * 60 * 60 * 1000,
      updatedAt: now - 10 * 24 * 60 * 60 * 1000,
      createdBy: "user-003",
      lastTestedAt: now - 5 * 24 * 60 * 60 * 1000,
      lastTestResult: "success",
      lastNotifiedAt: now - 6 * 60 * 60 * 1000,
      notificationCount: 892,
      failureCount: 8,
    },
    {
      id: "nc-005",
      name: "Discord #monitoring",
      type: "discord",
      description:
        "Discord notifications for the developer community monitoring channel",
      enabled: true,
      configuration: {
        webhook_url: "https://discord.com/api/webhooks/0000000000/xxxxxxxxxxxx",
        username: "TelemetryFlow",
        avatar_url: "https://cdn.telemetryflow.id/avatar.png",
        embed_color: 16711680,
      },
      labels: ["community", "monitoring"],
      createdAt: now - 60 * 24 * 60 * 60 * 1000,
      updatedAt: now - 20 * 24 * 60 * 60 * 1000,
      createdBy: "user-003",
      lastTestedAt: now - 10 * 24 * 60 * 60 * 1000,
      lastTestResult: "success",
      lastNotifiedAt: now - 12 * 60 * 60 * 1000,
      notificationCount: 423,
      failureCount: 5,
    },
    {
      id: "nc-006",
      name: "Microsoft Teams - SRE",
      type: "msteams",
      description: "Microsoft Teams connector for SRE team alerts",
      enabled: false,
      configuration: {
        webhook_url:
          "https://outlook.office.com/webhook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        card_title: "TelemetryFlow Alert",
        include_actions: true,
      },
      labels: ["sre", "staging"],
      createdAt: now - 45 * 24 * 60 * 60 * 1000,
      updatedAt: now - 45 * 24 * 60 * 60 * 1000,
      createdBy: "user-002",
      lastTestedAt: now - 44 * 24 * 60 * 60 * 1000,
      lastTestResult: "failure",
      lastNotifiedAt: null,
      notificationCount: 0,
      failureCount: 0,
    },
    {
      id: "nc-007",
      name: "OpsGenie Escalation",
      type: "opsgenie",
      description: "OpsGenie integration for P1/P2 incident escalation",
      enabled: true,
      configuration: {
        api_key: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        team: "platform-engineering",
        priority_mapping: {
          critical: "P1",
          warning: "P2",
          info: "P3",
        },
        tags: ["telemetryflow", "production"],
      },
      labels: ["critical", "oncall", "escalation"],
      createdAt: now - 75 * 24 * 60 * 60 * 1000,
      updatedAt: now - 8 * 24 * 60 * 60 * 1000,
      createdBy: "user-001",
      lastTestedAt: now - 7 * 24 * 60 * 60 * 1000,
      lastTestResult: "success",
      lastNotifiedAt: now - 18 * 60 * 60 * 1000,
      notificationCount: 234,
      failureCount: 2,
    },
    {
      id: "nc-008",
      name: "Zoom Team Chat - Platform",
      type: "zoom",
      description: "Zoom Team Chat notifications for platform engineering channel",
      enabled: true,
      configuration: {
        webhook_url:
          "https://inbots.zoom.us/incoming/hook/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        channel_id: "platform-engineering",
        bot_name: "TelemetryFlow",
        verification_token: "xxxxxxxxxxxxxxxx",
      },
      labels: ["platform", "team-chat"],
      createdAt: now - 25 * 24 * 60 * 60 * 1000,
      updatedAt: now - 5 * 24 * 60 * 60 * 1000,
      createdBy: "user-002",
      lastTestedAt: now - 3 * 24 * 60 * 60 * 1000,
      lastTestResult: "success",
      lastNotifiedAt: now - 8 * 60 * 60 * 1000,
      notificationCount: 98,
      failureCount: 1,
    },
    {
      id: "nc-009",
      name: "Telegram DevOps Group",
      type: "telegram",
      description: "Telegram bot notifications to the DevOps group chat",
      enabled: true,
      configuration: {
        bot_token: "0000000000:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        chat_id: "-1001234567890",
        parse_mode: "HTML",
        disable_notification: false,
      },
      labels: ["devops", "mobile"],
      createdAt: now - 30 * 24 * 60 * 60 * 1000,
      updatedAt: now - 2 * 24 * 60 * 60 * 1000,
      createdBy: "user-003",
      lastTestedAt: now - 1 * 24 * 60 * 60 * 1000,
      lastTestResult: "success",
      lastNotifiedAt: now - 3 * 60 * 60 * 1000,
      notificationCount: 189,
      failureCount: 0,
    },
  ];
}

// ==================== MOCK PERSISTENCE ====================

const MOCK_CHANNELS_KEY = "tfo-viz-mock-notification-channels";

function loadMockChannels(): NotificationChannel[] | null {
  try {
    const saved = localStorage.getItem(MOCK_CHANNELS_KEY);
    if (saved) return JSON.parse(saved) as NotificationChannel[];
  } catch {
    /* ignore */
  }
  return null;
}

function saveMockChannels(channels: NotificationChannel[]) {
  try {
    localStorage.setItem(MOCK_CHANNELS_KEY, JSON.stringify(channels));
  } catch {
    /* ignore */
  }
}

function getMockChannels(): NotificationChannel[] {
  let channels = loadMockChannels();
  if (!channels || channels.length === 0) {
    channels = generateMockChannels();
    saveMockChannels(channels);
  }
  return channels;
}

// ==================== API CLIENT ====================

export const notificationChannelsApi = {
  /**
   * List all notification channels with optional filtering
   */
  async listChannels(
    query: ChannelListQuery = {},
  ): Promise<NotificationChannel[]> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      let channels = getMockChannels();

      if (query.type) {
        channels = channels.filter((c) => c.type === query.type);
      }
      if (query.enabled !== undefined) {
        channels = channels.filter((c) => c.enabled === query.enabled);
      }
      if (query.search) {
        const search = query.search.toLowerCase();
        channels = channels.filter(
          (c) =>
            c.name.toLowerCase().includes(search) ||
            c.description.toLowerCase().includes(search) ||
            c.type.toLowerCase().includes(search),
        );
      }

      return channels;
    }

    // iamClient.get() already unwraps response.data — result is the array directly
    const result = await iamClient.get<any>(
      NOTIFICATION_CHANNEL_ENDPOINTS.LIST,
      {
        params: {
          type: query.type,
          enabled: query.enabled,
          search: query.search,
        },
      },
    );
    return Array.isArray(result) ? result : (result?.items || result?.data || []);
  },

  /**
   * Create a new notification channel
   */
  async createChannel(
    data: CreateNotificationChannelRequest,
  ): Promise<NotificationChannel> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const now = Date.now();
      const newChannel: NotificationChannel = {
        id: `nc-${now}`,
        name: data.name,
        type: data.type,
        description: data.description || "",
        enabled: data.enabled !== undefined ? data.enabled : true,
        configuration: data.config,
        labels: [],
        createdAt: now,
        updatedAt: now,
        createdBy: "user-001",
        lastTestedAt: null,
        lastTestResult: null,
        lastNotifiedAt: null,
        notificationCount: 0,
        failureCount: 0,
      };

      const channels = getMockChannels();
      channels.unshift(newChannel);
      saveMockChannels(channels);

      return newChannel;
    }

    const result = await iamClient.post<any>(
      NOTIFICATION_CHANNEL_ENDPOINTS.CREATE,
      data,
    );
    return result?.data || result;
  },

  /**
   * Get a single notification channel by ID
   */
  async getChannel(id: string): Promise<NotificationChannel> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const channels = getMockChannels();
      return channels.find((c) => c.id === id) || { ...channels[0], id };
    }

    const result = await iamClient.get<any>(
      NOTIFICATION_CHANNEL_ENDPOINTS.SINGLE(id),
    );
    return result?.data || result;
  },

  /**
   * Update a notification channel
   */
  async updateChannel(
    id: string,
    data: UpdateNotificationChannelRequest,
  ): Promise<NotificationChannel> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const channels = getMockChannels();
      const idx = channels.findIndex((c) => c.id === id);
      const channel = idx >= 0 ? channels[idx] : channels[0];

      const updated: NotificationChannel = {
        ...channel,
        id,
        name: data.name || channel.name,
        description:
          data.description !== undefined
            ? data.description
            : channel.description,
        enabled: data.enabled !== undefined ? data.enabled : channel.enabled,
        configuration: data.config || channel.configuration,
        labels: channel.labels,
        updatedAt: Date.now(),
      };

      if (idx >= 0) {
        channels[idx] = updated;
        saveMockChannels(channels);
      }

      return updated;
    }

    const result = await iamClient.patch<any>(
      NOTIFICATION_CHANNEL_ENDPOINTS.SINGLE(id),
      data,
    );
    return result?.data || result;
  },

  /**
   * Delete a notification channel
   */
  async deleteChannel(id: string): Promise<void> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const channels = getMockChannels();
      const filtered = channels.filter((c) => c.id !== id);
      saveMockChannels(filtered);
      return;
    }

    await iamClient.delete(NOTIFICATION_CHANNEL_ENDPOINTS.SINGLE(id));
  },

  /**
   * Send a test notification to a channel
   * Validates connectivity and configuration
   */
  async testChannel(id: string): Promise<TestChannelResponse> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const channels = getMockChannels();
      const channel = channels.find((c) => c.id === id);
      const success = channel ? channel.enabled : false;

      // Update last tested info
      if (channel) {
        const idx = channels.findIndex((c) => c.id === id);
        if (idx >= 0) {
          channels[idx] = {
            ...channel,
            lastTestedAt: Date.now(),
            lastTestResult: success ? "success" : "failure",
          };
          saveMockChannels(channels);
        }
      }

      return {
        success,
        message: success
          ? "Test notification sent successfully"
          : "Failed to send test notification: channel is disabled",
        responseTime: Math.floor(Math.random() * 500) + 200,
        testedAt: Date.now(),
        details: success
          ? { delivered: true, recipient_count: 1 }
          : { error: "Channel disabled" },
      };
    }

    const result = await iamClient.post<any>(
      NOTIFICATION_CHANNEL_ENDPOINTS.TEST(id),
    );
    return result?.data || result;
  },

  /**
   * Get default channel IDs for the organization
   */
  async getDefaultChannels(): Promise<string[]> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      try {
        const saved = localStorage.getItem("tfo-viz-default-channel-ids");
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }

    const result = await iamClient.get<{ channelIds: string[] }>(
      NOTIFICATION_CHANNEL_ENDPOINTS.DEFAULTS,
    );
    return result?.channelIds ?? [];
  },

  /**
   * Set default channel IDs for the organization
   */
  async setDefaultChannels(channelIds: string[]): Promise<void> {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      try {
        localStorage.setItem("tfo-viz-default-channel-ids", JSON.stringify(channelIds));
      } catch { /* ignore */ }
      return;
    }

    await iamClient.put(NOTIFICATION_CHANNEL_ENDPOINTS.DEFAULTS, { channelIds });
  },
};

export default notificationChannelsApi;
