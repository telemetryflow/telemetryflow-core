/**
 * API Stats Mock Data Generators
 *
 * Centralized mock data for all /stats API endpoints.
 * Units and scales match real ClickHouse / PostgreSQL backend responses:
 *
 *   Metrics:  totalMetrics (count of distinct metric names)
 *             totalDataPoints (count — scales with time range)
 *             activeSeries (count of name+attribute combos)
 *             avgRatePerMin (totalDataPoints / duration in minutes)
 *
 *   Logs:     totalLogs (count — scales with time range)
 *             errorCount, warnCount (counts — proportional to totalLogs)
 *             serviceCount (count of distinct services)
 *             avgRatePerMin (totalLogs / duration in minutes)
 *             byService, bySeverity (breakdowns)
 *
 *   Traces:   totalTraces (count — scales with time range, from traces MV)
 *             errorCount (count — proportional to totalTraces)
 *             avgDurationMs (milliseconds — average span duration)
 *             serviceCount (count of distinct services)
 *
 *   Alerts:   total, firing, acknowledged, resolved, silenced (counts from PG)
 *             bySeverity { critical, warning, info }
 */

import type { MetricStatsResponse } from "@/api/metrics";
import type { LogStatsResponse } from "@/api/logs";
import type { TraceStatsResponse } from "@/api/traces";
import type { AlertStatsResponse } from "@/api/alerting";
import {
  computeMockMetricCount,
  MOCK_ENTITY_COUNTS,
  CONCRETE_METRIC_COUNT,
} from "@/constants/metric-query-inventory";

// ─── Constants ──────────────────────────────────────────────────────────────────

/** Services seen in traces/logs (matches SERVICES slice used in seeds) */
const MOCK_SERVICE_COUNT = 6;

/** Log ingestion rate per hour per service (~533/hr × 6 services ≈ 3200/hr total) */
const LOG_RATE_PER_HOUR = 3200;

/** Trace span ingestion rate per hour (~800 spans/hr from 6 services) */
const TRACE_RATE_PER_HOUR = 800;

/** Metric data-point rate per hour (21 metrics × ~57 points/hr each ≈ 1200/hr) */
const METRIC_DATAPOINT_RATE_PER_HOUR = 1200;

// ─── Metric Stats ───────────────────────────────────────────────────────────────

/**
 * Mock metric stats matching backend TelemetryStatsService.getMetricStats()
 *
 * Total metric count is derived from the global metric query inventory
 * (metric-query-inventory.ts) via computeMockMetricCount().
 * See that file for the full 9-source breakdown.
 */
export function mockMetricStats(
  start?: number,
  end?: number,
): MetricStatsResponse {
  const s = start || Date.now() - 3600000;
  const e = end || Date.now();
  const hours = Math.max((e - s) / 3600000, 1);

  const totalDataPoints = Math.round(
    hours * METRIC_DATAPOINT_RATE_PER_HOUR + 150,
  );

  // Derived from the global metric query inventory (single source-of-truth)
  const totalMetrics = computeMockMetricCount(MOCK_ENTITY_COUNTS);

  return {
    totalMetrics,
    totalDataPoints,
    activeSeries: Math.round(CONCRETE_METRIC_COUNT * 0.7),
    avgRatePerMin: Math.round(totalDataPoints / (hours * 60)),
  };
}

// ─── Log Stats ──────────────────────────────────────────────────────────────────

/**
 * Mock log stats matching backend TelemetryStatsService.getLogStats()
 *
 * Real backend queries:
 *   totalLogs    → SUM(count) FROM logs MV GROUP BY severity_text
 *   errorCount   → countIf(severity_text = 'ERROR')
 *   warnCount    → countIf(severity_text IN ('WARN','WARNING'))
 *   serviceCount → count(DISTINCT service_name)
 *   avgRatePerMin → totalLogs / durationMinutes
 */
export function mockLogStats(start?: number, end?: number): LogStatsResponse {
  const s = start || Date.now() - 3600000;
  const e = end || Date.now();
  const hours = Math.max((e - s) / 3600000, 1);

  const totalLogs = Math.round(hours * LOG_RATE_PER_HOUR + 400);
  const errorCount = Math.round(totalLogs * 0.03);
  const warnCount = Math.round(totalLogs * 0.07);

  return {
    totalLogs,
    errorCount,
    warnCount,
    serviceCount: MOCK_SERVICE_COUNT,
    avgRatePerMin: Math.round(totalLogs / (hours * 60)),
    byService: {
      "api-gateway": Math.round(totalLogs * 0.3),
      "user-service": Math.round(totalLogs * 0.2),
      "order-service": Math.round(totalLogs * 0.15),
      "payment-service": Math.round(totalLogs * 0.12),
      "inventory-service": Math.round(totalLogs * 0.13),
      "auth-service": Math.round(totalLogs * 0.1),
    },
    bySeverity: {
      TRACE: Math.round(totalLogs * 0.02),
      DEBUG: Math.round(totalLogs * 0.2),
      INFO: Math.round(totalLogs * 0.63),
      WARN: warnCount,
      ERROR: errorCount,
      FATAL: Math.round(totalLogs * 0.005),
    },
  };
}

