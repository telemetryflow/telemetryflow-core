/**
 * Mini-Graph Registry — AGENT (AGT)
 * 4 mini-graph definitions (cross-reference)
 *
 * These mini-graphs are rendered via RegistryGraphPanel variant="mini"
 * in AgentDetailsPanel.vue. Their primary definitions live in the
 * graph registry (AGT10013–AGT10016). This file documents them here
 * for completeness of the mini-graph inventory.
 *
 * Component: RegistryGraphPanel variant="mini"
 * Primary registry: constants/graphs/graph-registry-agent.ts
 */

import type { MiniGraphDefinition } from "./types";

export const AGT_MINI_GRAPHS: MiniGraphDefinition[] = [
  {
    miniGraphId: "AGT40001",
    module: "AGT",
    title: "CPU Usage Trends",
    icon: "carbon:chip",
    iconClass: "cpu",
    unit: "%",
    chartType: "timeseries",
    signalType: "agent",
    description: "CPU utilization trend for the selected agent host (cross-ref: AGT10013)",
    dataSource: "cpuSeries",
    metricExpression: "system.cpu.utilization{host='{{host}}'}",
    view: "views/monitoring/agent/agent-components/AgentDetailsPanel.vue",
    context: "agent-detail",
  },
  {
    miniGraphId: "AGT40002",
    module: "AGT",
    title: "Memory Usage Trends",
    icon: "ph:memory-fill",
    iconClass: "memory",
    unit: "%",
    chartType: "timeseries",
    signalType: "agent",
    description: "Memory utilization trend for the selected agent host (cross-ref: AGT10014)",
    dataSource: "memorySeries",
    metricExpression: "system.memory.utilization{host='{{host}}'}",
    view: "views/monitoring/agent/agent-components/AgentDetailsPanel.vue",
    context: "agent-detail",
  },
  {
    miniGraphId: "AGT40003",
    module: "AGT",
    title: "Disk Usage Trends",
    icon: "mdi:harddisk",
    iconClass: "disk",
    unit: "%",
    chartType: "timeseries",
    signalType: "agent",
    description: "Disk utilization trend for the selected agent host (cross-ref: AGT10015)",
    dataSource: "diskSeries",
    metricExpression: "system.filesystem.utilization{host='{{host}}'}",
    view: "views/monitoring/agent/agent-components/AgentDetailsPanel.vue",
    context: "agent-detail",
  },
  {
    miniGraphId: "AGT40004",
    module: "AGT",
    title: "Network I/O Trends",
    icon: "carbon:network-4",
    iconClass: "network",
    unit: "Mbps",
    chartType: "timeseries",
    signalType: "agent",
    description: "Network I/O throughput trend for the selected agent host (cross-ref: AGT10016)",
    dataSource: "networkSeries",
    metricExpression: "system.network.io{host='{{host}}'} by (direction)",
    view: "views/monitoring/agent/agent-components/AgentDetailsPanel.vue",
    context: "agent-detail",
  },
];
