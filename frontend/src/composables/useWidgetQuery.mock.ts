/**
 * useWidgetQuery.mock.ts - Mock data generator for widget query composable
 *
 * ONLY used when TELEMETRYFLOW_USE_MOCK=true in .env
 * Generates realistic fake chart data for development/demo purposes.
 *
 * Separated from useWidgetQuery.ts to ensure zero mock contamination
 * in real data mode (TELEMETRYFLOW_USE_MOCK=false).
 */

import {
  generateChartSeries,
  generateChartSeriesMultiple,
  type ChartSeries,
} from "@/utils/telemetry";
import { getIntervalForTimeRange, type QueryTemplate } from "@/utils/query-templates";

/**
 * Generate mock series data based on widget template type.
 */
export function mockWidgetSeries(
  template: QueryTemplate,
  variables: Record<string, string>,
  start: number,
  end: number,
): ChartSeries[] {
  const hours = Math.max(1, (end - start) / (3600 * 1000));
  const intervalMs = getIntervalForTimeRange(start, end).intervalMs;

  switch (template.widgetType) {
    case "timeseries": {
      const serviceName = variables.service_name || "api-gateway";
      if (template.id.includes("log-volume")) {
        return generateChartSeriesMultiple(
          [
            { name: "INFO", baseValue: 500, variance: 100 },
            { name: "WARN", baseValue: 50, variance: 20 },
            { name: "ERROR", baseValue: 10, variance: 5 },
          ],
          { hours, interval: intervalMs },
        );
      }
      if (template.id.includes("percentile")) {
        return generateChartSeriesMultiple(
          [
            { name: `${serviceName} p50`, baseValue: 45, variance: 10 },
            { name: `${serviceName} p95`, baseValue: 120, variance: 30 },
            { name: `${serviceName} p99`, baseValue: 250, variance: 80 },
          ],
          { hours, interval: intervalMs },
        );
      }
      return [
        generateChartSeries(serviceName, 150, 40, {
          hours,
          interval: intervalMs,
          trend: "stable",
        }),
      ];
    }

    case "bar": {
      const services = [
        "api-gateway",
        "user-service",
        "order-service",
        "payment-service",
        "notification-service",
      ];
      return services.map((name) =>
        generateChartSeries(name, Math.random() * 200 + 50, 20, {
          hours: 1,
          interval: 3600000,
        }),
      );
    }

    case "gauge":
    case "stat":
      return [
        generateChartSeries(template.name, 65, 15, {
          hours,
          interval: intervalMs,
        }),
      ];

    case "heatmap":
      return [
        generateChartSeries("latency", 100, 50, {
          hours,
          interval: intervalMs,
        }),
      ];

    case "traces":
      return [
        generateChartSeries("traces", 200, 80, { hours, interval: intervalMs }),
      ];

    default:
      return [
        generateChartSeries(template.name, 100, 30, {
          hours,
          interval: intervalMs,
        }),
      ];
  }
}

/**
 * Generate a mock single value for stat/gauge widgets.
 */
export function mockWidgetValue(template: QueryTemplate): number {
  switch (template.id) {
    case "stat-request-count":
      return Math.floor(Math.random() * 50000 + 10000);
    case "stat-error-rate":
      return Math.round(Math.random() * 5 * 100) / 100;
    case "stat-latency-p99":
      return Math.round((Math.random() * 300 + 50) * 10) / 10;
    case "stat-uptime":
      return Math.round((99.9 + Math.random() * 0.09) * 1000) / 1000;
    case "gauge-cpu-utilization":
      return Math.round((Math.random() * 60 + 20) * 10) / 10;
    case "gauge-memory-utilization":
      return Math.round((Math.random() * 40 + 40) * 10) / 10;
    case "gauge-disk-utilization":
      return Math.round((Math.random() * 30 + 50) * 10) / 10;
    default:
      return Math.round(Math.random() * 100 * 10) / 10;
  }
}
