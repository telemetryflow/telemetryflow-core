/**
 * useTelemetryGraph.mock.ts - Mock data generator for telemetry graph composable
 *
 * ONLY used when TELEMETRYFLOW_USE_MOCK=true in .env
 * Generates realistic fake chart data for development/demo purposes.
 *
 * Separated from useTelemetryGraph.ts to ensure zero mock contamination
 * in real data mode (TELEMETRYFLOW_USE_MOCK=false).
 */

import {
  generateChartSeries,
  generateChartSeriesMultiple,
  type ChartSeries,
} from "@/utils/telemetry";
import { getIntervalForTimeRange } from "@/utils/query-templates";
import type {
  GraphSignalType,
  GraphQueryType,
  TelemetryGraphFilters,
} from "./useTelemetryGraph";

export interface MockGraphOptions {
  signal: GraphSignalType;
  queryType: GraphQueryType;
  groupBy?: string;
  filters: TelemetryGraphFilters;
}

/**
 * Generate mock graph data matching the real API shape.
 * Returns { series, value } without side effects.
 */
export async function mockGraphData(
  options: MockGraphOptions,
  startMs: number,
  endMs: number,
): Promise<{ series: ChartSeries[]; value: number | null }> {
  await new Promise((resolve) =>
    setTimeout(resolve, 100 + Math.random() * 200),
  );

  const { signal, queryType, groupBy, filters } = options;
  const intervalMs = getIntervalForTimeRange(startMs, endMs).intervalMs;
  const timeOpts = { start: startMs, end: endMs, interval: intervalMs };

  let series: ChartSeries[] = [];
  let value: number | null = null;

  if (queryType === "stat") {
    value = Math.floor(Math.random() * 50000 + 1000);
    series = [
      generateChartSeries("value", 100, 30, timeOpts),
    ];
    return { series, value };
  }

  if (queryType === "percentiles" && signal === "metrics") {
    series = generateChartSeriesMultiple(
      [
        { name: "P50", baseValue: 120, variance: 25 },
        { name: "P75", baseValue: 180, variance: 35 },
        { name: "P90", baseValue: 240, variance: 50 },
        { name: "P95", baseValue: 310, variance: 70 },
        { name: "P99", baseValue: 520, variance: 150 },
        { name: "AVG", baseValue: 155, variance: 30 },
      ],
      timeOpts,
    );
    return { series, value: 155 };
  }

  if (queryType === "latency" && signal === "traces") {
    series = generateChartSeriesMultiple(
      [
        { name: "P50", baseValue: 45, variance: 10 },
        { name: "P75", baseValue: 78, variance: 18 },
        { name: "P90", baseValue: 105, variance: 25 },
        { name: "P95", baseValue: 120, variance: 30 },
        { name: "P99", baseValue: 250, variance: 80 },
        { name: "AVG", baseValue: 65, variance: 15 },
      ],
      timeOpts,
    );
    return { series, value: 65 };
  }

  // Standard series by signal type
  switch (signal) {
    case "metrics":
      if (groupBy === "service_name") {
        series = generateChartSeriesMultiple(
          [
            { name: "api-gateway", baseValue: 200, variance: 40 },
            { name: "user-service", baseValue: 150, variance: 30 },
            { name: "order-service", baseValue: 100, variance: 25 },
          ],
          timeOpts,
        );
      } else {
        series = [
          generateChartSeries(
            filters.metricName || "metric_value",
            150,
            40,
            { ...timeOpts, trend: "stable" },
          ),
        ];
      }
      break;

    case "logs":
      if (groupBy === "severity_text" || !groupBy) {
        series = generateChartSeriesMultiple(
          [
            { name: "info", baseValue: 500, variance: 100 },
            { name: "warn", baseValue: 50, variance: 20 },
            { name: "error", baseValue: 15, variance: 8 },
            { name: "debug", baseValue: 200, variance: 60 },
          ],
          timeOpts,
        );
      } else {
        series = generateChartSeriesMultiple(
          [
            { name: "api-gateway", baseValue: 300, variance: 60 },
            { name: "user-service", baseValue: 200, variance: 40 },
            { name: "order-service", baseValue: 150, variance: 35 },
          ],
          timeOpts,
        );
      }
      break;

    case "traces":
      if (groupBy === "status_code") {
        series = generateChartSeriesMultiple(
          [
            { name: "OK", baseValue: 400, variance: 80 },
            { name: "ERROR", baseValue: 20, variance: 10 },
            { name: "UNSET", baseValue: 50, variance: 15 },
          ],
          timeOpts,
        );
      } else {
        series = generateChartSeriesMultiple(
          [
            { name: "api-gateway", baseValue: 300, variance: 50 },
            { name: "user-service", baseValue: 200, variance: 40 },
            { name: "payment-service", baseValue: 100, variance: 25 },
          ],
          timeOpts,
        );
      }
      break;
  }

  // Compute aggregate value
  const allPoints = series.flatMap((s) => s.data.map((d) => d[1]));
  value =
    allPoints.length > 0
      ? Math.round(allPoints.reduce((a, b) => a + b, 0))
      : null;

  return { series, value };
}
