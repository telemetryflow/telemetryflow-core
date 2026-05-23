/**
 * Report Types
 * Frontend types for Reporting module
 *
 * Matches backend DTOs from reporting module
 */

// ==================== ENUMS ====================

export type ReportType =
  | "utilization"
  | "reliability"
  | "alerting"
  | "uptime"
  | "user_management"
  | "observability"
  | "executive"
  | "comprehensive";
export type ReportSchedule = "daily" | "weekly" | "monthly" | "on_demand";
export type ReportStatus = "pending" | "running" | "completed" | "failed";

// ==================== CORE TYPES ====================

export interface ReportSectionConfig {
  type:
    | "utilization"
    | "reliability"
    | "alerting"
    | "uptime"
    | "user_management";
  enabled: boolean;
  title: string;
}

export interface ScheduleConfig {
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour: number;
  timezone: string;
}

/**
 * Report definition entity
 */
export interface ReportDefinition {
  id: string;
  organizationId: string;
  workspaceId: string | null;
  name: string;
  description: string | null;
  type: ReportType;
  sections: ReportSectionConfig[];
  schedule: ReportSchedule;
  scheduleConfig: ScheduleConfig;
  format: string;
  recipients: string[];
  notificationChannelIds: string[];
  filters: Record<string, unknown>;
  enabled: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Report execution entity
 */
export interface ReportExecution {
  id: string;
  reportDefinitionId: string;
  reportName: string;
  organizationId: string;
  status: ReportStatus;
  periodStart: string;
  periodEnd: string;
  result: ReportResult | null;
  summary: ReportSummary | null;
  error: string | null;
  executionTimeMs: number | null;
  triggeredBy: "scheduler" | "manual";
  triggeredByUser: string | null;
  createdAt: number;
}

/**
 * Report result data
 */
export interface ReportResult {
  sections: ReportSectionData[];
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
}

/**
 * Report summary for quick overview
 */
export interface ReportSummary {
  totalMetrics: number;
  highlightValue: number;
  highlightLabel: string;
  highlightUnit: string;
  status: "good" | "warning" | "critical";
}

/**
 * Report section data with metrics and charts
 */
export interface ReportSectionData {
  type: string;
  title: string;
  metrics: ReportMetric[];
  charts: ReportChartData[];
  tables?: ReportTableData[];
}

export interface ReportMetric {
  label: string;
  value: number;
  unit: string;
  trend?: number;
  status?: "good" | "warning" | "critical";
}

export interface ReportChartData {
  title: string;
  type: "timeseries" | "bar" | "gauge";
  /** Y-axis unit label, e.g. "%", "ms", "MB", "users", "count" */
  unit?: string;
  /** Short description shown in Widget Properties panel */
  description?: string;
  /** Signal domain, e.g. "infrastructure", "reliability", "alerting" */
  signal?: string;
  /** TFQL query string shown in the Queries panel */
  query?: string;
  series: Array<{
    name: string;
    data: Array<[number, number]>;
    color?: string;
  }>;
}

export interface ReportTableData {
  title: string;
  columns: Array<{ key: string; title: string }>;
  rows: Array<Record<string, unknown>>;
}

/**
 * Report statistics for dashboard overview
 */
export interface ReportStats {
  totalDefinitions: number;
  activeSchedules: number;
  last24hExecutions: number;
  failedRate: number;
}

// ==================== BACKEND RESPONSE TYPES ====================

// Backend returns camelCase (NestJS default serialization)
export interface ReportDefinitionResponse {
  id: string;
  organizationId: string;
  workspaceId: string | null;
  name: string;
  description: string | null;
  type: ReportType;
  sections: Array<{
    type:
      | "utilization"
      | "reliability"
      | "alerting"
      | "uptime"
      | "user_management";
    enabled: boolean;
    title: string;
  }>;
  schedule: ReportSchedule;
  scheduleConfig: {
    dayOfWeek?: number;
    dayOfMonth?: number;
    hour: number;
    timezone: string;
  };
  format: string;
  recipients: string[];
  notificationChannelIds: string[];
  filters: Record<string, unknown>;
  enabled: boolean;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Backend returns camelCase (NestJS default serialization)
export interface ReportExecutionResponse {
  id: string;
  reportDefinitionId: string;
  reportName?: string;
  organizationId: string;
  status: ReportStatus;
  periodStart: string | Date;
  periodEnd: string | Date;
  result: ReportResult | null;
  summary: ReportSummary | null;
  error: string | null;
  executionTimeMs: number | null;
  triggeredBy: "scheduler" | "manual";
  triggeredByUser: string | null;
  createdAt: string | Date;
}

// ==================== TRANSFORM FUNCTIONS ====================

export function transformReportDefinition(
  response: ReportDefinitionResponse,
): ReportDefinition {
  return {
    id: response.id,
    organizationId: response.organizationId,
    workspaceId: response.workspaceId,
    name: response.name,
    description: response.description,
    type: response.type,
    sections: response.sections,
    schedule: response.schedule,
    scheduleConfig: {
      dayOfWeek: response.scheduleConfig?.dayOfWeek,
      dayOfMonth: response.scheduleConfig?.dayOfMonth,
      hour: response.scheduleConfig?.hour ?? 0,
      timezone: response.scheduleConfig?.timezone ?? "UTC",
    },
    format: response.format,
    recipients: response.recipients,
    notificationChannelIds: response.notificationChannelIds ?? [],
    filters: response.filters,
    enabled: response.enabled,
    createdBy: response.createdBy,
    createdAt: new Date(response.createdAt).getTime(),
    updatedAt: new Date(response.updatedAt).getTime(),
  };
}

export function transformReportExecution(
  response: ReportExecutionResponse,
): ReportExecution {
  return {
    id: response.id,
    reportDefinitionId: response.reportDefinitionId,
    reportName: response.reportName ?? "",
    organizationId: response.organizationId,
    status: response.status,
    periodStart:
      typeof response.periodStart === "string"
        ? response.periodStart
        : response.periodStart.toISOString(),
    periodEnd:
      typeof response.periodEnd === "string"
        ? response.periodEnd
        : response.periodEnd.toISOString(),
    result: response.result,
    summary: response.summary,
    error: response.error,
    executionTimeMs: response.executionTimeMs,
    triggeredBy: response.triggeredBy,
    triggeredByUser: response.triggeredByUser,
    createdAt: new Date(response.createdAt).getTime(),
  };
}

// ==================== REQUEST TYPES ====================

export interface CreateReportDefinitionRequest {
  name: string;
  description?: string;
  type: ReportType;
  sections: ReportSectionConfig[];
  schedule: ReportSchedule;
  scheduleConfig: ScheduleConfig;
  format?: string;
  recipients?: string[];
  notificationChannelIds?: string[];
  filters?: Record<string, unknown>;
  enabled?: boolean;
}

export interface UpdateReportDefinitionRequest {
  name?: string;
  description?: string;
  sections?: ReportSectionConfig[];
  schedule?: ReportSchedule;
  scheduleConfig?: ScheduleConfig;
  format?: string;
  recipients?: string[];
  notificationChannelIds?: string[];
  filters?: Record<string, unknown>;
  enabled?: boolean;
}

export interface ListExecutionsQuery {
  reportDefinitionId?: string;
  status?: ReportStatus;
  page?: number;
  pageSize?: number;
}

// ==================== UI HELPERS ====================

export const REPORT_TYPE_LABELS: Record<
  ReportType,
  { label: string; color: string }
> = {
  utilization: { label: "Utilization", color: "info" },
  reliability: { label: "Reliability", color: "success" },
  alerting: { label: "Alerting", color: "warning" },
  uptime: { label: "Uptime", color: "success" },
  user_management: { label: "User Management", color: "default" },
  observability: { label: "Observability", color: "info" },
  executive: { label: "Executive", color: "primary" },
  comprehensive: { label: "Comprehensive", color: "primary" },
};

export const REPORT_SCHEDULE_LABELS: Record<
  ReportSchedule,
  { label: string; color: string }
> = {
  daily: { label: "Daily", color: "info" },
  weekly: { label: "Weekly", color: "success" },
  monthly: { label: "Monthly", color: "warning" },
  on_demand: { label: "On Demand", color: "default" },
};

export const REPORT_STATUS_LABELS: Record<
  ReportStatus,
  { label: string; color: string }
> = {
  pending: { label: "Pending", color: "default" },
  running: { label: "Running", color: "info" },
  completed: { label: "Completed", color: "success" },
  failed: { label: "Failed", color: "error" },
};
