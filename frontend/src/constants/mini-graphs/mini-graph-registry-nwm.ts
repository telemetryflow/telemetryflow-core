/**
 * Mini-Graph Registry — NETWORK MAP (NWM)
 * 2 mini-graph definitions
 *
 * Covers inline trend charts in:
 *   - Network node detail drawer (NWM40001–NWM40002)
 */

import type { MiniGraphDefinition } from "./types";

export const NWM_MINI_GRAPHS: MiniGraphDefinition[] = [
  {
    miniGraphId: "NWM40001",
    module: "NWM",
    title: "Latency",
    icon: "carbon:time",
    unit: "ms",
    chartType: "timeseries",
    signalType: "network-map",
    description: "Round-trip latency trend for the selected network node",
    dataSource: "latencySeries",
    metricExpression: "network.node.latency{node='{{node}}'}",
    view: "views/monitoring/network-map/components/NodeDetailPanel.vue",
    context: "network-node-detail",
  },
  {
    miniGraphId: "NWM40002",
    module: "NWM",
    title: "CPU Usage",
    icon: "carbon:chip",
    iconClass: "cpu",
    unit: "%",
    chartType: "timeseries",
    signalType: "network-map",
    description: "CPU utilization trend for the selected network node",
    dataSource: "cpuSeries",
    metricExpression: "network.node.cpu.usage{node='{{node}}'}",
    view: "views/monitoring/network-map/components/NodeDetailPanel.vue",
    context: "network-node-detail",
  },
];
