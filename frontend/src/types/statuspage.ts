/**
 * Status Page Types
 * TASK-10: Frontend types for Status Page module
 *
 * Matches backend DTOs from monitoring/status-page module
 */

// ==================== ENUMS ====================

export type OverallStatus =
  | "operational"
  | "degraded_performance"
  | "partial_outage"
  | "major_outage"
  | "maintenance"
  | "unknown";

export const OVERALL_STATUS: Record<OverallStatus, { label: string; color: string; icon: string }> = {
  operational: { label: "Operational", color: "success", icon: "carbon:checkmark-filled" },
  degraded_performance: { label: "Degraded Performance", color: "warning", icon: "carbon:warning-filled" },
  partial_outage: { label: "Partial Outage", color: "warning", icon: "carbon:warning-alt-filled" },
  major_outage: { label: "Major Outage", color: "error", icon: "carbon:close-filled" },
  maintenance: { label: "Maintenance", color: "info", icon: "carbon:tools" },
  unknown: { label: "Unknown", color: "default", icon: "carbon:help" },
};

export type IncidentImpact = "none" | "minor" | "major" | "critical";

export const INCIDENT_IMPACT: Record<IncidentImpact, { label: string; color: string }> = {
  none: { label: "None", color: "default" },
  minor: { label: "Minor", color: "info" },
  major: { label: "Major", color: "warning" },
  critical: { label: "Critical", color: "error" },
};

export type IncidentStatus =
  | "investigating"
  | "identified"
  | "monitoring"
  | "resolved"
  | "scheduled"
  | "in_progress"
  | "completed";

export const INCIDENT_STATUS: Record<IncidentStatus, { label: string; color: string }> = {
  investigating: { label: "Investigating", color: "warning" },
  identified: { label: "Identified", color: "info" },
  monitoring: { label: "Monitoring", color: "info" },
  resolved: { label: "Resolved", color: "success" },
  scheduled: { label: "Scheduled", color: "default" },
  in_progress: { label: "In Progress", color: "warning" },
  completed: { label: "Completed", color: "success" },
};

export type NotificationType = "all" | "incidents_only" | "maintenance_only";

// ==================== CORE TYPES ====================

/**
 * Monitor display config within a status page
 */
export interface StatusPageMonitor {
  monitorId: string;
  displayName?: string;
  description?: string;
  displayOrder: number;
  groupName?: string;
  isVisible: boolean;
}

/**
 * Status page branding config
 */
export interface StatusPageBranding {
  logoUrl?: string;
  faviconUrl?: string;
  brandColor: string;
  customCss?: string;
  headerText?: string;
  footerText?: string;
  supportUrl?: string;
}

/**
 * Status page display config
 */
export interface StatusPageDisplay {
  showUptimePercentage: boolean;
  showResponseTime: boolean;
  showIncidentHistory: boolean;
  showMaintenanceSchedule: boolean;
  allowSubscriptions: boolean;
  showLegend: boolean;
  uptimeRanges: number[];
  historyDays: number;
  theme?: string;
  googleAnalyticsId?: string;
}

/**
 * Status page entity
 */
export interface StatusPage {
  id: string;
  title: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  overallStatus: OverallStatus;

  // Branding
  branding: StatusPageBranding;

  // Display config
  display: StatusPageDisplay;

  // Custom domain
  customDomain?: string;
  customDomainVerified: boolean;
  customDomainSsl: boolean;

  // Monitors
  monitors: StatusPageMonitor[];

  // Incidents
  activeIncidents?: number;

  // Organization
  organizationId: string;
  workspaceId?: string;
  createdBy: string;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

/**
 * Incident update entry
 */
export interface IncidentUpdate {
  id: string;
  status: IncidentStatus;
  message: string;
  createdBy: string;
  createdAt: number;
}

/**
 * Incident entity
 */
export interface Incident {
  id: string;
  statusPageId: string;
  title: string;
  impact: IncidentImpact;
  status: IncidentStatus;
  message?: string;
  affectedMonitorIds: string[];
  updates: IncidentUpdate[];

  // Scheduling
  isScheduledMaintenance: boolean;
  scheduledStartAt?: number;
  scheduledEndAt?: number;

