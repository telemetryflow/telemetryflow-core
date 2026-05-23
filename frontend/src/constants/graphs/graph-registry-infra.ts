/**
 * Graph Registry — INFRASTRUCTURE (INF)
 * 20 graph definitions
 *
 * Auto-extracted from graph-registry.ts
 */

import type { GraphDefinition } from "./types";

export const INF_GRAPHS: GraphDefinition[] = [
  // │ INFRASTRUCTURE (INF) - 20 graphs
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "INF10001",
    module: "INF",
    title: "Total VMs",
    component: "StatPanel",
    chartType: "stat",
    signalType: "infrastructure",
    unit: "count",
    description: "Total virtual machines",
    dataSource: "VM count",
    defaultQueries: [
      { dialect: "tfql", expression: "FETCH vms AGGREGATE count(*)", legendFormat: "Total VMs", seriesKey: "__name__" },
    ],
    view: "monitoring/infra/overview.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "INF10002",
    module: "INF",
    title: "Online Agents",
    component: "StatPanel",
    chartType: "stat",
    signalType: "infrastructure",
    unit: "count",
    description: "Online monitoring agents",
    dataSource: "online agents count",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH agents WHERE status = 'online' AGGREGATE count(*)",
        legendFormat: "Online Agents",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/infra/overview.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "INF10003",
    module: "INF",
    title: "CPU Usage",
    component: "StatPanel",
    chartType: "stat",
    signalType: "infrastructure",
    unit: "%",
    description: "Average CPU utilization across VMs",
    dataSource: "avg CPU utilization",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          '100 - avg(rate(node_cpu_seconds_total{mode="idle"}[$__rate_interval])) * 100',
        legendFormat: "CPU Usage",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/infra/overview.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "INF10004",
    module: "INF",
    title: "Memory Usage",
    component: "StatPanel",
    chartType: "stat",
    signalType: "infrastructure",
    unit: "%",
    description: "Average memory utilization across VMs",
    dataSource: "avg memory utilization",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          "(1 - avg(node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
        legendFormat: "Memory Usage",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/infra/overview.vue",
    position: "stats-row",
    toggleable: false,
  },
  {
    graphId: "INF10005",
    module: "INF",
    title: "CPU Resource",
    component: "Custom",
    chartType: "progress",
    signalType: "infrastructure",
    unit: "%",
    description: "CPU utilization progress card",
    dataSource: "cpuUtilization",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          '100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[$__rate_interval])) * 100)',
        legendFormat: "CPU Resource",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/infra/ResourcesSection.vue",
    position: "resource-cards",
    toggleable: false,
  },
  {
    graphId: "INF10006",
    module: "INF",
    title: "Memory Resource",
    component: "Custom",
    chartType: "progress",
    signalType: "infrastructure",
    unit: "%",
    description: "Memory utilization progress card",
    dataSource: "memoryUtilization",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          "(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100",
        legendFormat: "Memory Resource",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/infra/ResourcesSection.vue",
    position: "resource-cards",
    toggleable: false,
  },
  {
    graphId: "INF10007",
    module: "INF",
    title: "Disk Resource",
    component: "Custom",
    chartType: "progress",
    signalType: "infrastructure",
    unit: "%",
    description: "Disk utilization progress card",
    dataSource: "diskUtilization",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          "(1 - node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100",
        legendFormat: "Disk Resource",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/infra/ResourcesSection.vue",
    position: "resource-cards",
    toggleable: false,
  },
  {
    graphId: "INF10008",
    module: "INF",
    title: "Network Resource",
    component: "Custom",
    chartType: "progress",
    signalType: "infrastructure",
    unit: "MB/s",
    description: "Network throughput card",
    dataSource: "networkTotal",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          "rate(node_network_receive_bytes_total[$__rate_interval]) + rate(node_network_transmit_bytes_total[$__rate_interval])",
        legendFormat: "Network Resource",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/infra/ResourcesSection.vue",
    position: "resource-cards",
    toggleable: false,
  },
  {
    graphId: "INF10009",
    module: "INF",
    title: "VM CPU Usage",
    component: "MiniChartCard",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "%",
    description: "Per-VM CPU usage trend",
    dataSource: "cpuSeries (from vm.cpu.usage)",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          '100 - (rate(node_cpu_seconds_total{mode="idle",instance="<vm>"}[$__rate_interval]) * 100)',
        legendFormat: "VM CPU Usage",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/infra/InfraVMDetailsPanel.vue",
    position: "detail-trends",
    toggleable: true,
  },
  {
    graphId: "INF10010",
    module: "INF",
    title: "VM Memory Usage",
    component: "MiniChartCard",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "%",
    description: "Per-VM memory usage trend",
    dataSource: "memorySeries (calculated utilization)",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          '(1 - node_memory_MemAvailable_bytes{instance="<vm>"} / node_memory_MemTotal_bytes{instance="<vm>"}) * 100',
        legendFormat: "VM Memory Usage",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/infra/InfraVMDetailsPanel.vue",
    position: "detail-trends",
    toggleable: true,
  },
  {
    graphId: "INF10011",
    module: "INF",
    title: "VM Disk Usage",
    component: "MiniChartCard",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "%",
    description: "Per-VM disk usage trend",
    dataSource: "diskSeries (calculated utilization)",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          '(1 - node_filesystem_avail_bytes{instance="<vm>"} / node_filesystem_size_bytes{instance="<vm>"}) * 100',
        legendFormat: "VM Disk Usage",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/infra/InfraVMDetailsPanel.vue",
    position: "detail-trends",
    toggleable: true,
  },
  {
    graphId: "INF10012",
    module: "INF",
    title: "VM Network I/O",
    component: "MiniChartCard",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "MB/s",
    description: "Per-VM network traffic trend (recv + sent)",
    dataSource: "networkIOSeries (vm.network.bytesIn + bytesOut in MB)",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          'rate(node_network_receive_bytes_total{instance="<vm>"}[$__rate_interval])',
        legendFormat: "VM Network I/O",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/infra/InfraVMDetailsPanel.vue",
    position: "detail-trends",
    toggleable: true,
  },

  // ┌──────────────────────────────────────────────────────────────────────────────
  // │ INF - VM Resource Graphs (INF10013–INF10020) — full-panel charts
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "INF10013",
    module: "INF",
    title: "VM CPU Usage",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "vCPU",
    description:
      "CPU usage in vCPU cores (usage% × cores) over time — all VMs or filtered to a single VM",
    dataSource:
      "getVMMetrics().cpu.usage × cpu.cores / 100 | infraStore.filteredVMs[].cpu.usage × cores / 100",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH metrics WHERE metric_name = 'cpu.usage' AGGREGATE avg(value) GROUP BY vm_id INTERVAL {{interval}}",
        legend: "CPU Usage (vCPU)",
        legendFormat: "{{vm_id}}",
        seriesKey: "vm_id",
      },
      {
        dialect: "promql",
        expression:
          'sum(rate(node_cpu_seconds_total{mode!="idle"}[$__rate_interval])) by (instance)',
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "monitoring/infra/infra-components/CPUGraphs.vue",
    position: "graphs",
    toggleable: true,
  },
  {
    graphId: "INF10014",
    module: "INF",
    title: "VM CPU Utilization",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "%",
    description:
      "CPU utilization percentage — all VMs or filtered to a single VM",
    dataSource: "getVMMetrics().cpu.usage | infraStore.filteredVMs[].cpu.usage",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH metrics WHERE metric_name = 'cpu.usage' AGGREGATE avg(value) GROUP BY vm_id INTERVAL {{interval}}",
        legend: "CPU Utilization",
        legendFormat: "{{vm_id}}",
        seriesKey: "vm_id",
      },
      {
        dialect: "promql",
        expression:
          'avg by (instance) (1 - rate(node_cpu_seconds_total{mode="idle"}[$__rate_interval]))',
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "monitoring/infra/infra-components/CPUGraphs.vue",
    position: "graphs",
    toggleable: true,
  },
  {
    graphId: "INF10015",
    module: "INF",
    title: "VM Memory Usage",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "GB",
    description:
      "Memory used (GB) over time — all VMs or filtered to a single VM",
    dataSource:
      "getVMMetrics().memory.used | infraStore.filteredVMs[].memory.used",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH metrics WHERE metric_name = 'memory.used' AGGREGATE avg(value) GROUP BY vm_id INTERVAL {{interval}}",
        legend: "Memory Used",
        legendFormat: "{{vm_id}}",
        seriesKey: "vm_id",
      },
      {
        dialect: "promql",
        expression:
          "node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes",
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "monitoring/infra/infra-components/RAMGraphs.vue",
    position: "graphs",
    toggleable: true,
  },
  {
    graphId: "INF10016",
    module: "INF",
    title: "VM Memory Utilization",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "%",
    description:
      "Memory utilization percentage — all VMs or filtered to a single VM",
    dataSource:
      "getVMMetrics().memory.usedPercent | infraStore.filteredVMs[].memory.usedPercent",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH metrics WHERE metric_name = 'memory.usedPercent' AGGREGATE avg(value) GROUP BY vm_id INTERVAL {{interval}}",
        legend: "Memory Utilization",
        legendFormat: "{{vm_id}}",
        seriesKey: "vm_id",
      },
      {
        dialect: "promql",
        expression:
          "(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100",
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "monitoring/infra/infra-components/RAMGraphs.vue",
    position: "graphs",
    toggleable: true,
  },
  {
    graphId: "INF10017",
    module: "INF",
    title: "VM Disk Usage",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "GB",
    description:
      "Disk used (GB) over time — all VMs or filtered to a single VM",
    dataSource: "getVMMetrics().disk.used | infraStore.filteredVMs[].disk.used",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH metrics WHERE metric_name = 'disk.used' AGGREGATE avg(value) GROUP BY vm_id INTERVAL {{interval}}",
        legend: "Disk Used",
        legendFormat: "{{vm_id}}",
        seriesKey: "vm_id",
      },
      {
        dialect: "promql",
        expression:
          'node_filesystem_size_bytes{mountpoint="/"} - node_filesystem_avail_bytes{mountpoint="/"}',
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "monitoring/infra/infra-components/StorageGraphs.vue",
    position: "graphs",
    toggleable: true,
  },
  {
    graphId: "INF10018",
    module: "INF",
    title: "VM Disk Utilization",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "%",
    description:
      "Disk utilization percentage — all VMs or filtered to a single VM",
    dataSource:
      "getVMMetrics().disk.usedPercent | infraStore.filteredVMs[].disk.usedPercent",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH metrics WHERE metric_name = 'disk.usedPercent' AGGREGATE avg(value) GROUP BY vm_id INTERVAL {{interval}}",
        legend: "Disk Utilization",
        legendFormat: "{{vm_id}}",
        seriesKey: "vm_id",
      },
      {
        dialect: "promql",
        expression:
          '(1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100',
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "monitoring/infra/infra-components/StorageGraphs.vue",
    position: "graphs",
    toggleable: true,
  },
  {
    graphId: "INF10019",
    module: "INF",
    title: "VM Network I/O",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "MB/s",
    description: "Network I/O rate (MB/s) — all VMs or filtered to a single VM",
    dataSource:
      "getVMMetrics().network.bytesIn + bytesOut | infraStore.filteredVMs[].network",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH metrics WHERE metric_name IN ('network.bytesIn', 'network.bytesOut') AGGREGATE sum(value) GROUP BY vm_id INTERVAL {{interval}}",
        legend: "Network I/O",
        legendFormat: "{{vm_id}}",
        seriesKey: "vm_id",
      },
      {
        dialect: "promql",
        expression:
          "rate(node_network_receive_bytes_total[$__rate_interval]) + rate(node_network_transmit_bytes_total[$__rate_interval])",
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "monitoring/infra/infra-components/NetworkGraphs.vue",
    position: "graphs",
    toggleable: true,
  },
  {
    graphId: "INF10020",
    module: "INF",
    title: "VM Network Utilization",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "KB/s",
    description:
      "Network throughput rate (KB/s) — all VMs or filtered to a single VM",
    dataSource:
      "computed rate from getVMMetrics network bytes | infraStore.filteredVMs[].network",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH metrics WHERE metric_name IN ('network.bytesIn', 'network.bytesOut') AGGREGATE rate(value) GROUP BY vm_id INTERVAL {{interval}}",
        legend: "Network Rate",
        legendFormat: "{{vm_id}}",
        seriesKey: "vm_id",
      },
      {
        dialect: "promql",
        expression:
          "(rate(node_network_receive_bytes_total[$__rate_interval]) + rate(node_network_transmit_bytes_total[$__rate_interval])) / 1024",
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "monitoring/infra/infra-components/NetworkGraphs.vue",
    position: "graphs",
    toggleable: true,
  },

];
