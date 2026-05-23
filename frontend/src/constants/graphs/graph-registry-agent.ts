/**
 * Graph Registry — AGENT (AGT)
 * 24 graph definitions
 *
 * Auto-extracted from graph-registry.ts
 */

import type { GraphDefinition } from "./types";

export const AGT_GRAPHS: GraphDefinition[] = [
  // │ AGENT (AGT) - 14 graphs
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "AGT10001",
    module: "AGT",
    title: "Total Agents",
    component: "StatPanel",
    chartType: "stat",
    signalType: "infrastructure",
    unit: "count",
    description: "Total monitoring agents",
    dataSource: "agentStore.agentCount",
    defaultQueries: [
      { dialect: "tfql", expression: "FETCH agents AGGREGATE count(*)", legendFormat: "Total Agents", seriesKey: "__name__" },
    ],
    view: "monitoring/agent/index.vue",
    position: "stats-row-1",
    toggleable: false,
  },
  {
    graphId: "AGT10002",
    module: "AGT",
    title: "Online",
    component: "StatPanel",
    chartType: "stat",
    signalType: "infrastructure",
    unit: "count",
    description: "Online agents",
    dataSource: "agentStore.onlineAgents",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH agents WHERE status = 'online' AGGREGATE count(*)",
        legendFormat: "Online",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/agent/index.vue",
    position: "stats-row-1",
    toggleable: false,
  },
  {
    graphId: "AGT10003",
    module: "AGT",
    title: "Warning",
    component: "StatPanel",
    chartType: "stat",
    signalType: "infrastructure",
    unit: "count",
    description: "Agents in warning state",
    dataSource: "agentStore.warningAgents",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH agents WHERE status = 'warning' AGGREGATE count(*)",
        legendFormat: "Warning",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/agent/index.vue",
    position: "stats-row-1",
    toggleable: false,
  },
  {
    graphId: "AGT10004",
    module: "AGT",
    title: "Offline",
    component: "StatPanel",
    chartType: "stat",
    signalType: "infrastructure",
    unit: "count",
    description: "Offline agents",
    dataSource: "agentStore.offlineAgents",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH agents WHERE status = 'offline' AGGREGATE count(*)",
        legendFormat: "Offline",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/agent/index.vue",
    position: "stats-row-1",
    toggleable: false,
  },
  {
    graphId: "AGT10005",
    module: "AGT",
    title: "Avg CPU Usage",
    component: "StatPanel",
    chartType: "stat",
    signalType: "infrastructure",
    unit: "%",
    description: "Average CPU usage across agents",
    dataSource: "agentStore.avgCPUUsage",
    defaultQueries: [
      { dialect: "promql", expression: "system_cpu_utilization", legendFormat: "Avg CPU Usage", seriesKey: "__name__" },
      {
        dialect: "tfql",
        expression:
          "FETCH metrics WHERE metric_name = 'system.cpu.utilization' AGGREGATE avg(value) INTERVAL {{interval}}",
        legendFormat: "Avg CPU Usage",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/agent/index.vue",
    position: "stats-row-2",
    toggleable: false,
  },
  {
    graphId: "AGT10006",
    module: "AGT",
    title: "Avg Memory Usage",
    component: "StatPanel",
    chartType: "stat",
    signalType: "infrastructure",
    unit: "%",
    description: "Average memory usage across agents",
    dataSource: "agentStore.avgMemoryUsage",
    defaultQueries: [
      { dialect: "promql", expression: "system_memory_utilization", legendFormat: "Avg Memory Usage", seriesKey: "__name__" },
      {
        dialect: "tfql",
        expression:
          "FETCH metrics WHERE metric_name = 'system.memory.utilization' AGGREGATE avg(value) INTERVAL {{interval}}",
        legendFormat: "Avg Memory Usage",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/agent/index.vue",
    position: "stats-row-2",
    toggleable: false,
  },
  {
    graphId: "AGT10007",
    module: "AGT",
    title: "Total CPU Cores",
    component: "StatPanel",
    chartType: "stat",
    signalType: "infrastructure",
    unit: "cores",
    description: "Total CPU cores across agents",
    dataSource: "agentStore.totalCPU",
    defaultQueries: [
      { dialect: "tfql", expression: "FETCH agents AGGREGATE sum(cpu_cores)", legendFormat: "Total CPU Cores", seriesKey: "__name__" },
    ],
    view: "monitoring/agent/index.vue",
    position: "stats-row-2",
    toggleable: false,
  },
  {
    graphId: "AGT10008",
    module: "AGT",
    title: "Total Memory",
    component: "StatPanel",
    chartType: "stat",
    signalType: "infrastructure",
    unit: "bytes",
    description: "Total memory across agents",
    dataSource: "formatBytes(agentStore.totalMemory)",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH agents AGGREGATE sum(total_memory)",
        legendFormat: "Total Memory",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/agent/index.vue",
    position: "stats-row-2",
    toggleable: false,
  },
  {
    graphId: "AGT10009",
    module: "AGT",
    title: "Status",
    component: "StatPanel",
    chartType: "stat",
    signalType: "infrastructure",
    unit: "",
    description: "Agent detail status",
    dataSource: "agent.status",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH agents WHERE id = '{{agent_id}}' LIMIT 1",
        legend: "Status",
        legendFormat: "Status",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/agent/AgentDetailsPanel.vue",
    position: "detail-stats",
    toggleable: false,
  },
  {
    graphId: "AGT10010",
    module: "AGT",
    title: "CPU Cores",
    component: "StatPanel",
    chartType: "stat",
    signalType: "infrastructure",
    unit: "cores",
    description: "Agent CPU cores",
    dataSource: "agent.metrics.cpu.cores",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH agents WHERE id = '{{agent_id}}' AGGREGATE sum(cpu_cores)",
        legend: "CPU Cores",
        legendFormat: "CPU Cores",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/agent/AgentDetailsPanel.vue",
    position: "detail-stats",
    toggleable: false,
  },
  {
    graphId: "AGT10011",
    module: "AGT",
    title: "Memory",
    component: "StatPanel",
    chartType: "stat",
    signalType: "infrastructure",
    unit: "bytes",
    description: "Agent total memory",
    dataSource: "formatBytes(agent.metrics.memory.total)",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH agents WHERE id = '{{agent_id}}' AGGREGATE sum(total_memory)",
        legend: "Total Memory",
        legendFormat: "Memory",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/agent/AgentDetailsPanel.vue",
    position: "detail-stats",
    toggleable: false,
  },
  {
    graphId: "AGT10012",
    module: "AGT",
    title: "Version",
    component: "StatPanel",
    chartType: "stat",
    signalType: "infrastructure",
    unit: "",
    description: "Agent version",
    dataSource: "agent.version",
    defaultQueries: [
      {
        dialect: "tfql",
        expression: "FETCH agents WHERE id = '{{agent_id}}' LIMIT 1",
        legend: "Version",
        legendFormat: "Version",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/agent/AgentDetailsPanel.vue",
    position: "detail-stats",
    toggleable: false,
  },
  {
    graphId: "AGT10013",
    module: "AGT",
    title: "CPU Usage",
    component: "MiniChartCard",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "vCPU",
    description: "Agent CPU usage in vCPU cores trend mini chart",
    dataSource: "generateChartSeries(agent.name, usage × cores / 100)",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          'sum(rate(node_cpu_seconds_total{mode!="idle",agent="<agent>"}[$__rate_interval])) by (instance)',
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "monitoring/agent/AgentDetailsPanel.vue",
    position: "detail-trends",
    toggleable: true,
  },
  {
    graphId: "AGT10014",
    module: "AGT",
    title: "Memory Usage",
    component: "MiniChartCard",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "%",
    description: "Agent memory usage trend mini chart",
    dataSource: "generateChartSeries(agent.name, baseUsage)",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          '(1 - node_memory_MemAvailable_bytes{agent="<agent>"} / node_memory_MemTotal_bytes{agent="<agent>"}) * 100',
        legendFormat: "Memory Usage",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/agent/AgentDetailsPanel.vue",
    position: "detail-trends",
    toggleable: true,
  },
  {
    graphId: "AGT10015",
    module: "AGT",
    title: "Disk Usage",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "%",
    description:
      "Agent disk usage trend mini chart (override series from health checks)",
    dataSource: "diskSeries (agent.metrics.disk[0].usedPercent)",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          '(1 - node_filesystem_avail_bytes{agent="<agent>"} / node_filesystem_size_bytes{agent="<agent>"}) * 100',
        legendFormat: "Disk Usage",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/agent/AgentDetailsPanel.vue",
    position: "detail-trends",
    toggleable: true,
  },
  {
    graphId: "AGT10016",
    module: "AGT",
    title: "Network I/O",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "KB/s",
    description:
      "Agent network I/O trend mini chart (override series from health checks)",
    dataSource: "networkSeries (agent.metrics.network recv+sent)",
    defaultQueries: [
      {
        dialect: "promql",
        expression:
          'rate(node_network_receive_bytes_total{agent="<agent>"}[$__rate_interval]) + rate(node_network_transmit_bytes_total{agent="<agent>"}[$__rate_interval])',
        legendFormat: "Network I/O",
        seriesKey: "__name__",
      },
    ],
    view: "monitoring/agent/AgentDetailsPanel.vue",
    position: "detail-trends",
    toggleable: true,
  },

  // ┌──────────────────────────────────────────────────────────────────────────────
  // │ AGT - Agent Graphs (AGT10017–AGT10024) — full-panel charts
  // └──────────────────────────────────────────────────────────────────────────────
  {
    graphId: "AGT10017",
    module: "AGT",
    title: "CPU Usage",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "vCPU",
    description:
      "CPU usage in vCPU cores (usage% × cores) over time — all agents or filtered to a single agent",
    dataSource:
      "healthChecks[].metrics.cpu.usage × cpu.cores / 100 | agentStore.filteredAgents[].metrics.cpu.usage × cores / 100",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH metrics WHERE metric_name = 'system.cpu.time' AGGREGATE avg(value) GROUP BY agent_id INTERVAL {{interval}}",
        legend: "CPU Usage (vCPU)",
        legendFormat: "{{agent_id}}",
        seriesKey: "agent_id",
      },
      {
        dialect: "promql",
        expression:
          'sum(rate(node_cpu_seconds_total{mode!="idle"}[$__rate_interval])) by (instance)',
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "monitoring/agent/agent-components/AgentGraphs.vue",
    position: "graphs",
    toggleable: true,
  },
  {
    graphId: "AGT10018",
    module: "AGT",
    title: "CPU Utilization",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "%",
    description:
      "CPU utilization percentage — all agents or filtered to a single agent",
    dataSource:
      "healthChecks[].metrics.cpu.usage | agentStore.filteredAgents[].metrics.cpu.usage",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH metrics WHERE metric_name = 'system.cpu.utilization' AGGREGATE avg(value) GROUP BY agent_id INTERVAL {{interval}}",
        legend: "CPU Utilization",
        legendFormat: "{{agent_id}}",
        seriesKey: "agent_id",
      },
      {
        dialect: "promql",
        expression:
          'avg by (instance) (1 - rate(node_cpu_seconds_total{mode="idle"}[$__rate_interval]))',
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "monitoring/agent/agent-components/AgentGraphs.vue",
    position: "graphs",
    toggleable: true,
  },
  {
    graphId: "AGT10019",
    module: "AGT",
    title: "Memory Usage",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "GB",
    description:
      "Memory used (GB) over time — all agents or filtered to a single agent",
    dataSource:
      "healthChecks[].metrics.memory.used | agentStore.filteredAgents[].metrics.memory.used",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH metrics WHERE metric_name = 'system.memory.usage' AND state = 'used' AGGREGATE avg(value) GROUP BY agent_id INTERVAL {{interval}}",
        legend: "Memory Used",
        legendFormat: "{{agent_id}}",
        seriesKey: "agent_id",
      },
      {
        dialect: "promql",
        expression:
          "node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes",
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "monitoring/agent/agent-components/AgentGraphs.vue",
    position: "graphs",
    toggleable: true,
  },
  {
    graphId: "AGT10020",
    module: "AGT",
    title: "Memory Utilization",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "%",
    description:
      "Memory utilization percentage — all agents or filtered to a single agent",
    dataSource:
      "healthChecks[].metrics.memory.usedPercent | agentStore.filteredAgents[].metrics.memory.usedPercent",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH metrics WHERE metric_name = 'system.memory.utilization' AGGREGATE avg(value) GROUP BY agent_id INTERVAL {{interval}}",
        legend: "Memory Utilization",
        legendFormat: "{{agent_id}}",
        seriesKey: "agent_id",
      },
      {
        dialect: "promql",
        expression:
          "(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100",
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "monitoring/agent/agent-components/AgentGraphs.vue",
    position: "graphs",
    toggleable: true,
  },
  {
    graphId: "AGT10021",
    module: "AGT",
    title: "Disk Usage",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "GB",
    description:
      "Disk used (GB) over time — all agents or filtered to a single agent",
    dataSource:
      "healthChecks[].metrics.disk[0].used | agentStore.filteredAgents[].metrics.disk[0].used",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH metrics WHERE metric_name = 'system.filesystem.usage' AND state = 'used' AGGREGATE avg(value) GROUP BY agent_id INTERVAL {{interval}}",
        legend: "Disk Used",
        legendFormat: "{{agent_id}}",
        seriesKey: "agent_id",
      },
      {
        dialect: "promql",
        expression:
          'node_filesystem_size_bytes{mountpoint="/"} - node_filesystem_avail_bytes{mountpoint="/"}',
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "monitoring/agent/agent-components/AgentGraphs.vue",
    position: "graphs",
    toggleable: true,
  },
  {
    graphId: "AGT10022",
    module: "AGT",
    title: "Disk Utilization",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "%",
    description:
      "Disk utilization percentage — all agents or filtered to a single agent",
    dataSource:
      "healthChecks[].metrics.disk[0].usedPercent | agentStore.filteredAgents[].metrics.disk[0].usedPercent",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH metrics WHERE metric_name = 'system.filesystem.utilization' AGGREGATE avg(value) GROUP BY agent_id INTERVAL {{interval}}",
        legend: "Disk Utilization",
        legendFormat: "{{agent_id}}",
        seriesKey: "agent_id",
      },
      {
        dialect: "promql",
        expression:
          '(1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100',
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "monitoring/agent/agent-components/AgentGraphs.vue",
    position: "graphs",
    toggleable: true,
  },
  {
    graphId: "AGT10023",
    module: "AGT",
    title: "Network I/O",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "KB/s",
    description:
      "Network bytes received + sent — all agents or filtered to a single agent",
    dataSource:
      "healthChecks[].metrics.network[0].bytesRecv + bytesSent | agentStore.filteredAgents[].metrics.network[0]",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH metrics WHERE metric_name IN ('system.network.io') AGGREGATE sum(value) GROUP BY agent_id, direction INTERVAL {{interval}}",
        legend: "Network I/O",
        legendFormat: "{{agent_id}}",
        seriesKey: "agent_id",
      },
      {
        dialect: "promql",
        expression:
          "rate(node_network_receive_bytes_total[$__rate_interval]) + rate(node_network_transmit_bytes_total[$__rate_interval])",
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "monitoring/agent/agent-components/AgentGraphs.vue",
    position: "graphs",
    toggleable: true,
  },
  {
    graphId: "AGT10024",
    module: "AGT",
    title: "Network Utilization",
    component: "RegistryGraphPanel",
    chartType: "timeseries",
    signalType: "infrastructure",
    unit: "KB/s",
    description:
      "Network throughput rate (KB/s) — all agents or filtered to a single agent",
    dataSource:
      "computed rate from healthChecks network bytes | agentStore.filteredAgents[].metrics.network[0].bytesRecvRate+bytesSentRate",
    defaultQueries: [
      {
        dialect: "tfql",
        expression:
          "FETCH metrics WHERE metric_name = 'system.network.io' AGGREGATE rate(value) GROUP BY agent_id INTERVAL {{interval}}",
        legend: "Network Rate",
        legendFormat: "{{agent_id}}",
        seriesKey: "agent_id",
      },
      {
        dialect: "promql",
        expression:
          "(rate(node_network_receive_bytes_total[$__rate_interval]) + rate(node_network_transmit_bytes_total[$__rate_interval])) / 1024",
        legendFormat: "{{instance}}",
        seriesKey: "instance",
      },
    ],
    view: "monitoring/agent/agent-components/AgentGraphs.vue",
    position: "graphs",
    toggleable: true,
  },

];
