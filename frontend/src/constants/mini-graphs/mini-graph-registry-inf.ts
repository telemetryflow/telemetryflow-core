/**
 * Mini-Graph Registry — INFRASTRUCTURE (INF)
 * 4 mini-graph definitions (cross-reference)
 *
 * These mini-graphs are rendered via RegistryGraphPanel variant="mini"
 * in InfraVMDetailsPanel.vue. Their primary definitions live in the
 * graph registry (INF10009–INF10012). This file documents them here
 * for completeness of the mini-graph inventory.
 *
 * Component: RegistryGraphPanel variant="mini"
 * Primary registry: constants/graphs/graph-registry-infra.ts
 */

import type { MiniGraphDefinition } from "./types";

export const INF_MINI_GRAPHS: MiniGraphDefinition[] = [
  {
    miniGraphId: "INF40001",
    module: "INF",
    title: "CPU Usage Trends",
    icon: "carbon:chip",
    iconClass: "cpu",
    unit: "%",
    chartType: "timeseries",
    signalType: "infrastructure",
    description: "CPU utilization trend for the selected VM/host (cross-ref: INF10009)",
    dataSource: "cpuSeries",
    metricExpression: "system.cpu.utilization{host='{{host}}'}",
    view: "views/monitoring/infra/infra-components/InfraVMDetailsPanel.vue",
    context: "vm-detail",
  },
  {
    miniGraphId: "INF40002",
    module: "INF",
    title: "Memory Usage Trends",
    icon: "ph:memory-fill",
    iconClass: "memory",
    unit: "%",
    chartType: "timeseries",
    signalType: "infrastructure",
    description: "Memory utilization trend for the selected VM/host (cross-ref: INF10010)",
    dataSource: "memorySeries",
    metricExpression: "system.memory.utilization{host='{{host}}'}",
    view: "views/monitoring/infra/infra-components/InfraVMDetailsPanel.vue",
    context: "vm-detail",
  },
  {
    miniGraphId: "INF40003",
    module: "INF",
    title: "Disk Usage Trends",
    icon: "mdi:harddisk",
    iconClass: "disk",
    unit: "%",
    chartType: "timeseries",
    signalType: "infrastructure",
    description: "Disk utilization trend for the selected VM/host (cross-ref: INF10011)",
    dataSource: "diskSeries",
    metricExpression: "system.filesystem.utilization{host='{{host}}'}",
    view: "views/monitoring/infra/infra-components/InfraVMDetailsPanel.vue",
    context: "vm-detail",
  },
  {
    miniGraphId: "INF40004",
    module: "INF",
    title: "Network I/O Trends",
    icon: "carbon:network-4",
    iconClass: "network",
    unit: "Mbps",
    chartType: "timeseries",
    signalType: "infrastructure",
    description: "Network I/O throughput trend for the selected VM/host (cross-ref: INF10012)",
    dataSource: "networkIOSeries",
    metricExpression: "system.network.io{host='{{host}}'} by (direction)",
    view: "views/monitoring/infra/infra-components/InfraVMDetailsPanel.vue",
    context: "vm-detail",
  },
];