// ─── Trace Stats ────────────────────────────────────────────────────────────────

/**
 * Mock trace stats matching backend TelemetryStatsService.getTraceStats()
 *
 * Real backend queries:
 *   totalTraces   → SUM(countMerge(count)) FROM traces MV
 *   errorCount    → SUM of rows WHERE status_code = 'ERROR'
 *   avgDurationMs → avgMerge(avg_duration_ns) / 1_000_000 (ns → ms)
 *   serviceCount  → count(DISTINCT service_name)
 */
export function mockTraceStats(
  start?: number,
  end?: number,
): TraceStatsResponse {
  const s = start || Date.now() - 3600000;
  const e = end || Date.now();
  const hours = Math.max((e - s) / 3600000, 1);

  const totalTraces = Math.round(hours * TRACE_RATE_PER_HOUR + 50);
  const errorCount = Math.round(totalTraces * 0.04); // ~4% error rate

  return {
    totalTraces,
    errorCount,
    avgDurationMs: 125, // average span duration in milliseconds
    serviceCount: MOCK_SERVICE_COUNT - 1, // 5 services emit traces
  };
}

// ─── Alert Stats ────────────────────────────────────────────────────────────────

/**
 * Mock alert stats matching backend GetAlertStatsHandler (PostgreSQL)
 *
 * Real backend queries:
 *   countByStatus → SELECT status, COUNT(*) FROM alert_instances GROUP BY status
 *   bySeverity    → active alerts grouped by severity
 *
 * Alerts are not time-range dependent — they represent current state.
 */
export function mockAlertStats(): AlertStatsResponse {
  return {
    total: 4,
    firing: 4,
    acknowledged: 0,
    resolved: 0,
    silenced: 0,
    // +1 warning: SSL Certificate Expiring in 22 Days (github.com)
    bySeverity: { critical: 1, warning: 2, info: 1 },
  };
}

// ─── Home Page Mock Alerts ──────────────────────────────────────────────────────

export interface HomePageMockAlert {
  ruleName: string;
  severity: "critical" | "warning" | "info";
  status: "firing" | "resolved" | "pending";
  value: number;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: number;
  ruleId: string;
}

/**
 * Generate seed alerts for the home page overview (MOCK=true only).
 * These match the 3 alerts returned by mockAlertStats().
 */
export function mockHomeAlerts(): HomePageMockAlert[] {
  const now = Date.now();
  return [
    {
      ruleName: "High CPU Usage",
      severity: "warning",
      status: "firing",
      value: 85.2,
      labels: { service: "api-gateway", instance: "pod-1" },
      annotations: { summary: "CPU usage exceeded 80% on api-gateway" },
      startsAt: now - 1800000,
      ruleId: "mock-rule-1",
    },
    {
      ruleName: "Error Rate Spike",
      severity: "critical",
      status: "firing",
      value: 7.5,
      labels: { service: "payment-service", endpoint: "/process" },
      annotations: { summary: "Error rate exceeded 5% on payment-service" },
      startsAt: now - 600000,
      ruleId: "mock-rule-2",
    },
    {
      ruleName: "Memory Pressure",
      severity: "info",
      status: "firing",
      value: 70.3,
      labels: { service: "user-service", instance: "pod-2" },
      annotations: { summary: "Memory usage at 70% on user-service" },
      startsAt: now - 3600000,
      ruleId: "mock-rule-3",
    },
    {
      ruleName: "SSL Certificate Expiring in 30 Days",
      severity: "warning",
      status: "firing",
      value: 22,
      labels: {
        monitor: "TelemetryFlow GitHub Repository",
        domain: "github.com",
        type: "ssl-expiry",
      },
      annotations: { summary: "SSL certificate for github.com expires in 22 days" },
      startsAt: now - 7200000, // 2h ago
      ruleId: "mock-rule-ssl-30d",
    },
  ];
}

// ─── Unified export ─────────────────────────────────────────────────────────────

export const apiStatsMock = {
  getMetricStats: mockMetricStats,
  getLogStats: mockLogStats,
  getTraceStats: mockTraceStats,
  getAlertStats: mockAlertStats,
  getHomeAlerts: mockHomeAlerts,
};