  // Lifecycle
  startedAt: number;
  resolvedAt?: number;

  // Organization
  organizationId: string;
  createdBy: string;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

/**
 * Subscriber entity
 */
export type SubscriptionType = "email" | "webhook";

export interface Subscriber {
  id: string;
  statusPageId: string;
  email?: string;
  webhookUrl?: string;
  subscriptionType: SubscriptionType;
  isConfirmed: boolean;
  notificationType: NotificationType;
  monitorIds?: string[];
  confirmedAt?: number;
  lastNotifiedAt?: number;
  organizationId: string;
  createdAt: number;
  updatedAt: number;
}

// ==================== BACKEND RESPONSE TYPES ====================

export interface StatusPageResponse {
  id: string;
  title: string;
  slug: string;
  description?: string;
  is_public: boolean;
  overall_status: OverallStatus;
  logo_url?: string;
  favicon_url?: string;
  brand_color: string;
  custom_css?: string;
  header_text?: string;
  footer_text?: string;
  support_url?: string;
  show_uptime_percentage: boolean;
  show_response_time: boolean;
  show_incident_history: boolean;
  show_maintenance_schedule: boolean;
  allow_subscriptions: boolean;
  show_legend: boolean;
  uptime_ranges: number[];
  history_days: number;
  custom_domain?: string;
  custom_domain_verified: boolean;
  custom_domain_ssl: boolean;
  monitors: StatusPageMonitor[];
  active_incidents?: number;
  organization_id: string;
  workspace_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentResponse {
  id: string;
  status_page_id: string;
  title: string;
  impact: IncidentImpact;
  status: IncidentStatus;
  message?: string;
  affected_monitor_ids: string[];
  updates: Array<{
    id: string;
    status: IncidentStatus;
    message: string;
    created_by: string;
    created_at: string;
  }>;
  is_scheduled_maintenance: boolean;
  scheduled_start_at?: string;
  scheduled_end_at?: string;
  started_at: string;
  resolved_at?: string;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriberResponse {
  id: string;
  status_page_id: string;
  email?: string;
  webhook_url?: string;
  subscription_type: SubscriptionType;
  is_confirmed: boolean;
  notification_type: NotificationType;
  monitor_ids?: string[];
  confirmed_at?: string | null;
  last_notified_at?: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

// ==================== TRANSFORM FUNCTIONS ====================

export function transformStatusPage(response: StatusPageResponse): StatusPage {
  return {
    id: response.id,
    title: response.title,
    slug: response.slug,
    description: response.description,
    isPublic: response.is_public,
    overallStatus: response.overall_status,
    branding: {
      logoUrl: response.logo_url,
      faviconUrl: response.favicon_url,
      brandColor: response.brand_color || "#10B981",
      customCss: response.custom_css,
      headerText: response.header_text,
      footerText: response.footer_text,
      supportUrl: response.support_url,
    },
    display: {
      showUptimePercentage: response.show_uptime_percentage,
      showResponseTime: response.show_response_time,
      showIncidentHistory: response.show_incident_history,
      showMaintenanceSchedule: response.show_maintenance_schedule,
      allowSubscriptions: response.allow_subscriptions,
      showLegend: response.show_legend,
      uptimeRanges: response.uptime_ranges || [24, 7, 30, 90],
      historyDays: response.history_days || 90,
    },
    customDomain: response.custom_domain,
    customDomainVerified: response.custom_domain_verified,
    customDomainSsl: response.custom_domain_ssl,
    monitors: response.monitors || [],
    activeIncidents: response.active_incidents || 0,
    organizationId: response.organization_id,
    workspaceId: response.workspace_id,
    createdBy: response.created_by,
    createdAt: new Date(response.created_at).getTime(),
    updatedAt: new Date(response.updated_at).getTime(),
  };
}

export function transformIncident(response: IncidentResponse): Incident {
  return {
    id: response.id,
    statusPageId: response.status_page_id,
    title: response.title,
    impact: response.impact,
    status: response.status,
    message: response.message,
    affectedMonitorIds: response.affected_monitor_ids || [],
    updates: (response.updates || []).map((u) => ({
      id: u.id,
      status: u.status,
      message: u.message,
      createdBy: u.created_by,
      createdAt: new Date(u.created_at).getTime(),
    })),
    isScheduledMaintenance: response.is_scheduled_maintenance,
    scheduledStartAt: response.scheduled_start_at
      ? new Date(response.scheduled_start_at).getTime()
      : undefined,
    scheduledEndAt: response.scheduled_end_at
      ? new Date(response.scheduled_end_at).getTime()
      : undefined,
    startedAt: new Date(response.started_at).getTime(),
    resolvedAt: response.resolved_at ? new Date(response.resolved_at).getTime() : undefined,
    organizationId: response.organization_id,
    createdBy: response.created_by,
    createdAt: new Date(response.created_at).getTime(),
    updatedAt: new Date(response.updated_at).getTime(),
  };
}

export function transformSubscriber(response: SubscriberResponse): Subscriber {
  return {
    id: response.id,
    statusPageId: response.status_page_id,
    email: response.email,
    webhookUrl: response.webhook_url,
    subscriptionType: response.subscription_type,
    isConfirmed: response.is_confirmed,
    notificationType: response.notification_type,
    monitorIds: response.monitor_ids,
    confirmedAt: response.confirmed_at
      ? new Date(response.confirmed_at).getTime()
      : undefined,
    lastNotifiedAt: response.last_notified_at
      ? new Date(response.last_notified_at).getTime()
      : undefined,
    organizationId: response.organization_id,
    createdAt: new Date(response.created_at).getTime(),
    updatedAt: new Date(response.updated_at).getTime(),
  };
}

// ==================== REQUEST TYPES ====================

export interface CreateStatusPageRequest {
  title: string;
  slug: string;
  description?: string;
  isPublic?: boolean;
  branding?: Partial<StatusPageBranding>;
  display?: Partial<StatusPageDisplay>;
  monitors?: StatusPageMonitor[];
}

export interface UpdateStatusPageRequest {
  title?: string;
  slug?: string;
  description?: string;
  isPublic?: boolean;
  branding?: Partial<StatusPageBranding>;
  display?: Partial<StatusPageDisplay>;
  monitors?: StatusPageMonitor[];
}

export interface AddMonitorRequest {
  monitorId: string;
  displayName?: string;
  description?: string;
  displayOrder?: number;
  groupName?: string;
  isVisible?: boolean;
}

export interface CreateIncidentRequest {
  title: string;
  impact: IncidentImpact;
  message?: string;
  affectedMonitorIds?: string[];
  isScheduledMaintenance?: boolean;
  scheduledStartAt?: string;
  scheduledEndAt?: string;
}

export interface UpdateIncidentRequest {
  title?: string;
  impact?: IncidentImpact;
  message?: string;
}

export interface IncidentUpdateRequest {
  status: IncidentStatus;
  message: string;
}

export interface ListStatusPagesQuery {
  page?: number;
  pageSize?: number;
}

export interface SubscribeRequest {
  email?: string;
  webhook_url?: string;
  subscription_type?: SubscriptionType;
  notificationType?: NotificationType;
  monitorIds?: string[];
  recaptcha_token?: string;
}

export interface ListIncidentsQuery {
  status?: IncidentStatus;
  limit?: number;
}

// ==================== RESPONSE TYPES ====================

export interface PaginatedStatusPages {
  data: StatusPage[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ==================== UI HELPERS ====================

/**
 * Get status page public URL
 */
export function getStatusPageUrl(page: StatusPage): string {
  if (page.customDomain && page.customDomainVerified) {
    const protocol = page.customDomainSsl ? "https" : "http";
    return `${protocol}://${page.customDomain}`;
  }
  return `/status/${page.slug}`;
}

/**
 * Check if incident is active
 */
export function isIncidentActive(incident: Incident): boolean {
  return ["investigating", "identified", "monitoring", "in_progress"].includes(incident.status);
}

/**
 * Check if incident is maintenance
 */
export function isMaintenanceIncident(incident: Incident): boolean {
  return incident.isScheduledMaintenance;
}
