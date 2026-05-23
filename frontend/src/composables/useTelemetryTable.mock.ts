/**
 * useTelemetryTable.mock.ts - Mock data generator for telemetry table composable
 *
 * ONLY used when TELEMETRYFLOW_USE_MOCK=true in .env
 * Generates realistic fake table rows for development/demo purposes.
 *
 * Separated from useTelemetryTable.ts to ensure zero mock contamination
 * in real data mode (TELEMETRYFLOW_USE_MOCK=false).
 */

import type { PaginatedResponse, DatatableQueryParams } from "@/types/datatable";
import type { TelemetrySignal, TelemetryTableFilters } from "./useTelemetryTable";

/**
 * Build a mock paginated response for a telemetry signal.
 */
export function mockTableResponse(
  signal: TelemetrySignal,
  params: DatatableQueryParams<TelemetryTableFilters>,
): PaginatedResponse<any> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;

  const mockGenerators: Record<TelemetrySignal, () => any[]> = {
    metrics: () =>
      Array.from({ length: pageSize }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        metricName: `mock_metric_${i}`,
        value: Math.random() * 100,
        metricType: "gauge",
        unit: "",
        serviceName: "mock-service",
        attributes: {},
      })),
    logs: () =>
      Array.from({ length: pageSize }, (_, i) => ({
        id: `mock-log-${page}-${i}`,
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
        severityText: ["info", "warn", "error", "debug"][i % 4],
        severityNumber: [9, 13, 17, 5][i % 4],
        serviceName: "mock-service",
        body: `Mock log message ${i}`,
        attributes: {},
        resource: {},
      })),
    traces: () =>
      Array.from({ length: pageSize }, (_, i) => ({
        traceId: `00000000000000000000000000mock${String(i).padStart(4, "0")}`,
        spanId: `mock${String(i).padStart(12, "0")}`,
        timestamp: new Date(Date.now() - i * 5000).toISOString(),
        serviceName: "mock-service",
        spanName: `mock-operation-${i}`,
        durationMs: Math.round(Math.random() * 500),
        statusCode: i % 5 === 0 ? "ERROR" : "OK",
        spanKind: "SERVER",
        attributes: {},
      })),
  };

  const data = mockGenerators[signal]();
  const total = 200;

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    hasNext: page * pageSize < total,
    hasPrevious: page > 1,
  };
}
