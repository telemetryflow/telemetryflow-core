/**
 * Container Alert Rules (Docker & Podman)
 * Based on cAdvisor metrics
 * @see https://samber.github.io/awesome-prometheus-alerts/rules#docker-containers
 */

import {
  AlertRuleTemplate,
  AlertRuleCategory,
  RuleCategory,
  DefaultThresholds,
  DefaultDurations,
} from "../../types";
import { AlertRuleBuilder, ConditionBuilder } from "../../utils";

/**
 * Containers Category Metadata
 */
export const ContainersCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.DOCKER,
    name: "Docker Containers",
    description: "Monitor container metrics including CPU, memory, and health",
    icon: "logos:docker-icon",
    exporter: "cadvisor",
    documentationUrl: "https://github.com/google/cadvisor",
    ruleCount: 15,
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

/**
 * Container Alert Rules
 */
export const ContainerRules: AlertRuleTemplate[] = [
  // ==================== HEALTH ====================
  AlertRuleBuilder.create("container-killed")
    .name("Container Killed")
    .description("A container has disappeared")
    .category(RuleCategory.DOCKER, "health")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("container_last_seen")
        .last()
        .gt(60)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "container", type: "health" })
    .annotations({
      summary: "Container killed (instance {{ $labels.instance }})",
      description:
        "A container has disappeared\n  VALUE = {{ $value }}\n  LABELS = {{ $labels }}",
    })
    .promql("time() - container_last_seen > 60")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("container-absent")
    .name("Container Absent")
    .description("A container is absent for 5 min")
    .category(RuleCategory.DOCKER, "health")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("container_last_seen")
        .last()
        .gt(300)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "container", type: "health" })
    .annotations({
      summary: "Container absent (instance {{ $labels.instance }})",
      description: "A container is absent for 5 min",
    })
    .promql("absent(container_last_seen)")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("container-restarting-frequently")
    .name("Container Restarting Frequently")
    .description("Container is restarting more than once in 5 minutes")
    .category(RuleCategory.DOCKER, "health")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("container_restart_count")
        .rate()
        .gt(1)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "container", type: "restart" })
    .annotations({
      summary: "Container restarting frequently (container {{ $labels.name }})",
      description: "Container {{ $labels.name }} is restarting frequently",
    })
    .promql("increase(container_restart_count[5m]) > 1")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  // ==================== RESOURCES ====================
  AlertRuleBuilder.create("container-high-cpu-utilization")
    .name("Container High CPU Utilization")
    .description("Container CPU utilization is above 80%")
    .category(RuleCategory.DOCKER, "resources")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("container_cpu_usage_seconds_total")
        .rate()
        .gt(DefaultThresholds.CONTAINER_CPU_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "container", type: "cpu" })
    .annotations({
      summary:
        "Container High CPU utilization (instance {{ $labels.instance }})",
      description:
        "Container CPU utilization is above 80%\n  VALUE = {{ $value }}\n  LABELS = {{ $labels }}",
    })
    .promql(
      "(sum(rate(container_cpu_usage_seconds_total[3m])) BY (instance, name) * 100) > 80",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("container-critical-cpu-utilization")
    .name("Container Critical CPU Utilization")
    .description("Container CPU utilization is above 90%")
    .category(RuleCategory.DOCKER, "resources")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("container_cpu_usage_seconds_total")
        .rate()
        .gt(DefaultThresholds.CONTAINER_CPU_CRITICAL)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "container", type: "cpu" })
    .annotations({
      summary:
        "Container Critical CPU utilization (instance {{ $labels.instance }})",
      description: "Container CPU utilization is above 90%",
    })
    .promql(
      "(sum(rate(container_cpu_usage_seconds_total[3m])) BY (instance, name) * 100) > 90",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("container-high-memory-usage")
    .name("Container High Memory Usage")
    .description("Container Memory usage is above 80%")
    .category(RuleCategory.DOCKER, "resources")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("container_memory_working_set_bytes")
        .avg()
        .gt(DefaultThresholds.CONTAINER_MEMORY_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "container", type: "memory" })
    .annotations({
      summary: "Container High Memory usage (instance {{ $labels.instance }})",
      description:
        "Container Memory usage is above 80%\n  VALUE = {{ $value }}\n  LABELS = {{ $labels }}",
    })
    .promql(
      "(sum(container_memory_working_set_bytes) BY (instance, name) / sum(container_spec_memory_limit_bytes > 0) BY (instance, name) * 100) > 80",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("container-critical-memory-usage")
    .name("Container Critical Memory Usage")
    .description("Container Memory usage is above 90%")
    .category(RuleCategory.DOCKER, "resources")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("container_memory_working_set_bytes")
        .avg()
        .gt(DefaultThresholds.CONTAINER_MEMORY_CRITICAL)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "container", type: "memory" })
    .annotations({
      summary:
        "Container Critical Memory usage (instance {{ $labels.instance }})",
      description: "Container Memory usage is above 90%",
    })
    .promql(
      "(sum(container_memory_working_set_bytes) BY (instance, name) / sum(container_spec_memory_limit_bytes > 0) BY (instance, name) * 100) > 90",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("container-high-throttle-rate")
    .name("Container High Throttle Rate")
    .description("Container is being throttled")
    .category(RuleCategory.DOCKER, "resources")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("container_cpu_cfs_throttled_seconds_total")
        .rate()
        .gt(25)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "container", type: "throttle" })
    .annotations({
      summary: "Container high throttle rate (instance {{ $labels.instance }})",
      description: "Container {{ $labels.name }} is being throttled",
    })
    .promql("rate(container_cpu_cfs_throttled_seconds_total[3m]) > 1")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("container-volume-usage")
    .name("Container Volume Usage")
    .description("Container Volume usage is above 80%")
    .category(RuleCategory.DOCKER, "resources")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("container_fs_usage_bytes")
        .avg()
        .gt(80)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "container", type: "volume" })
    .annotations({
      summary: "Container Volume usage (instance {{ $labels.instance }})",
      description: "Container Volume usage is above 80%",
    })
    .promql(
      "(1 - (container_fs_usage_bytes / container_fs_limit_bytes)) * 100 < 20",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  // ==================== NETWORK ====================
  AlertRuleBuilder.create("container-high-network-throughput-in")
    .name("Container High Network Throughput In")
    .description("Container is receiving more than 100MB/s of traffic")
    .category(RuleCategory.DOCKER, "network")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("container_network_receive_bytes_total")
        .rate()
        .gt(100000000)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "container", type: "network" })
    .annotations({
      summary:
        "Container high network throughput in (instance {{ $labels.instance }})",
      description:
        "Container {{ $labels.name }} is receiving more than 100MB/s",
    })
    .promql(
      "sum(rate(container_network_receive_bytes_total[5m])) by (instance, name) > 100000000",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("container-high-network-throughput-out")
    .name("Container High Network Throughput Out")
    .description("Container is sending more than 100MB/s of traffic")
    .category(RuleCategory.DOCKER, "network")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("container_network_transmit_bytes_total")
        .rate()
        .gt(100000000)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "container", type: "network" })
    .annotations({
      summary:
        "Container high network throughput out (instance {{ $labels.instance }})",
      description: "Container {{ $labels.name }} is sending more than 100MB/s",
    })
    .promql(
      "sum(rate(container_network_transmit_bytes_total[5m])) by (instance, name) > 100000000",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// Update category with rules
ContainersCategory.groups.forEach((group) => {
  group.rules = ContainerRules.filter((rule) => rule.subcategory === group.id);
});
