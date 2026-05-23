/**
 * Graph Registry — LOGS (LOG)
 * 8 graph definitions
 *
 * Auto-extracted from graph-registry.ts
 */

import type { GraphDefinition } from "./types";

export const LOG_GRAPHS: GraphDefinition[] = [
  // │ LOGS (LOG) - 8 graphs
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "LOG10001",
    module: "LOG",
    title: "Log Volume",
    component: "BarChart",
    chartType: "bar",
    signalType: "logs",
    unit: "count",
    description: "Log volume over time stacked by severity (Discover tab)",
    dataSource: "logsStore.volumeByLevel",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: 'logs{level=~".*"} | count by (level) over time(1m)',
        legendFormat: "{{level}}",
        seriesKey: "level",
      },
    ],
    view: "telemetry/logs/LogsDiscoverTab.vue",
    position: "discover-tab-top",
    toggleable: true,
  },
  {
    graphId: "LOG10002",
    module: "LOG",
    title: "Log Volume by Level",
    component: "BarChart",
    chartType: "bar",
    signalType: "logs",
    unit: "count",
    description: "Log volume by severity level over time (Analytics tab)",
    dataSource: "6 series (Trace,Debug,Info,Warn,Error,Fatal)",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "logs{} | count by (level) over time(5m)",
        legendFormat: "{{level}}",
        seriesKey: "level",
      },
    ],
    view: "telemetry/logs/LogsAnalyticsTab.vue",
    position: "analytics-tab-top",
    toggleable: true,
  },
  {
    graphId: "LOG10003",
    module: "LOG",
    title: "Log Volume by Service",
    component: "BarChart",
    chartType: "bar",
    signalType: "logs",
    unit: "count",
    description: "Log count per service with error overlay",
    dataSource: "categories=services, series=[Logs,Errors]",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "logs{} | count by (service_name)",
        legendFormat: "{{service_name}}",
        seriesKey: "service_name",
      },
    ],
    view: "telemetry/logs/LogsAnalyticsTab.vue",
    position: "analytics-tab-middle",
    toggleable: false,
  },
  {
    graphId: "LOG10004",
    module: "LOG",
    title: "Log Patterns",
    component: "Custom",
    chartType: "mini-bars",
    signalType: "logs",
    unit: "count",
    description: "Mini inline bar charts showing 12-hour pattern trends",
    dataSource: "patterns[].volume",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH logs AGGREGATE count(*) GROUP BY pattern",
        legendFormat: "{{pattern}}",
        seriesKey: "pattern",
      },
    ],
    view: "telemetry/logs/LogsAnalyticsTab.vue",
    position: "analytics-tab-patterns",
    toggleable: false,
  },
  {
    graphId: "LOG10005",
    module: "LOG",
    title: "Top Errors",
    component: "Custom",
    chartType: "bar",
    signalType: "logs",
    unit: "occurrences",
    description: "Top N errors with horizontal frequency bars",
    dataSource: "topErrors[].count",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: 'logs{level="error"} | topk(10, count by (message))',
        legendFormat: "{{message}}",
        seriesKey: "message",
      },
    ],
    view: "telemetry/logs/LogsAnalyticsTab.vue",
    position: "analytics-tab-errors",
    toggleable: false,
  },
  {
    graphId: "LOG10006",
    module: "LOG",
    title: "Service Breakdown",
    component: "DataTableCard",
    chartType: "progress",
    signalType: "logs",
    unit: "%",
    description: "Service breakdown table with error rate progress bars",
    dataSource: "serviceBreakdown[].errorRate",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          'count_over_time({service_name="{{service_name}}", severity_text="{{severity}}"}[$__rate_interval])',
        legendFormat: "Service Breakdown",
        seriesKey: "__name__",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH logs WHERE service_name = '{{service_name}}' AND severity_text = '{{severity}}' AGGREGATE count(*) INTERVAL {{interval}}",
        legendFormat: "Service Breakdown",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/logs/LogsAnalyticsTab.vue",
    position: "analytics-tab-breakdown",
    toggleable: false,
  },
  {
    graphId: "LOG10007",
    module: "LOG",
    title: "Detected Patterns",
    component: "DataTableCard",
    chartType: "sparkline",
    signalType: "logs",
    unit: "matches",
    description: "Patterns table with SVG sparkline volume column",
    dataSource: "filteredPatterns[].volume",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH logs AGGREGATE count(*) GROUP BY pattern ORDER BY count DESC",
        legendFormat: "{{pattern}}",
        seriesKey: "pattern",
      },
    ],
    view: "telemetry/logs/LogsPatternsTab.vue",
    position: "patterns-tab-main",
    toggleable: false,
  },
  {
    graphId: "LOG10008",
    module: "LOG",
    title: "Pattern Detail",
    component: "Custom",
    chartType: "stat",
    signalType: "logs",
    unit: "",
    description: "Pattern detail stats grid with sample events",
    dataSource: "selectedPattern",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH logs WHERE pattern = '{{pattern_id}}' AGGREGATE count(*) INTERVAL 1h",
        legendFormat: "Pattern Detail",
        seriesKey: "__name__",
      },
    ],
    view: "telemetry/logs/LogsPatternsTab.vue",
    position: "patterns-tab-detail",
    toggleable: false,
  },

];
