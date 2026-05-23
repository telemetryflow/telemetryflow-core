/**
 * Alerts Helpers Export
 */

// Generator
export {
  generateAlertRule,
  generateAlert,
  generateActiveAlert,
  generateIncident,
  generateMockAlertRules,
  generateMockAlerts,
  generateMockActiveAlerts,
  generateMockIncidents,
} from "./generator";
export type { AlertGeneratorConfig } from "./generator";

// Fetcher
export {
  fetchAlertRules,
  fetchAlertRule,
  fetchActiveAlerts,
  fetchAlertHistory,
  fetchIncidents,
  fetchIncident,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  toggleAlertRule,
  acknowledgeAlert,
  resolveAlert,
  fetchAlertStats,
} from "./fetcher";

// Rules utilities
export {
  PRESET_ALERT_RULES,
  createMetricAlertRule,
  createLogAlertRule,
  createTraceAlertRule,
  symbolToOperator,
  evaluateCondition,
  getPresetRulesByCategory,
  templateToRule,
  validateAlertRule,
} from "./rules";

// Notification Templates
export {
  AlertState,
  ThemeColors,
  getThemeColor,
  getStatusEmoji,
  getSeverityEmoji,
  formatEmailNotification,
  formatSlackNotification,
  formatMSTeamsNotification,
  formatZoomNotification,
  formatTelegramNotification,
  formatOpsGenieNotification,
  formatPagerDutyNotification,
  formatWebhookNotification,
  formatNotificationByType,
  generatePreviewData,
  getTemplatePreview,
} from "./notification-templates";
export type {
  AlertStateType,
  AlertNotificationData,
  EmailNotificationPayload,
  SlackNotificationPayload,
  MSTeamsNotificationPayload,
  ZoomNotificationPayload,
  TelegramNotificationPayload,
  OpsGenieNotificationPayload,
  PagerDutyNotificationPayload,
  WebhookNotificationPayload,
} from "./notification-templates";

// Rules Library (awesome-prometheus-alerts based)
export * from "./rules-library";
