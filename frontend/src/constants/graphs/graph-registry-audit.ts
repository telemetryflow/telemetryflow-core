/**
 * Graph Registry — Audit (AUD)
 * 4 graph definitions
 *
 * Auto-extracted from graph-registry.ts
 */

import type { GraphDefinition } from "./types";

export const AUD_GRAPHS: GraphDefinition[] = [
  // │ Audit (AUD) - 4 graphs
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "AUD10001",
    module: "AUD",
    title: "Audit Events by Type",
    component: "RegistryGraphPanel",
    chartType: "bar",
    signalType: "mixed",
    unit: "count",
    description:
      "Distribution of audit events grouped by event type (AUTH, AUTHZ, DATA, SYSTEM)",
    dataSource: "audit.eventsByType",
    defaultQueries: [
      {
        dialect: "clickhouse",
        expression:
          "SELECT event_type, count() AS events FROM audit_logs WHERE timestamp >= now() - INTERVAL 7 DAY GROUP BY event_type ORDER BY events DESC",
        legendFormat: "{{event_type}}",
        seriesKey: "event_type",
      },
    ],
    view: "audit/index.vue",
    position: "charts-section",
    toggleable: false,
  },
  {
    graphId: "AUD10002",
    module: "AUD",
    title: "Audit Result Distribution",
    component: "RegistryGraphPanel",
    chartType: "bar",
    signalType: "mixed",
    unit: "count",
    description:
      "Count of audit events grouped by result (SUCCESS, FAILURE, DENIED)",
    dataSource: "audit.resultDistribution",
    defaultQueries: [
      {
        dialect: "clickhouse",
        expression:
          "SELECT result, count() AS events FROM audit_logs WHERE timestamp >= now() - INTERVAL 7 DAY GROUP BY result ORDER BY events DESC",
        legendFormat: "{{result}}",
        seriesKey: "result",
      },
    ],
    view: "audit/index.vue",
    position: "charts-section",
    toggleable: false,
  },
  {
    graphId: "AUD10003",
    module: "AUD",
    title: "Audit Duration Trend",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "mixed",
    unit: "ms",
    description: "Average audit event processing duration (ms) over time",
    dataSource: "audit.durationTrend",
    defaultQueries: [
      {
        dialect: "clickhouse",
        expression:
          "SELECT toStartOfHour(timestamp) AS time, avg(duration_ms) AS avg_duration FROM audit_logs WHERE timestamp >= now() - INTERVAL 7 DAY GROUP BY time ORDER BY time",
        legendFormat: "{{time}}",
        seriesKey: "time",
      },
    ],
    view: "audit/index.vue",
    position: "charts-section",
    toggleable: true,
  },
  {
    graphId: "AUD10004",
    module: "AUD",
    title: "Total Events Over Time",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "mixed",
    unit: "count",
    description: "Total audit events per hour over the last 7 days",
    dataSource: "audit.totalEvents",
    defaultQueries: [
      {
        dialect: "clickhouse",
        expression:
          "SELECT toStartOfHour(timestamp) AS time, count() AS events FROM audit_logs WHERE timestamp >= now() - INTERVAL 7 DAY GROUP BY time ORDER BY time",
        legendFormat: "{{time}}",
        seriesKey: "time",
      },
    ],
    view: "audit/index.vue",
    position: "charts-section",
    toggleable: true,
  },

];
