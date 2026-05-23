/**
 * Graph Registry — AI INTELLIGENCE (AID + PRM)
 * 8 graph definitions — anomaly detection + predictive maintenance charts
 */

import type { GraphDefinition } from "./types";

export const PRM_GRAPHS: GraphDefinition[] = [
  // │ PREDICTIVE MAINTENANCE (PRM) — 4 graphs
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "PRM10001",
    module: "PRM",
    title: "Failure Probability Timeline",
    component: "TimeseriesChart",
    chartType: "timeseries",
    signalType: "mixed",
    unit: "%",
    description: "Failure probability over time per resource",
    dataSource: "clickhouse",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH predictions AGGREGATE avg(failure_probability) BY resource_identifier",
        legendFormat: "{{resource_identifier}}",
        seriesKey: "resource_identifier",
      },
    ],
    view: "ai-intelligence/predictive-maintenance/index.vue",
    position: "main",
    toggleable: true,
  },
  {
    graphId: "PRM10002",
    module: "PRM",
    title: "Health Score Timeline",
    component: "TimeseriesChart",
    chartType: "timeseries",
    signalType: "mixed",
    unit: "/100",
    description: "Resource health score over time",
    dataSource: "clickhouse",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH predictions AGGREGATE avg(health_score) BY resource_identifier",
        legendFormat: "{{resource_identifier}}",
        seriesKey: "resource_identifier",
      },
    ],
    view: "ai-intelligence/predictive-maintenance/index.vue",
    position: "main",
    toggleable: true,
  },
  {
    graphId: "PRM10003",
    module: "PRM",
    title: "Health Score by Resource",
    component: "BarChart",
    chartType: "bar",
    signalType: "mixed",
    unit: "/100",
    description: "Current average health score per resource",
    dataSource: "clickhouse",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH predictions AGGREGATE avg(health_score) GROUP BY resource_type ORDER BY avg(health_score) ASC",
        legendFormat: "{{resource_type}}",
        seriesKey: "resource_type",
      },
    ],
    view: "ai-intelligence/predictive-maintenance/index.vue",
    position: "main",
    toggleable: true,
  },
  {
    graphId: "PRM10004",
    module: "PRM",
    title: "Prediction Horizon Risk",
    component: "BarChart",
    chartType: "bar",
    signalType: "mixed",
    unit: "%",
    description: "Average failure probability by prediction horizon",
    dataSource: "clickhouse",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH predictions AGGREGATE avg(failure_probability) GROUP BY horizon",
        legendFormat: "{{horizon}}",
        seriesKey: "horizon",
      },
    ],
    view: "ai-intelligence/predictive-maintenance/index.vue",
    position: "main",
    toggleable: true,
  },
];

export const AID_GRAPHS: GraphDefinition[] = [
  // │ AI INTELLIGENCE (AID) — 4 graphs
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "AID10001",
    module: "AID",
    title: "Anomaly Timeline",
    component: "TimeseriesChart",
    chartType: "timeseries",
    signalType: "mixed",
    unit: "count",
    description: "Anomaly event count over time, split by severity",
    dataSource: "clickhouse",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH anomaly_events AGGREGATE count(*) BY severity",
        legendFormat: "{{severity}}",
        seriesKey: "severity",
      },
    ],
    view: "ai-intelligence/anomaly-detection/index.vue",
    position: "main",
    toggleable: true,
  },
  {
    graphId: "AID10002",
    module: "AID",
    title: "Anomaly Score Distribution",
    component: "BarChart",
    chartType: "bar",
    signalType: "mixed",
    unit: "",
    description: "Distribution of anomaly scores across detection rules",
    dataSource: "clickhouse",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH anomaly_events AGGREGATE avg(anomaly_score) GROUP BY detection_rule_id",
        legendFormat: "Avg Score",
        seriesKey: "detection_rule_id",
      },
    ],
    view: "ai-intelligence/anomaly-detection/index.vue",
    position: "main",
    toggleable: true,
  },
  {
    graphId: "AID10003",
    module: "AID",
    title: "Top Anomalous Metrics",
    component: "BarChart",
    chartType: "bar",
    signalType: "mixed",
    unit: "count",
    description: "Metrics with the highest anomaly event counts",
    dataSource: "clickhouse",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH anomaly_events AGGREGATE count(*) GROUP BY metric_name ORDER BY count DESC LIMIT 10",
        legendFormat: "{{metric_name}}",
        seriesKey: "metric_name",
      },
    ],
    view: "ai-intelligence/anomaly-detection/index.vue",
    position: "main",
    toggleable: true,
  },
  {
    graphId: "AID10004",
    module: "AID",
    title: "Sigma Level Distribution",
    component: "ScatterChart",
    chartType: "scatter",
    signalType: "mixed",
    unit: "σ",
    description: "Sigma level vs anomaly score scatter plot",
    dataSource: "clickhouse",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH anomaly_events SELECT sigma_level, anomaly_score, severity",
        legendFormat: "{{severity}}",
        seriesKey: "severity",
      },
    ],
    view: "ai-intelligence/anomaly-detection/index.vue",
    position: "main",
    toggleable: true,
  },
];
