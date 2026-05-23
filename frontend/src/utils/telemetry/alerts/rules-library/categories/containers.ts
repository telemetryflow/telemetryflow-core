/**
 * Container Alert Rules (Docker & Podman)
 * Based on cAdvisor metrics
 */

import type { AlertRuleTemplate, AlertRuleCategory } from "../types";
import { RuleCategory, DefaultDurations, DefaultIntervals } from "../types";

export const ContainersCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.DOCKER,
    name: "Docker Containers",
    description: "Monitor container metrics including CPU, memory, and health",
    icon: "logos:docker-icon",
    exporter: "cadvisor",
    documentationUrl: "https://github.com/google/cadvisor",
    ruleCount: 10,
  },
  groups: [
    {
      id: "health",
      name: "Health",
      description: "Container health and status alerts",
      rules: [],
    },
    {
      id: "resources",
      name: "Resources",
      description: "Container resource usage alerts",
      rules: [],
    },
    {
      id: "network",
      name: "Network",
      description: "Container network alerts",
      rules: [],
    },
  ],
};

export const ContainerRules: AlertRuleTemplate[] = [
  {
    id: "container-killed",
    name: "Container Killed",
    description: "A container has disappeared",
    category: RuleCategory.DOCKER,
    subcategory: "health",
    severity: "warning",
    conditions: [
      {
        metric: "container_last_seen",
        aggregation: "last",
        operator: "gt",
        threshold: 60,
        duration: "1m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.SHORT,
    labels: { component: "container", type: "health" },
    annotations: {
      summary: "Container killed (instance {{ $labels.instance }})",
    },
    promql: "time() - container_last_seen > 60",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "container-restarting-frequently",
    name: "Container Restarting Frequently",
    description: "Container is restarting more than once in 5 minutes",
    category: RuleCategory.DOCKER,
    subcategory: "health",
    severity: "warning",
    conditions: [
      {
        metric: "container_restart_count",
        aggregation: "rate",
        operator: "gt",
        threshold: 1,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "container", type: "restart" },
    annotations: {
      summary: "Container restarting frequently (container {{ $labels.name }})",
    },
    promql: "increase(container_restart_count[5m]) > 1",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "container-high-cpu-utilization",
    name: "Container High CPU Utilization",
    description: "Container CPU utilization is above 80%",
    category: RuleCategory.DOCKER,
    subcategory: "resources",
    severity: "warning",
    conditions: [
      {
        metric: "container_cpu_usage_seconds_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 80,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "container", type: "cpu" },
    annotations: {
      summary:
        "Container High CPU utilization (instance {{ $labels.instance }})",
    },
    promql:
      "(sum(rate(container_cpu_usage_seconds_total[3m])) BY (instance, name) * 100) > 80",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "container-critical-cpu-utilization",
    name: "Container Critical CPU Utilization",
    description: "Container CPU utilization is above 90%",
    category: RuleCategory.DOCKER,
    subcategory: "resources",
    severity: "critical",
    conditions: [
      {
        metric: "container_cpu_usage_seconds_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 90,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "container", type: "cpu" },
    annotations: {
      summary:
        "Container Critical CPU utilization (instance {{ $labels.instance }})",
    },
    promql:
      "(sum(rate(container_cpu_usage_seconds_total[3m])) BY (instance, name) * 100) > 90",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "container-high-memory-usage",
    name: "Container High Memory Usage",
    description: "Container Memory usage is above 80%",
    category: RuleCategory.DOCKER,
    subcategory: "resources",
    severity: "warning",
    conditions: [
      {
        metric: "container_memory_working_set_bytes",
        aggregation: "avg",
        operator: "gt",
        threshold: 80,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "container", type: "memory" },
    annotations: {
      summary: "Container High Memory usage (instance {{ $labels.instance }})",
    },
    promql:
      "(sum(container_memory_working_set_bytes) BY (instance, name) / sum(container_spec_memory_limit_bytes > 0) BY (instance, name) * 100) > 80",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "container-critical-memory-usage",
    name: "Container Critical Memory Usage",
    description: "Container Memory usage is above 90%",
    category: RuleCategory.DOCKER,
    subcategory: "resources",
    severity: "critical",
    conditions: [
      {
        metric: "container_memory_working_set_bytes",
        aggregation: "avg",
        operator: "gt",
        threshold: 90,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "container", type: "memory" },
    annotations: {
      summary:
        "Container Critical Memory usage (instance {{ $labels.instance }})",
    },
    promql:
      "(sum(container_memory_working_set_bytes) BY (instance, name) / sum(container_spec_memory_limit_bytes > 0) BY (instance, name) * 100) > 90",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
  {
    id: "container-high-throttle-rate",
    name: "Container High Throttle Rate",
    description: "Container is being throttled",
    category: RuleCategory.DOCKER,
    subcategory: "resources",
    severity: "warning",
    conditions: [
      {
        metric: "container_cpu_cfs_throttled_seconds_total",
        aggregation: "rate",
        operator: "gt",
        threshold: 25,
        duration: "5m",
      },
    ],
    evaluationInterval: DefaultIntervals.NORMAL,
    forDuration: DefaultDurations.MEDIUM,
    labels: { component: "container", type: "throttle" },
    annotations: {
      summary: "Container high throttle rate (instance {{ $labels.instance }})",
    },
    promql: "rate(container_cpu_cfs_throttled_seconds_total[3m]) > 1",
    enabled: true,
    source: { name: "awesome-prometheus-alerts" },
  },
];

// Update category with rules
ContainersCategory.groups.forEach((group) => {
  group.rules = ContainerRules.filter((rule) => rule.subcategory === group.id);
});
