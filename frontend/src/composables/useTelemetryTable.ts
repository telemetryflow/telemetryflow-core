/**
 * useTelemetryTable — Reusable composable for paginated telemetry datatables.
 *
 * Bridges: backend TelemetryTableService → useModuleDatatable → useDataTableFromRegistry → NDataTable
 *
 * Supports all three signal types (metrics, logs, traces) from ClickHouse,
 * and can also wrap any generic API endpoint for PostgreSQL-backed tables.
 *
 * Usage (ClickHouse signal):
 *   const table = useTelemetryTable({ signal: "logs", datatableId: "LOG30001" });
 *   <NDataTable :columns="table.columns" :data="table.data" :pagination="table.paginationConfig" :loading="table.loading" />
 *
 * Usage (generic API):
 *   const table = useTelemetryTable({ fetchFn: myApiFn, datatableId: "IAM30001" });
 *   <NDataTable :columns="table.columns" :data="table.data" :pagination="table.paginationConfig" :loading="table.loading" />
 */

import { computed, watch, type Ref, type ComputedRef } from "vue";
import { collectorClient } from "@/api/collector";
import { COLLECTOR_ENDPOINTS } from "@/config/collector";
import { config } from "@/config";
import { mockTableResponse } from "./useTelemetryTable.mock";
import { useModuleDatatable, type UseModuleDatatableReturn } from "./useModuleDatatable";
import {
  useDataTableFromRegistry,
  type NDataTableColumn,
  type ColumnRenderOverrides,
  type DataTableFromRegistryResult,
} from "./useDataTableFromRegistry";
import type { PaginatedResponse, DatatableQueryParams } from "@/types/datatable";
import { useAppStore } from "@/store";

// ─── Types ──────────────────────────────────────────────────────────────────────

export type TelemetrySignal = "metrics" | "logs" | "traces";

export interface TelemetryTableFilters extends Record<string, unknown> {
  /** Text search query (logs) */
  query?: string;
  /** Filter by metric name (metrics) */
  metricName?: string;
  /** Filter by service name (all signals) */
  serviceName?: string;
  /** Filter by severity (logs): comma-separated */
  severity?: string;
  /** Filter by trace ID (logs, traces) */
  traceId?: string;
  /** Filter by span name (traces) */
  spanName?: string;
  /** Filter by status code (traces) */
  statusCode?: string;
  /** Min duration in ms (traces) */
  minDurationMs?: number;
  /** Max duration in ms (traces) */
  maxDurationMs?: number;
}

export interface UseTelemetryTableOptions {
  /** Telemetry signal type — routes to the correct backend /table endpoint */
  signal?: TelemetrySignal;
  /** Datatable registry ID for column definitions (e.g., "LOG30001") */
  datatableId?: string;
  /** Column render overrides for the registry columns */
  renderOverrides?: ColumnRenderOverrides;
  /** Custom fetch function (for PostgreSQL/generic APIs) — overrides signal routing */
  fetchFn?: (params: DatatableQueryParams<TelemetryTableFilters>) => Promise<PaginatedResponse<any> | unknown>;
  /** Default page size */
  defaultPageSize?: number;
  /** Default filters */
  defaultFilters?: TelemetryTableFilters;
  /** Whether to fetch on mount (default: true) */
  fetchOnMount?: boolean;
  /** Whether to sync with global time range (default: true for signals) */
  syncTimeRange?: boolean;
}

export interface UseTelemetryTableReturn<T = Record<string, unknown>>
  extends UseModuleDatatableReturn<T, TelemetryTableFilters> {
  /** Column definitions from registry (empty if no datatableId) */
  columns: NDataTableColumn[];
  /** Full registry result (null if no datatableId) */
  registry: DataTableFromRegistryResult | null;
  /** Signal type (null if using custom fetchFn) */
  signal: TelemetrySignal | null;
}

// ─── Signal → Endpoint Map ──────────────────────────────────────────────────────

const SIGNAL_TABLE_ENDPOINTS: Record<TelemetrySignal, string> = {
  metrics: COLLECTOR_ENDPOINTS.METRICS_TABLE,
  logs: COLLECTOR_ENDPOINTS.LOGS_TABLE,
  traces: COLLECTOR_ENDPOINTS.TRACES_TABLE,
};

