/**
 * Graph Registry — UPTIME (UPT)
 * 18 graph definitions
 *
 * Auto-extracted from graph-registry.ts
 */

import type { GraphDefinition } from "./types";

export const UPT_GRAPHS: GraphDefinition[] = [
  // │ UPTIME (UPT) - 16 graphs
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "UPT10001",
    module: "UPT",
    title: "Total Monitors",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "count",
    description: "Total uptime monitors",
    dataSource: "stats.total",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH monitors AGGREGATE count(*)",
        legendFormat: "Total Monitors",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/uptime/index.vue",
    position: "stats-row-1",
    toggleable: false,
  },
  {
    graphId: "UPT10002",
    module: "UPT",
    title: "Up",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "count",
    description: "Monitors currently up",
    dataSource: "stats.up",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH monitors WHERE status = 'up' AGGREGATE count(*)",
        legendFormat: "Up",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/uptime/index.vue",
    position: "stats-row-1",
    toggleable: false,
  },
  {
    graphId: "UPT10003",
    module: "UPT",
    title: "Down",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "count",
    description: "Monitors currently down",
    dataSource: "stats.down",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH monitors WHERE status = 'down' AGGREGATE count(*)",
        legendFormat: "Down",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/uptime/index.vue",
    position: "stats-row-1",
    toggleable: false,
  },
  {
    graphId: "UPT10004",
    module: "UPT",
    title: "Degraded",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "count",
    description: "Monitors in degraded state",
    dataSource: "stats.degraded",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH monitors WHERE status = 'degraded' AGGREGATE count(*)",
        legendFormat: "Degraded",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/uptime/index.vue",
    position: "stats-row-1",
    toggleable: false,
  },
  {
    graphId: "UPT10005",
    module: "UPT",
    title: "Paused",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "count",
    description: "Paused monitors",
    dataSource: "stats.paused",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH monitors WHERE paused = true AGGREGATE count(*)",
        legendFormat: "Paused",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/uptime/index.vue",
    position: "stats-row-2",
    toggleable: false,
  },
  {
    graphId: "UPT10006",
    module: "UPT",
    title: "Avg Uptime (24h)",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "%",
    description: "Average uptime percentage in last 24 hours",
    dataSource: "stats.avgUptime",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          'avg_over_time(uptime_check_status{monitor_id="{{monitor_id}}"}[24h]) * 100',
        legendFormat: "Avg Uptime (24h)",
        seriesKey: "__name__",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH uptime_checks WHERE monitor_id = '{{monitor_id}}' AGGREGATE avg(status) * 100 INTERVAL {{interval}}",
        legendFormat: "Avg Uptime (24h)",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/uptime/index.vue",
    position: "stats-row-2",
    toggleable: false,
  },
  {
    graphId: "UPT10007",
    module: "UPT",
    title: "Avg Response",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "ms",
    description: "Average response time",
    dataSource: "stats.avgResponseTime",
    defaultQueries: [
      {
        dialect: "promql",
        expression: 'uptime_check_response_time{monitor_id="{{monitor_id}}"}',
        legendFormat: "Avg Response",
        seriesKey: "__name__",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH uptime_checks WHERE monitor_id = '{{monitor_id}}' AGGREGATE avg(response_time) INTERVAL {{interval}}",
        legendFormat: "Avg Response",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/uptime/index.vue",
    position: "stats-row-2",
    toggleable: false,
  },
  {
    graphId: "UPT10008",
    module: "UPT",
    title: "Active Monitors",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "count",
    description: "Non-paused active monitors",
    dataSource: "monitors.filter(active && !paused).length",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH monitors WHERE active = true AND paused = false AGGREGATE count(*)",
        legendFormat: "Active Monitors",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/uptime/index.vue",
    position: "stats-row-2",
    toggleable: false,
  },
  {
    graphId: "UPT10009",
    module: "UPT",
    title: "Uptime Bars (24h)",
    component: "Custom",
    chartType: "mini-bars",
    signalType: "uptime",
    unit: "",
    description: "40 mini bars per monitor showing hourly check status",
    dataSource: "per-monitor uptime data",
    defaultQueries: [
      {
        dialect: "promql",
        expression: 'uptime_check_status{monitor_id="{{monitor_id}}"}',
        legendFormat: "Uptime Bars (24h)",
        seriesKey: "__name__",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH uptime_checks WHERE monitor_id = '{{monitor_id}}' AGGREGATE last(status) INTERVAL {{interval}}",
        legendFormat: "Uptime Bars (24h)",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/uptime/index.vue",
    position: "table-column",
    toggleable: false,
  },
  {
    graphId: "UPT10010",
    module: "UPT",
    title: "Status",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "",
    description: "Monitor current status",
    dataSource: "monitor.status",
    defaultQueries: [
      {
        dialect: "promql",
        expression: 'uptime_check_status{monitor_id="{{monitor_id}}"}',
        legendFormat: "Status",
        seriesKey: "__name__",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH uptime_checks WHERE monitor_id = '{{monitor_id}}' AGGREGATE last(status) INTERVAL {{interval}}",
        legendFormat: "Status",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/uptime/MonitorDetailPanel.vue",
    position: "detail-stats",
    toggleable: false,
  },
  {
    graphId: "UPT10011",
    module: "UPT",
    title: "Uptime (24h)",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "%",
    description: "Monitor 24h uptime percentage",
    dataSource: "monitor.uptimeStats.uptime24h",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          'avg_over_time(uptime_check_status{monitor_id="{{monitor_id}}"}[24h]) * 100',
        legendFormat: "Uptime (24h)",
        seriesKey: "__name__",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH uptime_checks WHERE monitor_id = '{{monitor_id}}' AGGREGATE avg(status) * 100 INTERVAL {{interval}}",
        legendFormat: "Uptime (24h)",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/uptime/MonitorDetailPanel.vue",
    position: "detail-stats",
    toggleable: false,
  },
  {
    graphId: "UPT10012",
    module: "UPT",
    title: "Response Time",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "ms",
    description: "Monitor average response time",
    dataSource: "monitor.uptimeStats.avgResponseTime24h",
    defaultQueries: [
      {
        dialect: "promql",
        expression: 'uptime_check_response_time{monitor_id="{{monitor_id}}"}',
        legendFormat: "Response Time",
        seriesKey: "__name__",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH uptime_checks WHERE monitor_id = '{{monitor_id}}' AGGREGATE avg(response_time) INTERVAL {{interval}}",
        legendFormat: "Response Time",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/uptime/MonitorDetailPanel.vue",
    position: "detail-stats",
    toggleable: false,
  },
  {
    graphId: "UPT10013",
    module: "UPT",
    title: "Interval",
    component: "StatPanel",
    chartType: "stat",
    signalType: "uptime",
    unit: "s",
    description: "Monitor check interval",
    dataSource: "monitor.interval",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH monitors WHERE id = '{{monitor_id}}' LIMIT 1",
        legend: "Interval",
        legendFormat: "Interval",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/uptime/MonitorDetailPanel.vue",
    position: "detail-stats",
    toggleable: false,
  },
  {
    graphId: "UPT10014",
    module: "UPT",
    title: "Uptime Statistics",
    component: "Custom",
    chartType: "mini-bars",
    signalType: "uptime",
    unit: "%",
    description: "50 horizontal bars for 24h/7d/30d/90d uptime periods",
    dataSource: "uptimeStats.uptime24h/7d/30d/90d",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          'avg_over_time(uptime_check_status{monitor_id="{{monitor_id}}"}[24h]) * 100',
        legendFormat: "Uptime Statistics",
        seriesKey: "__name__",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH uptime_checks WHERE monitor_id = '{{monitor_id}}' AGGREGATE avg(status) * 100 INTERVAL {{interval}}",
        legendFormat: "Uptime Statistics",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/uptime/MonitorDetailPanel.vue",
    position: "detail-uptime-section",
    toggleable: false,
  },
  {
    graphId: "UPT10015",
    module: "UPT",
    title: "Response Time Trend",
    component: "MiniChartCard",
    chartType: "timeseries",
    signalType: "uptime",
    unit: "ms",
    description: "Response time trend mini chart",
    dataSource: "generateChartSeries(monitor.name, baseValue)",
    defaultQueries: [
      {
        dialect: "promql",
        expression: 'uptime_check_response_time{monitor_id="{{monitor_id}}"}',
        legendFormat: "Response Time Trend",
        seriesKey: "__name__",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH uptime_checks WHERE monitor_id = '{{monitor_id}}' AGGREGATE avg(response_time) INTERVAL {{interval}}",
        legendFormat: "Response Time Trend",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/uptime/MonitorDetailPanel.vue",
    position: "detail-trend",
    toggleable: true,
  },
  {
    graphId: "UPT10016",
    module: "UPT",
    title: "Check History",
    component: "Custom",
    chartType: "mini-bars",
    signalType: "uptime",
    unit: "",
    description: "40 mini bars showing last check results (green/red/orange)",
    dataSource: "checks.slice(0, 40)",
    defaultQueries: [
      {
        dialect: "promql",
        expression: 'uptime_check_status{monitor_id="{{monitor_id}}"}',
        legendFormat: "Check History",
        seriesKey: "__name__",
      },
      {
        dialect: "tfql",
        expression:
          "FETCH uptime_checks WHERE monitor_id = '{{monitor_id}}' AGGREGATE last(status) INTERVAL {{interval}}",
        legendFormat: "Check History",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/uptime/MonitorDetailPanel.vue",
    position: "detail-check-history",
    toggleable: false,
  },

  // UPT Row — Time Series Graphs (UPT10017–UPT10018)
  {
    graphId: "UPT10017",
    module: "UPT",
    title: "Response Time Trend (per URL)",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "uptime",
    unit: "ms",
    description:
      "Average response time over time per monitor URL — only successful checks, failures shown as 0",
    dataSource:
      "getHourlyStats(monitorId) → avgResponseTimeMs per hour (success only, else 0)",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH uptime_checks_1h WHERE monitor_id = '{{monitor_id}}' AGGREGATE (countIfMerge(success_count) / countMerge(total_checks)) * 100 AS uptime_pct GROUP BY monitor_id INTERVAL {{interval}}",
        legend: "Uptime %",
        legendFormat: "{{monitor_id}}",
        seriesKey: "monitor_id",
      },
      {
        dialect: "clickhouse",
        expression:
          "SELECT hour, (countIfMerge(success_count) / countMerge(total_checks)) * 100 AS uptime_pct FROM {{db}}.uptime_checks_1h WHERE monitor_id = '{{monitor_id}}' GROUP BY hour ORDER BY hour ASC",
        legendFormat: "{{hour}}",
        seriesKey: "hour",
      },
    ],
    view: "monitoring/uptime/components/UptimeGraphs.vue",
    position: "graphs",
    toggleable: true,
  },
  {
    graphId: "UPT10018",
    module: "UPT",
    title: "SSL Days Remaining (per URL)",
    component: "RegistryGraphPanel",
    chartType: "bar",
    signalType: "uptime",
    unit: "days",
    description:
      "Current SSL certificate days remaining per HTTPS monitor — one bar per URL, color-coded by severity (green ≥30d, amber <30d, red <7d)",
    dataSource:
      "getSSLTrend(monitorId) → latest min_ssl_days_remaining per monitor from uptime_checks",
    defaultQueries: [
      {
        dialect: "clickhouse",
        expression:
          "SELECT monitor_id, any(monitor_name) AS monitor_name, min(ssl_days_remaining) AS ssl_days FROM {{db}}.uptime_checks WHERE organization_id = '{{org_id}}' AND checked_at >= now() - INTERVAL 24 HOUR AND ssl_days_remaining >= 0 GROUP BY monitor_id",
        legendFormat: "{{monitor_id}}",
        seriesKey: "monitor_id",
      },
    ],
    view: "monitoring/uptime/components/UptimeGraphs.vue",
    position: "graphs",
    toggleable: true,
  },

];
