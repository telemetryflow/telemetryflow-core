/**
 * Graph Registry — IAM (IAM)
 * 4 graph definitions
 *
 * Auto-extracted from graph-registry.ts
 */

import type { GraphDefinition } from "./types";

export const IAM_GRAPHS: GraphDefinition[] = [
  // │ IAM (IAM) - 4 graphs
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "IAM10001",
    module: "IAM",
    title: "User Registrations Over Time",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "mixed",
    unit: "count",
    description: "New user registrations over time (sourced from audit_logs)",
    dataSource: "iam.registrations",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH iam registrations AGGREGATE count()",
        legend: "Registrations",
        seriesKey: "__name__",
      },
    ],
    view: "iam/overview/index.vue",
    position: "charts-section",
    toggleable: true,
  },
  {
    graphId: "IAM10002",
    module: "IAM",
    title: "Active Users Trend",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "mixed",
    unit: "count",
    description: "Distinct active users per day based on login events",
    dataSource: "iam.activeUsers",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH iam active_users AGGREGATE uniq(user_id)",
        legend: "Active Users",
        seriesKey: "__name__",
      },
    ],
    view: "iam/overview/index.vue",
    position: "charts-section",
    toggleable: true,
  },
  {
    graphId: "IAM10003",
    module: "IAM",
    title: "Registrations by Region",
    component: "RegistryGraphPanel",
    chartType: "bar",
    signalType: "mixed",
    unit: "count",
    description:
      "User registrations grouped by region (from audit_logs region_id)",
    dataSource: "iam.registrationsByRegion",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH iam registrations_by_region GROUP BY region",
        legend: "{{region}}",
        seriesKey: "region",
      },
    ],
    view: "iam/overview/index.vue",
    position: "charts-section",
    toggleable: false,
  },
  {
    graphId: "IAM10004",
    module: "IAM",
    title: "Login Activity",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "mixed",
    unit: "count",
    description: "Successful vs failed login attempts over time",
    dataSource: "iam.loginActivity",
    defaultQueries: [
      {
        dialect: "clickhouse",
        legend: "Successful Logins",
        expression:
          "SELECT toStartOfHour(timestamp) AS time, count() AS successful FROM audit_logs WHERE event_type = 'AUTH' AND action = 'login' AND result = 'SUCCESS' AND timestamp >= now() - INTERVAL 7 DAY GROUP BY time ORDER BY time",
        legendFormat: "{{time}}",
        seriesKey: "time",
      },
      {
        dialect: "clickhouse",
        legend: "Failed Logins",
        expression:
          "SELECT toStartOfHour(timestamp) AS time, count() AS failed FROM audit_logs WHERE event_type = 'AUTH' AND action = 'login' AND result = 'FAILURE' AND timestamp >= now() - INTERVAL 7 DAY GROUP BY time ORDER BY time",
        legendFormat: "{{time}}",
        seriesKey: "time",
      },
    ],
    view: "iam/overview/index.vue",
    position: "charts-section",
    toggleable: true,
  },
];