// ─── Composable ─────────────────────────────────────────────────────────────────

export function useTelemetryTable<T = Record<string, unknown>>(
  options: UseTelemetryTableOptions = {},
): UseTelemetryTableReturn<T> {
  const {
    signal = null,
    datatableId,
    renderOverrides,
    defaultPageSize = 20,
    defaultFilters = {} as TelemetryTableFilters,
    fetchOnMount = true,
    syncTimeRange = !!signal,
  } = options;

  const appStore = useAppStore();

  // ─── Registry columns ──────────────────────────────────────────────────
  let registry: DataTableFromRegistryResult | null = null;
  let columns: NDataTableColumn[] = [];

  if (datatableId) {
    try {
      registry = useDataTableFromRegistry(datatableId, renderOverrides);
      columns = registry.columns;
    } catch (e) {
      console.warn(`[useTelemetryTable] Registry lookup failed for "${datatableId}":`, e);
    }
  }

  // ─── Build fetch function ──────────────────────────────────────────────
  const fetchFn = options.fetchFn || buildSignalFetchFn(signal);

  // ─── Datatable composable ──────────────────────────────────────────────
  const datatable = useModuleDatatable<T, TelemetryTableFilters>({
    fetchFn,
    defaultPageSize,
    defaultFilters,
    fetchOnMount,
  });

  // ─── Sync with global time range ──────────────────────────────────────
  if (syncTimeRange) {
    const globalTimeRange = computed(() => appStore.globalTimeRange);
    watch(globalTimeRange, () => {
      datatable.setPage(1);
    }, { deep: true });
  }

  return {
    ...datatable,
    columns,
    registry,
    signal,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function buildSignalFetchFn(
  signal: TelemetrySignal | null,
): (params: DatatableQueryParams<TelemetryTableFilters>) => Promise<PaginatedResponse<any> | unknown> {
  if (!signal) {
    return async () => ({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 0, hasNext: false, hasPrevious: false });
  }

  const endpoint = SIGNAL_TABLE_ENDPOINTS[signal];

  return async (params: DatatableQueryParams<TelemetryTableFilters>) => {
    if (config.useMock) {
      return mockTableResponse(signal, params);
    }

    const qs = new URLSearchParams();
    qs.append("page", String(params.page || 1));
    qs.append("pageSize", String(params.pageSize || 20));
    if (params.sortBy) qs.append("sortBy", params.sortBy);
    if (params.sortOrder) qs.append("sortOrder", params.sortOrder);

    // Time range from global store
    const appStore = useAppStore();
    const tr = appStore.globalTimeRange;
    if (tr?.start) qs.append("from", String(tr.start));
    if (tr?.end) qs.append("to", String(tr.end));

    // Signal-specific filters
    const filters = params.filters || {};
    if (filters.query) qs.append("query", filters.query);
    if (filters.metricName) qs.append("metricName", filters.metricName);
    if (filters.serviceName) qs.append("serviceName", filters.serviceName);
    if (filters.severity) qs.append("severity", filters.severity);
    if (filters.traceId) qs.append("traceId", filters.traceId);
    if (filters.spanName) qs.append("spanName", filters.spanName);
    if (filters.statusCode) qs.append("statusCode", filters.statusCode);
    if (filters.minDurationMs) qs.append("minDurationMs", String(filters.minDurationMs));
    if (filters.maxDurationMs) qs.append("maxDurationMs", String(filters.maxDurationMs));

    const response = await collectorClient.get<any>(`${endpoint}?${qs.toString()}`);
    const payload = response.data;

    // Backend returns { status, data, total, page, pageSize, totalPages, hasNext, hasPrevious }
    return {
      data: payload?.data || [],
      total: payload?.total ?? 0,
      page: payload?.page ?? params.page ?? 1,
      pageSize: payload?.pageSize ?? params.pageSize ?? 20,
      totalPages: payload?.totalPages ?? 0,
      hasNext: payload?.hasNext ?? false,
      hasPrevious: payload?.hasPrevious ?? false,
    } as PaginatedResponse<any>;
  };
}

