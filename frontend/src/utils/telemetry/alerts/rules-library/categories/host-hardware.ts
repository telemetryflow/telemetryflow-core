/**
 * Host and Hardware Alert Rules
 * Based on Node Exporter metrics
 */

import type { AlertRuleTemplate, AlertRuleCategory } from "../types";
import {
  RuleCategory,
  DefaultDurations,
  DefaultIntervals,
  AlertSourceType,
  QueryLanguage,
} from "../types";

export const HostHardwareCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.HOST_HARDWARE,
    name: "Host and Hardware",
    description:
      "Monitor host system metrics including CPU, memory, disk, and network",
    icon: "carbon:bare-metal-server",
    exporter: "node-exporter",
    documentationUrl: "https://github.com/prometheus/node_exporter",
    ruleCount: 24,
  },
  groups: [
    {
      id: "cpu",
      name: "CPU",
      description: "CPU utilization and load alerts",
      rules: [],
    },
    {
      id: "memory",
      name: "Memory",
      description: "Memory and swap usage alerts",
      rules: [],
    },
    {
      id: "disk",
      name: "Disk",
      description: "Disk space and I/O alerts",
      rules: [],
    },
    {
      id: "network",
      name: "Network",
      description: "Network interface alerts",
      rules: [],
    },
    {
      id: "system",
      name: "System",
      description: "General system health alerts",
      rules: [],
    },
  ],
};

