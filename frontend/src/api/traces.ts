/**
 * Traces API client
 */

import { collectorClient } from "./collector";
import { COLLECTOR_ENDPOINTS } from "@/config/collector";
import { config } from "@/config";
import { mockDataGenerator } from "@/services/mockDataGenerator";
import { mockTraceStats } from "@/mocks/api-stats";
import type {
  Trace,
  TraceQuery,
  TraceQueryResult,
  TraceSummary,
  ServiceOperation,
  ServiceDependency,
  Span,
  SpanKind,
  TraceHeatmapData,
  TraceLatencyStats,
  TraceErrorCause,
  TraceAttributeComparison,
  FlameGraphNode,
  TraceScatterPoint,
  ServiceWithCount,
  MonitorMetrics,
  OperationMetrics,
} from "@/types";

export interface TraceStatsResponse {
  totalTraces: number;
  errorCount: number;
  avgDurationMs: number;
  serviceCount: number;
}

export const tracesApi = {
  /**
   * Get traces overview stats (total traces, error count, avg duration)
   * Uses ClickHouse materialized views for efficient aggregation.
   */
  async getStats(
    start?: number,
    end?: number,
    filters?: {
      serviceName?: string;
      operationName?: string;
      statusCode?: string;
      minDuration?: number;
      maxDuration?: number;
    },
  ): Promise<TraceStatsResponse> {
    if (config.useMock) {
      return mockTraceStats(start, end);
    }

    const defaults: TraceStatsResponse = {
      totalTraces: 0,
      errorCount: 0,
      avgDurationMs: 0,
      serviceCount: 0,
    };

    try {
      const params = new URLSearchParams();
      if (start) params.append("from", String(start));
      if (end) params.append("to", String(end));
      if (filters?.serviceName) params.append("serviceName", filters.serviceName);
      if (filters?.operationName) params.append("operationName", filters.operationName);
      if (filters?.statusCode) params.append("statusCode", filters.statusCode);
      if (filters?.minDuration) params.append("minDuration", String(filters.minDuration));
      if (filters?.maxDuration) params.append("maxDuration", String(filters.maxDuration));
      const qs = params.toString();

      const response = await collectorClient.get<any>(
        `${COLLECTOR_ENDPOINTS.TRACES_STATS}${qs ? `?${qs}` : ""}`,
      );
      const payload = response.data;
      const result = payload?.data || payload || defaults;

      // Validate numeric fields to prevent NaN/undefined leaking into computeds
      return {
        totalTraces: Number(result.totalTraces) || 0,
        errorCount: Number(result.errorCount) || 0,
        avgDurationMs: Number(result.avgDurationMs) || 0,
        serviceCount: Number(result.serviceCount) || 0,
      };
    } catch {
      return defaults;
    }
  },

  /**
   * Query traces (raw spans)
   */
  async query(params: TraceQuery): Promise<TraceQueryResult> {
    if (config.useMock) {
      const summaries = mockDataGenerator.getTraceSummaries(
        params.start,
        params.end,
        params.limit || 50,
      );
      // Convert summaries to full traces for the response
      const traces: Trace[] = summaries.map((s) => {
        const trace = mockDataGenerator.generateTrace(s.startTime);
        return { ...trace, traceId: s.traceId };
      });
      return {
        status: "success",
        data: traces,
        total: traces.length,
      };
    }

    const response = await collectorClient.post<Trace[]>(
      COLLECTOR_ENDPOINTS.TRACES_QUERY,
      params,
    );
    return {
      status: response.status,
      data: response.data,
      total: (response as any).total || response.data.length,
      error: response.error,
    };
  },

  /**
   * Query trace summaries (grouped by traceId)
   * Uses the /summaries endpoint which returns rootServiceName, durationMs, etc.
   */
  async querySummaries(params: TraceQuery): Promise<{ status: string; data: TraceSummary[]; total: number }> {
    if (config.useMock) {
      const summaries = mockDataGenerator.getTraceSummaries(
        params.start,
        params.end,
        params.limit || 50,
      );
      return { status: "success", data: summaries, total: summaries.length };
    }

    const response = await collectorClient.post<any[]>(
      COLLECTOR_ENDPOINTS.TRACES_SUMMARIES,
      params,
    );
    const rawData = response.data || [];
    // Transform backend field names → frontend TraceSummary
    const summaries: TraceSummary[] = rawData.map((row: any) => ({
      traceId: row.traceId || "",
      rootService: row.rootServiceName || row.rootService || "unknown",
      rootOperation: row.rootSpanName || row.rootOperation || "unknown",
      startTime: typeof row.startTime === "string"
        ? new Date(row.startTime.replace(" ", "T") + (row.startTime.includes("Z") || row.startTime.includes("+") ? "" : "Z")).getTime()
        : Number(row.startTime) || 0,
      duration: Number(row.durationMs) || Number(row.duration) || 0,
      spanCount: Number(row.spanCount) || 0,
      errorCount: Number(row.errorCount) || 0,
      services: Array.isArray(row.services) ? row.services : [],
      hasLogs: Boolean(row.hasLogs),
    }));
    return {
      status: response.status || "success",
      data: summaries,
      total: (response as any).total || summaries.length,
    };
  },

  /**
   * Get trace by ID
   * Backend returns TraceSpan[] (raw ClickHouse spans); transform to Trace object.
   */
  async getById(traceId: string): Promise<Trace | null> {
    if (config.useMock) {
      const trace = mockDataGenerator.generateTrace();
      return { ...trace, traceId };
    }

    const response = await collectorClient.get<any[]>(
      `${COLLECTOR_ENDPOINTS.TRACES}/${traceId}`,
    );
    const rawSpans: any[] = response.data || [];
    if (rawSpans.length === 0) return null;

    // Transform backend TraceSpan → frontend Span
    // ClickHouse columns are snake_case; also handle camelCase fallbacks
    const spans: Span[] = rawSpans.map((s: any) => {
      const tsStr = typeof s.timestamp === "string" ? s.timestamp : "";
      const startMs = tsStr
        ? new Date(tsStr.replace(" ", "T") + (tsStr.includes("Z") || tsStr.includes("+") ? "" : "Z")).getTime()
        : Number(s.timestamp) || 0;
      const durMs = Number(s.durationMs)
        || (Number(s.duration_ns) / 1_000_000)
        || (Number(s.durationNs) / 1_000_000)
        || 0;
      return {
        traceId: s.trace_id || s.traceId || traceId,
        spanId: s.span_id || s.spanId || "",
        parentSpanId: s.parent_span_id || s.parentSpanId || undefined,
        name: s.span_name || s.spanName || s.name || "unknown",
        kind: (s.span_kind || s.spanKind || s.kind || "unspecified").toLowerCase() as any,
        startTime: startMs,
        endTime: startMs + durMs,
        duration: durMs,
        status: {
          code: (s.status_code || s.statusCode || s.status?.code || "unset").toLowerCase() as any,
          message: s.status_message || s.statusMessage || s.status?.message,
        },
        attributes: s.span_attributes || s.spanAttributes || s.attributes || {},
        events: Array.isArray(s.events) ? s.events : [],
        links: Array.isArray(s.links) ? s.links : [],
        resource: s.resource_attributes || s.resourceAttributes || s.resource || {},
        serviceName: s.service_name || s.serviceName || "unknown",
      };
    });

    // Sort by startTime to find root span
    spans.sort((a, b) => a.startTime - b.startTime);
    const rootSpan = spans.find((s) => !s.parentSpanId) || spans[0];
    const services = [...new Set(spans.map((s) => s.serviceName))];
    const errorCount = spans.filter((s) => s.status.code === "error").length;
    const minStart = Math.min(...spans.map((s) => s.startTime));
    const maxEnd = Math.max(...spans.map((s) => s.endTime));

    return {
      traceId,
      rootSpan,
      spans,
      services,
      duration: maxEnd - minStart,
      spanCount: spans.length,
      errorCount,
      startTime: minStart,
    };
  },

  /**
   * Get spans for a trace
   */
  async getSpans(traceId: string): Promise<Span[]> {
    if (config.useMock) {
      const trace = mockDataGenerator.generateTrace();
      return trace.spans.map((s) => ({ ...s, traceId }));
    }

    const response = await collectorClient.get<Span[]>(
      `${COLLECTOR_ENDPOINTS.TRACES}/${traceId}/spans`,
    );
    return response.data;
  },

  /**
   * Get recent traces
   */
  async getRecent(limit: number = 20): Promise<TraceSummary[]> {
    const now = Date.now();
    const result = await this.querySummaries({
      start: now - 3600000, // Last hour
      end: now,
      limit,
    });
    return result.data;
  },

  /**
   * Get services list
   */
  async getServices(): Promise<string[]> {
    if (config.useMock) {
      return mockDataGenerator.getServices();
    }

    const response = await collectorClient.get<string[]>(
      COLLECTOR_ENDPOINTS.TRACES_SERVICES,
    );
    return response.data;
  },

  /**
   * Get operations for a service
   */
  async getOperations(service: string): Promise<ServiceOperation[]> {
    if (config.useMock) {
      return mockDataGenerator.getServiceOperations(service);
    }

    const response = await collectorClient.get<any>(
      COLLECTOR_ENDPOINTS.TRACES_OPERATIONS,
      { params: { serviceName: service } },
    );
    // Backend returns string[] (span names); transform to ServiceOperation[]
    const rawData = response.data || [];
    const spanNames: string[] = Array.isArray(rawData) ? rawData : [];
    return spanNames.map((name) => ({
      service,
      operation: typeof name === "string" ? name : (name as any).operation || String(name),
      spanCount: 0,
      avgDuration: 0,
      errorRate: 0,
    }));
  },

  /**
   * Get service dependencies (for service map)
   */
  async getDependencies(
    start: number,
    end: number,
  ): Promise<ServiceDependency[]> {
    if (config.useMock) {
      return mockDataGenerator.getServiceDependencies();
    }

    const response = await collectorClient.get<ServiceDependency[]>(
      COLLECTOR_ENDPOINTS.TRACES_DEPENDENCIES,
      { params: { start, end } },
    );
    return response.data;
  },

  /**
   * Search traces by service and operation
   */
  async search(
    service?: string,
    operation?: string,
    start?: number,
    end?: number,
    limit: number = 20,
  ): Promise<TraceSummary[]> {
    const now = Date.now();
    const result = await this.querySummaries({
      service,
      operation,
      start: start || now - 3600000,
      end: end || now,
      limit,
    });
    return result.data;
  },

  /**
   * Get heatmap data for latency distribution
   */
  async getHeatmap(start: number, end: number): Promise<TraceHeatmapData[]> {
    if (config.useMock) {
      return mockDataGenerator.getTraceHeatmap(start, end);
    }

    const response = await collectorClient.get<TraceHeatmapData[]>(
      `${COLLECTOR_ENDPOINTS.TRACES}/heatmap`,
      { params: { start, end } },
    );
    return response.data;
  },

  /**
   * Get latency statistics by service/operation
   */
  async getLatencyStats(
    start: number,
    end: number,
  ): Promise<TraceLatencyStats[]> {
    if (config.useMock) {
      return mockDataGenerator.getTraceLatencyStats(start, end);
    }

    const response = await collectorClient.get<TraceLatencyStats[]>(
      `${COLLECTOR_ENDPOINTS.TRACES}/latency-stats`,
      { params: { start, end } },
    );
    return response.data;
  },

  /**
   * Get error causes analysis
   */
  async getErrorCauses(start: number, end: number): Promise<TraceErrorCause[]> {
    if (config.useMock) {
      return mockDataGenerator.getTraceErrorCauses(start, end);
    }

    const response = await collectorClient.get<TraceErrorCause[]>(
      `${COLLECTOR_ENDPOINTS.TRACES}/error-causes`,
      { params: { start, end } },
    );
    return response.data;
  },

  /**
   * Get flame graph data for latency explorer
   */
  async getFlameGraphData(
    start: number,
    end: number,
  ): Promise<FlameGraphNode[]> {
    if (config.useMock) {
      return mockDataGenerator.getFlameGraphData(start, end);
    }

    const response = await collectorClient.get<FlameGraphNode[]>(
      `${COLLECTOR_ENDPOINTS.TRACES}/flamegraph`,
      { params: { start, end } },
    );
    return response.data;
  },

  /**
   * Get attribute comparisons
   */
  async getAttributeComparisons(
    start: number,
    end: number,
  ): Promise<TraceAttributeComparison[]> {
    if (config.useMock) {
      return mockDataGenerator.getTraceAttributeComparisons(start, end);
    }

    const response = await collectorClient.get<TraceAttributeComparison[]>(
      `${COLLECTOR_ENDPOINTS.TRACES}/attribute-comparisons`,
      { params: { start, end } },
    );
    return response.data;
  },

  /**
   * Get scatter plot data (Duration vs Time)
   */
  async getScatterData(
    start: number,
    end: number,
  ): Promise<TraceScatterPoint[]> {
    if (config.useMock) {
      return mockDataGenerator.getTraceScatterData(start, end);
    }

    const response = await collectorClient.get<TraceScatterPoint[]>(
      `${COLLECTOR_ENDPOINTS.TRACES}/scatter`,
      { params: { start, end } },
    );
    return response.data;
  },

  /**
   * Get services with trace counts
   */
  async getServicesWithCount(
    start: number,
    end: number,
  ): Promise<ServiceWithCount[]> {
    if (config.useMock) {
      return mockDataGenerator.getServicesWithTraceCount(start, end);
    }

    const response = await collectorClient.get<ServiceWithCount[]>(
      `${COLLECTOR_ENDPOINTS.TRACES}/services-count`,
      { params: { start, end } },
    );
    return response.data;
  },

  /**
   * Get monitor metrics (RED - Rate, Error, Duration)
   */
  async getMonitorMetrics(
    service: string,
    spanKind: SpanKind | undefined,
    start: number,
    end: number,
  ): Promise<MonitorMetrics[]> {
    if (config.useMock) {
      return mockDataGenerator.getMonitorMetrics(service, spanKind, start, end);
    }

    const response = await collectorClient.get<MonitorMetrics[]>(
      `${COLLECTOR_ENDPOINTS.TRACES}/monitor/metrics`,
      { params: { service, spanKind, start, end } },
    );
    return response.data;
  },

  /**
   * Get operation-level metrics for monitor table
   */
  async getOperationMetrics(
    service: string,
    spanKind: SpanKind | undefined,
    start: number,
    end: number,
  ): Promise<OperationMetrics[]> {
    if (config.useMock) {
      return mockDataGenerator.getOperationMetrics(
        service,
        spanKind,
        start,
        end,
      );
    }

    const response = await collectorClient.get<OperationMetrics[]>(
      `${COLLECTOR_ENDPOINTS.TRACES}/monitor/operations`,
      { params: { service, spanKind, start, end } },
    );
    return response.data;
  },
};

export default tracesApi;
