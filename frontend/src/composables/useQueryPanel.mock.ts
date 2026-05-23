/**
 * useQueryPanel.mock.ts - Mock data generator for query panels
 *
 * ONLY used when TELEMETRYFLOW_USE_MOCK=true in .env
 * Generates realistic fake chart data for development/demo purposes.
 *
 * Separated from useQueryPanel.ts to ensure zero mock contamination
 * in real data mode (TELEMETRYFLOW_USE_MOCK=false).
 */

import {
  generateChartSeries,
  generateChartSeriesMultiple,
  type ChartSeries,
} from "@/utils/telemetry";
import { getIntervalForTimeRange } from "@/utils/query-templates";
import type { WidgetType } from "@/types/dashboard";
import type { QueryRowState } from "./useQueryPanel";

// ── Percentile base values for latency queries ──

const PERCENTILE_BASE: Record<string, { base: number; variance: number }> = {
  P50: { base: 45, variance: 10 },
  P75: { base: 80, variance: 18 },
  P90: { base: 120, variance: 30 },
  P95: { base: 180, variance: 45 },
  P99: { base: 280, variance: 80 },
  AVG: { base: 65, variance: 15 },
};

// ── Main mock generator ──

export function mockRowData(
  row: QueryRowState,
  widgetType: WidgetType,
  start: number,
  end: number,
  widgetTitle?: string,
  enabledQueryCount: number = 1,
): { series: ChartSeries[]; value: number | null } {
  const intervalMs = getIntervalForTimeRange(start, end).intervalMs;
  const timeOpts = { start, end, interval: intervalMs };
  let series: ChartSeries[] = [];
  let value: number | null = null;

  // Determine series name based on query count
  let seriesName: string;
  if (row.legend) {
    seriesName = row.legend;
  } else if (widgetTitle) {
    seriesName =
      enabledQueryCount > 1 ? `${widgetTitle} - ${row.label}` : widgetTitle;
  } else {
    seriesName = `Series - ${row.label}`;
  }

  const qLower = row.query.toLowerCase();

  switch (widgetType) {
    case "timeseries": {
      // ── IAM: Login Activity — each row is a separate query with a legend ──
      if (seriesName.toLowerCase().includes("successful login")) {
        series = [
          generateChartSeries(seriesName, 160, 35, {
            ...timeOpts,
            trend: "stable",
          }),
        ];
      } else if (seriesName.toLowerCase().includes("failed login")) {
        series = [
          generateChartSeries(seriesName, 8, 4, {
            ...timeOpts,
            trend: "stable",
          }),
        ];
        // ── IAM: User Registrations Over Time ──
      } else if (
        qLower.includes("registrations") ||
        qLower.includes("user.created")
      ) {
        series = [
          generateChartSeries("Registrations", 6, 4, {
            ...timeOpts,
            trend: "up",
          }),
        ];
        // ── IAM: Active Users Trend ──
      } else if (
        qLower.includes("active_users") ||
        qLower.includes("active users")
      ) {
        series = [
          generateChartSeries("Active Users", 18, 5, {
            ...timeOpts,
            trend: "stable",
          }),
        ];
        // ── Audit: Duration Trend ──
      } else if (qLower.includes("duration_ms") || qLower.includes("avg_duration")) {
        series = [
          generateChartSeries("Avg Duration (ms)", 42, 18, {
            ...timeOpts,
            trend: "stable",
          }),
        ];
        // ── Audit: Total Events Over Time ──
      } else if (
        qLower.includes("count()") &&
        qLower.includes("audit_logs") &&
        qLower.includes("tostartofhour")
      ) {
        series = [
          generateChartSeries("Events", 520, 120, {
            ...timeOpts,
            trend: "stable",
          }),
        ];
      } else if (qLower.includes("log") || row.queryType === "log") {
        series = generateChartSeriesMultiple(
          [
            { name: `${seriesName} INFO`, baseValue: 500, variance: 100 },
            { name: `${seriesName} WARN`, baseValue: 50, variance: 20 },
            { name: `${seriesName} ERROR`, baseValue: 10, variance: 5 },
          ],
          timeOpts,
        );
      } else if (
        qLower.includes("error") &&
        (qLower.includes("rate") ||
          qLower.includes("error_rate") ||
          qLower.includes("status_code"))
      ) {
        // Error rate: ~4% matching stat panel mock (mockTraceStats uses 0.04)
        series = [
          generateChartSeries(seriesName, 4, 1.5, {
            ...timeOpts,
            trend: "stable",
          }),
        ];
      } else if (
        qLower.includes("request.total") ||
        qLower.includes("request_total") ||
        qLower.includes("throughput") ||
        (row.queryType === "trace" &&
          qLower.includes("count") &&
          !qLower.includes("error"))
      ) {
        // Request rate / trace throughput: realistic req/s values
        series = [
          generateChartSeries(seriesName, 320, 80, {
            ...timeOpts,
            trend: "stable",
          }),
        ];
      } else if (
        row.queryType === "trace" &&
        (qLower.includes("latency") || qLower.includes("duration")) &&
        qLower.includes("percentile")
      ) {
        // Traces latency percentiles: generate all 6 series (matching TRACES_GRAPH_LATENCY response)
        series = Object.entries(PERCENTILE_BASE).map(
          ([name, { base, variance }]) =>
            generateChartSeries(
              name.toUpperCase() === "AVG" ? "Avg" : name.toUpperCase(),
              base,
              variance,
              {
                ...timeOpts,
                trend: "stable",
              },
            ),
        );
      } else if (qLower.includes("k8s.node.cpu.usage")) {
        // K8S CPU utilization by node
        series = generateChartSeriesMultiple(
          [
            { name: "worker-01", baseValue: 42, variance: 12 },
            { name: "worker-02", baseValue: 58, variance: 15 },
            { name: "worker-03", baseValue: 35, variance: 10 },
          ],
          timeOpts,
        );
      } else if (qLower.includes("k8s.node.memory.usage")) {
        // K8S Memory utilization by node
        series = generateChartSeriesMultiple(
          [
            { name: "worker-01", baseValue: 68, variance: 8 },
            { name: "worker-02", baseValue: 74, variance: 6 },
            { name: "worker-03", baseValue: 55, variance: 10 },
          ],
          timeOpts,
        );
      } else if (qLower.includes("k8s.pod.container.cpu_usage")) {
        series = generateChartSeriesMultiple(
          [
            { name: "telemetryflow", baseValue: 32, variance: 8 },
            { name: "monitoring", baseValue: 18, variance: 5 },
            { name: "default", baseValue: 12, variance: 4 },
          ],
          timeOpts,
        );
      } else if (qLower.includes("k8s.pod.container.memory_usage")) {
        series = generateChartSeriesMultiple(
          [
            { name: "telemetryflow", baseValue: 62, variance: 6 },
            { name: "monitoring", baseValue: 45, variance: 8 },
            { name: "default", baseValue: 28, variance: 5 },
          ],
          timeOpts,
        );
      } else if (qLower.includes("k8s.pod.container.cpu_throttled")) {
        series = generateChartSeriesMultiple(
          [
            { name: "telemetryflow", baseValue: 0.8, variance: 0.4 },
            { name: "monitoring", baseValue: 0.3, variance: 0.2 },
            { name: "default", baseValue: 0.1, variance: 0.1 },
          ],
          timeOpts,
        );
      } else if (qLower.includes("k8s.pod.qos_class")) {
        series = generateChartSeriesMultiple(
          [
            { name: "Guaranteed", baseValue: 8, variance: 1 },
            { name: "Burstable", baseValue: 14, variance: 2 },
            { name: "BestEffort", baseValue: 4, variance: 1 },
          ],
          timeOpts,
        );
      } else if (qLower.includes("k8s.pod.status_reason")) {
        series = generateChartSeriesMultiple(
          [
            { name: "Running", baseValue: 22, variance: 3 },
            { name: "Pending", baseValue: 2, variance: 1 },
            { name: "CrashLoopBackOff", baseValue: 1, variance: 1 },
          ],
          timeOpts,
        );
      } else if (qLower.includes("k8s.pod.container.oom_killed")) {
        series = generateChartSeriesMultiple(
          [
            { name: "telemetryflow", baseValue: 0, variance: 1 },
            { name: "monitoring", baseValue: 0, variance: 0 },
          ],
          timeOpts,
        );
      } else if (qLower.includes("k8s.pod.restart_count")) {
        series = generateChartSeriesMultiple(
          [
            { name: "telemetryflow", baseValue: 2, variance: 2 },
            { name: "monitoring", baseValue: 1, variance: 1 },
            { name: "default", baseValue: 0, variance: 1 },
          ],
          timeOpts,
        );
      } else if (qLower.includes("k8s.node.network") || qLower.includes("k8s.namespace.network")) {
        series = generateChartSeriesMultiple(
          [
            { name: "worker-01", baseValue: 524288, variance: 131072 },
            { name: "worker-02", baseValue: 393216, variance: 98304 },
            { name: "worker-03", baseValue: 262144, variance: 65536 },
          ],
          timeOpts,
        );
      } else if (qLower.includes("k8s.pod.count")) {
        series = generateChartSeriesMultiple(
          [
            { name: "telemetryflow", baseValue: 12, variance: 2 },
            { name: "monitoring", baseValue: 6, variance: 1 },
            { name: "default", baseValue: 4, variance: 1 },
            { name: "kube-system", baseValue: 8, variance: 0 },
          ],
          timeOpts,
        );
      } else {
        // Individual percentile query (e.g., "AGGREGATE p50(value)")
        const pMatch = qLower.match(/\b(p50|p75|p90|p95|p99|avg)\b/);
        if (pMatch && PERCENTILE_BASE[pMatch[1]]) {
          const { base, variance } = PERCENTILE_BASE[pMatch[1]];
          series = [
            generateChartSeries(seriesName, base, variance, {
              ...timeOpts,
              trend: "stable",
            }),
          ];
        } else {
          series = [
            generateChartSeries(seriesName, 150, 40, {
              ...timeOpts,
              trend: "stable",
            }),
          ];
        }
      }
      break;
    }
    case "bar": {
      // ── IAM: Registrations by Region ──
      if (
        qLower.includes("region") &&
        (qLower.includes("registrations") || qLower.includes("registration"))
      ) {
        const regions: {
          name: string;
          base: number;
          variance: number;
          color: string;
        }[] = [
          { name: "Southeast Asia", base: 420, variance: 60, color: "#3b82f6" },
          { name: "Asia-Pacific", base: 310, variance: 50, color: "#8b5cf6" },
          { name: "Europe", base: 180, variance: 40, color: "#10b981" },
          { name: "North America", base: 140, variance: 35, color: "#f59e0b" },
          { name: "Middle East", base: 85, variance: 20, color: "#ef4444" },
        ];
        series = regions.map((r) => {
          const s = generateChartSeries(r.name, r.base, r.variance, {
            hours: 1,
            interval: 3600000,
          });
          s.color = r.color;
          return s;
        });
      } else if (qLower.includes("log") || row.queryType === "log") {
        // Log distribution by severity level — all 6 standard levels with colors
        const levels: {
          name: string;
          base: number;
          variance: number;
          color: string;
        }[] = [
          { name: "Trace", base: 5, variance: 3, color: "#9ca3af" },
          { name: "Debug", base: 80, variance: 20, color: "#3b82f6" },
          { name: "Info", base: 500, variance: 100, color: "#22c55e" },
          { name: "Warn", base: 45, variance: 15, color: "#f59e0b" },
          { name: "Error", base: 12, variance: 5, color: "#ef4444" },
          { name: "Fatal", base: 2, variance: 1, color: "#a855f7" },
        ];
        series = levels.map((l) => {
          const s = generateChartSeries(l.name, l.base, l.variance, {
            hours: 1,
            interval: 3600000,
          });
          s.color = l.color;
          return s;
        });
      } else {
        series = [
          "api-gateway",
          "user-service",
          "order-service",
          "payment-service",
        ].map((name) =>
          generateChartSeries(name, Math.random() * 200 + 50, 20, {
            hours: 1,
            interval: 3600000,
          }),
        );
      }
      break;
    }
    case "stat":
      value = Math.floor(Math.random() * 50000 + 10000);
      series = [
        generateChartSeries(seriesName, 100, 25, {
          ...timeOpts,
        }),
      ];
      break;
    case "gauge":
      value = Math.round((Math.random() * 60 + 20) * 10) / 10;
      series = [
        generateChartSeries(seriesName, 65, 15, {
          ...timeOpts,
        }),
      ];
      break;
    case "heatmap":
      series = [
        generateChartSeries("latency", 100, 50, {
          ...timeOpts,
        }),
      ];
      break;
    case "traces":
      series = [
        generateChartSeries("traces", 200, 80, {
          ...timeOpts,
        }),
      ];
      break;
    default:
      series = [
        generateChartSeries(seriesName, 100, 30, {
          ...timeOpts,
        }),
      ];
  }

  return { series, value };
}
