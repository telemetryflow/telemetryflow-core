/**
 * Mini-Graph Registry — SERVICE MAP (SVM)
 * 2 mini-graph definitions
 *
 * Covers inline trend charts in:
 *   - Service detail drawer (SVM40001–SVM40002)
 */

import type { MiniGraphDefinition } from "./types";

export const SVM_MINI_GRAPHS: MiniGraphDefinition[] = [
  {
    miniGraphId: "SVM40001",
    module: "SVM",
    title: "Avg Latency",
    icon: "carbon:time",
    unit: "ms",
    chartType: "timeseries",
    signalType: "service-map",
    description: "Average request latency trend for the selected service",
    dataSource: "latencySeries",
    metricExpression: "traces.latency.avg{service='{{service}}'}",
    view: "views/monitoring/service-map/components/ServiceDetailPanel.vue",
    context: "service-detail",
  },
  {
    miniGraphId: "SVM40002",
    module: "SVM",
    title: "Request Rate",
    icon: "carbon:activity",
    unit: "req/min",
    chartType: "timeseries",
    signalType: "service-map",
    description: "Requests-per-minute trend for the selected service",
    dataSource: "requestRateSeries",
    metricExpression: "traces.request.rate{service='{{service}}'}",
    view: "views/monitoring/service-map/components/ServiceDetailPanel.vue",
    context: "service-detail",
  },
];
