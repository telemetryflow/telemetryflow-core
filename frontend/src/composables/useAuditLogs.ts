/**
 * Audit logs composable with datatable support
 * TASK-08: Synchronize audit module with frontend
 *
 * Provides audit logs fetching with pagination, filtering, and NDataTable config
 */

import { computed, h, type ComputedRef } from "vue";
import { NTag, NText, NTime, NTooltip } from "naive-ui";
import {
  useModuleDatatable,
  type UseModuleDatatableOptions,
} from "./useModuleDatatable";
import type {
  AuditLog,
  AuditEventType,
  AuditResult,
  AuditLogQueryParams,
} from "@/types/audit";
import {
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
  getActionLabel,
  formatAuditUserName,
} from "@/types/audit";
import type {
  DatatableQueryParams,
  PaginatedResponse,
} from "@/types/datatable";
import { auditApi } from "@/api/audit";

// ==================== FILTER TYPES ====================

export interface AuditLogFilters {
  [key: string]: unknown;
  eventType?: AuditEventType;
  result?: AuditResult;
  userId?: string;
  userEmail?: string;
  action?: string;
  resource?: string;
  from?: string;
  to?: string;
  organizationId?: string;
}

// ==================== COLUMN DEFINITIONS ====================

/**
 * Get event type tag color for Naive UI
 */
function getEventTypeTagType(
  eventType: AuditEventType,
): "info" | "warning" | "success" | "default" {
  const colorMap: Record<string, "info" | "warning" | "success" | "default"> = {
    info: "info",
    warning: "warning",
    success: "success",
    default: "default",
  };
  return colorMap[AUDIT_EVENT_TYPES[eventType]?.color] || "default";
}

/**
 * Get result tag color for Naive UI
 */
function getResultTagType(
  result: AuditResult,
): "success" | "error" | "warning" {
  const colorMap: Record<string, "success" | "error" | "warning"> = {
    success: "success",
    error: "error",
    warning: "warning",
  };
  return colorMap[AUDIT_RESULTS[result]?.color] || "warning";
}

/**
 * Default columns for audit logs datatable
 */