export const HostHardwareRules: AlertRuleTemplate[] = [
  // CPU
  {
    id: "host-high-cpu-load",
    name: "Host High CPU Load",
    description: "CPU load is > 80%",
    category: RuleCategory.HOST_HARDWARE,
    subcategory: "cpu",
    severity: "warning",
    conditions: [
      {
        metric: "node_cpu_seconds_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 80,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "cpu", type: "utilization" },
    annotations: {
      summary: "Host high CPU load (instance {{ $labels.instance }})",
    },
    promql:
      '100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100) > 80',
    enabled: true,
    source: {
      name: "awesome-prometheus-alerts",
      url: "https://samber.github.io/awesome-prometheus-alerts/",
    },
  },
  {
    id: "host-critical-cpu-load",
    name: "Host Critical CPU Load",
    description: "CPU load is > 90%",
    category: RuleCategory.HOST_HARDWARE,
    subcategory: "cpu",
    severity: "critical",
    conditions: [
      {
        metric: "node_cpu_seconds_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 90,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "cpu", type: "utilization" },
    annotations: {
      summary: "Host critical CPU load (instance {{ $labels.instance }})",
    },
    promql:
      '100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100) > 90',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  // Memory
  {
    id: "host-out-of-memory",
    name: "Host Out of Memory",
    description: "Node memory is filling up (< 10% left)",
    category: RuleCategory.HOST_HARDWARE,
    subcategory: "memory",
    severity: "warning",
    conditions: [
      {
        metric: "node_memory_MemAvailable_bytes",
        aggregation: "avg",
        operator: "lt",
        threshold: 10,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "memory", type: "utilization" },
    annotations: {
      summary: "Host out of memory (instance {{ $labels.instance }})",
    },
    promql:
      "(node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100 < 10)",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "host-swap-is-filling-up",
    name: "Host Swap Is Filling Up",
    description: "Swap is filling up (>80%)",
    category: RuleCategory.HOST_HARDWARE,
    subcategory: "memory",
    severity: "warning",
    conditions: [
      {
        metric: "node_memory_SwapFree_bytes",
        aggregation: "avg",
        operator: "lt",
        threshold: 20,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "memory", type: "swap" },
    annotations: {
      summary: "Host swap is filling up (instance {{ $labels.instance }})",
    },
    promql:
      "(1 - (node_memory_SwapFree_bytes / node_memory_SwapTotal_bytes)) * 100 > 80",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  // Disk
  {
    id: "host-out-of-disk-space",
    name: "Host Out of Disk Space",
    description: "Disk is almost full (< 10% left)",
    category: RuleCategory.HOST_HARDWARE,
    subcategory: "disk",
    severity: "warning",
    conditions: [
      {
        metric: "node_filesystem_avail_bytes",
        aggregation: "avg",
        operator: "lt",
        threshold: 10,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "disk", type: "space" },
    annotations: {
      summary: "Host out of disk space (instance {{ $labels.instance }})",
    },
    promql:
      "(node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes < 10",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "host-disk-will-fill-in-24h",
    name: "Host Disk Will Fill In 24 Hours",
    description: "Filesystem is predicted to run out of space within 24 hours",
    category: RuleCategory.HOST_HARDWARE,
    subcategory: "disk",
    severity: "warning",
    conditions: [
      {
        metric: "node_filesystem_avail_bytes",
        aggregation: "rate",
        operator: "lt",
        threshold: 0,
        duration: "1h",
      },
    ],
    evaluationInterval: DefaultIntervals.SLOW,
    forDuration: DefaultDurations.HOUR,
    labels: { component: "disk", type: "prediction" },
    annotations: {
      summary:
        "Host disk will fill in 24 hours (instance {{ $labels.instance }})",
    },
    promql: "predict_linear(node_filesystem_avail_bytes[1h], 24*3600) < 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "host-out-of-inodes",
    name: "Host Out of Inodes",
    description: "Disk is almost running out of available inodes (< 10% left)",
    category: RuleCategory.HOST_HARDWARE,
    subcategory: "disk",
    severity: "warning",
    conditions: [
      {
        metric: "node_filesystem_files_free",
        aggregation: "avg",
        operator: "lt",
        threshold: 10,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "disk", type: "inodes" },
    annotations: {
      summary: "Host out of inodes (instance {{ $labels.instance }})",
    },
    promql: "(node_filesystem_files_free / node_filesystem_files * 100 < 10)",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  // Network
  {
    id: "host-unusual-network-throughput-in",
    name: "Host Unusual Network Throughput In",
    description:
      "Host network interfaces are receiving too much data (> 100 MB/s)",
    category: RuleCategory.HOST_HARDWARE,
    subcategory: "network",
    severity: "warning",
    conditions: [
      {
        metric: "node_network_receive_bytes_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 100000000,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "network", type: "throughput" },
    annotations: {
      summary:
        "Host unusual network throughput in (instance {{ $labels.instance }})",
    },
    promql:
      "sum by (instance) (rate(node_network_receive_bytes_total[2m])) / 1024 / 1024 > 100",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "host-unusual-network-throughput-out",
    name: "Host Unusual Network Throughput Out",
    description:
      "Host network interfaces are sending too much data (> 100 MB/s)",
    category: RuleCategory.HOST_HARDWARE,
    subcategory: "network",
    severity: "warning",
    conditions: [
      {
        metric: "node_network_transmit_bytes_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 100000000,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "network", type: "throughput" },
    annotations: {
      summary:
        "Host unusual network throughput out (instance {{ $labels.instance }})",
    },
    promql:
      "sum by (instance) (rate(node_network_transmit_bytes_total[2m])) / 1024 / 1024 > 100",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  // System
  {
    id: "host-systemd-service-crashed",
    name: "Host systemd Service Crashed",
    description: "systemd service crashed",
    category: RuleCategory.HOST_HARDWARE,
    subcategory: "system",
    severity: "warning",
    conditions: [
      {
        metric: "node_systemd_unit_state",
        aggregation: "last",
        operator: "eq",
        threshold: 1,
        duration: "1m",
        labels: { state: "failed" },
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "systemd", type: "service" },
    annotations: {
      summary: "Host systemd service crashed (instance {{ $labels.instance }})",
    },
    promql: 'node_systemd_unit_state{state="failed"} == 1',
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "host-oom-kill-detected",
    name: "Host OOM Kill Detected",
    description: "OOM kill detected",
    category: RuleCategory.HOST_HARDWARE,
    subcategory: "system",
    severity: "warning",
    conditions: [
      {
        metric: "node_vmstat_oom_kill",
        aggregation: "rate",
        operator: "gt",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "memory", type: "oom" },
    annotations: {
      summary: "Host OOM kill detected (instance {{ $labels.instance }})",
    },
    promql: "increase(node_vmstat_oom_kill[1m]) > 0",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "host-clock-skew",
    name: "Host Clock Skew",
    description: "Clock skew detected. Ensure NTP is configured correctly.",
    category: RuleCategory.HOST_HARDWARE,
    subcategory: "system",
    severity: "warning",
    conditions: [
      {
        metric: "node_timex_offset_seconds",
        aggregation: "avg",
        operator: "gt",
        threshold: 0.05,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "time", type: "skew" },
    annotations: {
      summary: "Host clock skew (instance {{ $labels.instance }})",
    },
    promql: "abs(node_timex_offset_seconds) > 0.05",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },

  // ─── TFO Platform Rules (PromQL via TFO-Agent) ───────────────────────────
  {
    id: "tfo-high-cpu-usage",
    name: "High CPU Usage",
    description: "Alert when CPU usage exceeds 80% for 5 minutes",
    category: RuleCategory.HOST_HARDWARE,
    subcategory: "cpu",
    severity: "critical",
    sourceType: AlertSourceType.TFO_AGENT,
    queryLanguage: QueryLanguage.PROMQL,
    conditions: [
      {
        metric: "node_cpu_seconds_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 0.8,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { team: "infrastructure", component: "cpu" },
    annotations: {
      summary: "High CPU usage detected on {{ $labels.instance }}",
      description: 'CPU usage is {{ $value | printf "%.2f" }}%',
    },
    promql: 'avg by (instance) (rate(node_cpu_seconds_total{mode!="idle"}[5m])) > 0.8',
    enabled: true,
    source: { name: "TelemetryFlow" },
  },
  {
    id: "tfo-high-memory-usage",
    name: "High Memory Usage",
    description: "Alert when memory usage exceeds 85%",
    category: RuleCategory.HOST_HARDWARE,
    subcategory: "memory",
    severity: "warning",
    sourceType: AlertSourceType.TFO_AGENT,
    queryLanguage: QueryLanguage.PROMQL,
    conditions: [
      {
        metric: "node_memory_MemAvailable_bytes",
        aggregation: "avg",
        operator: "lt",
        threshold: 0.15,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { team: "infrastructure", component: "memory" },
    annotations: {
      summary: "High memory usage on {{ $labels.instance }}",
      description: 'Memory usage is {{ $value | printf "%.2f" }}%',
    },
    promql: "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) > 0.85",
    enabled: true,
    source: { name: "TelemetryFlow" },
  },
  {
    id: "tfo-service-down",
    name: "Service Down",
    description: "Alert when a service is not responding",
    category: RuleCategory.HOST_HARDWARE,
    subcategory: "system",
    severity: "critical",
    sourceType: AlertSourceType.TFO_AGENT,
    queryLanguage: QueryLanguage.PROMQL,
    conditions: [
      {
        metric: "up",
        aggregation: "last",
        operator: "eq",
        threshold: 0,
        duration: "1m",
      },
    ],
    evaluationInterval: "30s",
    forDuration: DefaultDurations.SHORT,
    labels: { team: "platform", type: "availability" },
    annotations: {
      summary: "Service {{ $labels.job }} is down",
      description: "Target {{ $labels.instance }} is unreachable",
    },
    promql: "up == 0",
    enabled: true,
    source: { name: "TelemetryFlow" },
  },
  {
    id: "tfo-high-error-rate",
    name: "High Error Rate",
    description: "Alert when HTTP error rate exceeds 5%",
    category: RuleCategory.HOST_HARDWARE,
    subcategory: "network",
    severity: "warning",
    sourceType: AlertSourceType.TFO_AGENT,
    queryLanguage: QueryLanguage.PROMQL,
    conditions: [
      {
        metric: "http_requests_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 0.05,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { team: "application", type: "error-rate" },
    annotations: {
      summary: "High error rate detected",
      description: 'Error rate is {{ $value | printf "%.2f" }}%',
    },
    promql: 'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05',
    enabled: true,
    source: { name: "TelemetryFlow" },
  },
];

// Update category with rules
HostHardwareCategory.groups.forEach((group) => {
  group.rules = HostHardwareRules.filter(
    (rule) => rule.subcategory === group.id,
  );
});
