/**
 * Mini-Graph Registry — UPTIME (UPT)
 * 1 mini-graph definition
 *
 * Covers inline trend charts in:
 *   - Monitor detail drawer (UPT40001)
 *
 * Note: UPT10015 "Response Time Trend" in graph-registry is the full-panel
 * RegistryGraphPanel version. UPT40001 here is the MiniChartCard variant
 * rendered inside MonitorDetailPanel.vue drawer.
 */

import type { MiniGraphDefinition } from "./types";

export const UPT_MINI_GRAPHS: MiniGraphDefinition[] = [
  {
    miniGraphId: "UPT40001",
    module: "UPT",
    title: "Response Time",
    icon: "carbon:time",
    unit: "ms",
    chartType: "timeseries",
    signalType: "uptime",
    description: "Recent check response times for the selected uptime monitor",
    dataSource: "responseTimeSeries",
    metricExpression: "uptime.check.response_time{monitor_id='{{monitor}}'}",
    view: "views/monitoring/uptime/components/MonitorDetailPanel.vue",
    context: "monitor-detail",
  },
];