export function getAuditLogColumns() {
  return [
    {
      title: "Timestamp",
      key: "timestamp",
      width: 180,
      sortable: true,
      render(row: AuditLog) {
        return h(NTime, {
          time: row.timestamp,
          format: "yyyy-MM-dd HH:mm:ss",
        });
      },
    },
    {
      title: "User",
      key: "userEmail",
      width: 200,
      ellipsis: {
        tooltip: true,
      },
      render(row: AuditLog) {
        const userName = formatAuditUserName(row);
        return h(
          NTooltip,
          { trigger: "hover" },
          {
            trigger: () => h(NText, null, { default: () => userName }),
            default: () => row.userEmail || userName,
          },
        );
      },
    },
    {
      title: "Event Type",
      key: "eventType",
      width: 130,
      filterOptions: Object.entries(AUDIT_EVENT_TYPES).map(([key, val]) => ({
        label: val.label,
        value: key,
      })),
      render(row: AuditLog) {
        return h(
          NTag,
          {
            type: getEventTypeTagType(row.eventType),
            size: "small",
            round: true,
          },
          {
            default: () =>
              AUDIT_EVENT_TYPES[row.eventType]?.label || row.eventType,
          },
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: 150,
      render(row: AuditLog) {
        return h(
          NText,
          { code: true },
          { default: () => getActionLabel(row.action) },
        );
      },
    },
    {
      title: "Resource",
      key: "resource",
      width: 120,
      render(row: AuditLog) {
        return h(NText, null, { default: () => row.resource || "-" });
      },
    },
    {
      title: "Result",
      key: "result",
      width: 100,
      filterOptions: Object.entries(AUDIT_RESULTS).map(([key, val]) => ({
        label: val.label,
        value: key,
      })),
      render(row: AuditLog) {
        return h(
          NTag,
          {
            type: getResultTagType(row.result),
            size: "small",
          },
          { default: () => AUDIT_RESULTS[row.result]?.label || row.result },
        );
      },
    },
    {
      title: "IP Address",
      key: "ipAddress",
      width: 130,
      render(row: AuditLog) {
        return h(
          NText,
          { code: true },
          { default: () => row.ipAddress || "-" },
        );
      },
    },
    {
      title: "Duration",
      key: "durationMs",
      width: 100,
      sortable: true,
      render(row: AuditLog) {
        if (row.durationMs === undefined) return "-";
        return h(NText, null, { default: () => `${row.durationMs}ms` });
      },
    },
  ];
}

/**
 * Compact columns for embedded views
 */
export function getAuditLogCompactColumns() {
  return [
    {
      title: "Time",
      key: "timestamp",
      width: 150,
      render(row: AuditLog) {
        return h(NTime, {
          time: row.timestamp,
          format: "MM-dd HH:mm:ss",
        });
      },
    },
    {
      title: "User",
      key: "userEmail",
      width: 180,
      ellipsis: { tooltip: true },
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      render(row: AuditLog) {
        return h(NText, { code: true }, { default: () => row.action });
      },
    },
    {
      title: "Result",
      key: "result",
      width: 80,
      render(row: AuditLog) {
        return h(
          NTag,
          {
            type: getResultTagType(row.result),
            size: "small",
          },
          { default: () => row.result },
        );
      },
    },
  ];
}

// ==================== COMPOSABLE ====================

export interface UseAuditLogsOptions extends Partial<
  UseModuleDatatableOptions<AuditLog, AuditLogFilters>
> {
  /** Initial event type filter */
  eventType?: AuditEventType;
  /** Initial result filter */
  result?: AuditResult;
  /** Initial user filter */
  userId?: string;
  /** Initial organization filter */
  organizationId?: string;
}

export interface UseAuditLogsReturn {
  // From useModuleDatatable
  data: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["data"];
  loading: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["loading"];
  error: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["error"];
  page: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["page"];
  pageSize: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["pageSize"];
  total: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["total"];
  totalPages: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["totalPages"];
  filters: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["filters"];
  sortBy: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["sortBy"];
  sortOrder: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["sortOrder"];
  hasData: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["hasData"];
  isEmpty: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["isEmpty"];
  paginationConfig: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["paginationConfig"];
  fetch: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["fetch"];
  refresh: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["refresh"];
  setPage: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["setPage"];
  setPageSize: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["setPageSize"];
  setFilters: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["setFilters"];
  resetFilters: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["resetFilters"];
  setSort: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["setSort"];
  clearSort: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["clearSort"];
  clear: ReturnType<
    typeof useModuleDatatable<AuditLog, AuditLogFilters>
  >["clear"];

  // Audit-specific
  columns: ComputedRef<ReturnType<typeof getAuditLogColumns>>;
  compactColumns: ComputedRef<ReturnType<typeof getAuditLogCompactColumns>>;

  // Filter helpers
  setEventTypeFilter: (eventType?: AuditEventType) => void;
  setResultFilter: (result?: AuditResult) => void;
  setUserFilter: (userId?: string) => void;
  setDateRangeFilter: (from?: string, to?: string) => void;
}

/**
 * Audit logs composable with datatable support
 */
export function useAuditLogs(
  options: UseAuditLogsOptions = {},
): UseAuditLogsReturn {
  const {
    eventType,
    result,
    userId,
    organizationId,
    defaultPageSize = 20,
    fetchOnMount = true,
    ...restOptions
  } = options;

  // Build default filters
  const defaultFilters: AuditLogFilters = {
    eventType,
    result,
    userId,
    organizationId,
  };

  // Fetch function that transforms to API params
  async function fetchAuditLogs(
    params: DatatableQueryParams<AuditLogFilters>,
  ): Promise<PaginatedResponse<AuditLog>> {
    const apiParams: AuditLogQueryParams = {
      page: params.page,
      pageSize: params.pageSize,
      eventType: params.filters?.eventType,
      result: params.filters?.result,
      userId: params.filters?.userId,
      userEmail: params.filters?.userEmail,
      action: params.filters?.action,
      resource: params.filters?.resource,
      from: params.filters?.from,
      to: params.filters?.to,
      organizationId: params.filters?.organizationId,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };

    const response = await auditApi.listAuditLogs(apiParams);

    return {
      data: response.data,
      total: response.total,
      page: response.page,
      pageSize: response.pageSize,
      totalPages: response.totalPages,
      hasNext: response.hasNext,
      hasPrevious: response.hasPrevious,
    };
  }

  // Use base datatable composable
  const datatable = useModuleDatatable<AuditLog, AuditLogFilters>({
    fetchFn: fetchAuditLogs,
    defaultPageSize,
    defaultFilters,
    fetchOnMount,
    ...restOptions,
  });

  // Columns
  const columns = computed(() => getAuditLogColumns());
  const compactColumns = computed(() => getAuditLogCompactColumns());

  // Filter helpers
  function setEventTypeFilter(type?: AuditEventType) {
    datatable.setFilters({ eventType: type });
  }

  function setResultFilter(res?: AuditResult) {
    datatable.setFilters({ result: res });
  }

  function setUserFilter(user?: string) {
    datatable.setFilters({ userId: user });
  }

  function setDateRangeFilter(from?: string, to?: string) {
    datatable.setFilters({ from, to });
  }

  return {
    ...datatable,
    columns,
    compactColumns,
    setEventTypeFilter,
    setResultFilter,
    setUserFilter,
    setDateRangeFilter,
  };
}

/**
 * Recent login events composable (simplified for dashboard)
 */
export function useRecentLogins(limit: number = 10) {
  const datatable = useModuleDatatable<AuditLog, AuditLogFilters>({
    fetchFn: async () => {
      const logs = await auditApi.getUserLoginHistory("", limit);
      return {
        data: logs,
        total: logs.length,
        page: 1,
        pageSize: limit,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };
    },
    defaultPageSize: limit,
    fetchOnMount: true,
  });

  return {
    logins: datatable.data,
    loading: datatable.loading,
    error: datatable.error,
    refresh: datatable.refresh,
  };
}

/**
 * Failed login attempts composable (for security dashboard)
 */
export function useFailedLogins(
  options: { from?: string; to?: string; limit?: number } = {},
) {
  const datatable = useModuleDatatable<AuditLog, AuditLogFilters>({
    fetchFn: async () => {
      const logs = await auditApi.getFailedLogins(options);
      return {
        data: logs,
        total: logs.length,
        page: 1,
        pageSize: options.limit || 50,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };
    },
    defaultPageSize: options.limit || 50,
    fetchOnMount: true,
  });

  return {
    failedLogins: datatable.data,
    loading: datatable.loading,
    error: datatable.error,
    refresh: datatable.refresh,
    count: computed(() => datatable.data.value.length),
  };
}

/**
 * Security events composable (denied access)
 */
export function useSecurityEvents(
  options: { from?: string; to?: string; limit?: number } = {},
) {
  const datatable = useModuleDatatable<AuditLog, AuditLogFilters>({
    fetchFn: async () => {
      const logs = await auditApi.getSecurityEvents(options);
      return {
        data: logs,
        total: logs.length,
        page: 1,
        pageSize: options.limit || 50,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };
    },
    defaultPageSize: options.limit || 50,
    fetchOnMount: true,
  });

  return {
    securityEvents: datatable.data,
    loading: datatable.loading,
    error: datatable.error,
    refresh: datatable.refresh,
    count: computed(() => datatable.data.value.length),
  };
}
