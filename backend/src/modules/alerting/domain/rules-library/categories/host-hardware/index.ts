/**
 * Host and Hardware Alert Rules
 * Based on Node Exporter metrics
 * @see https://samber.github.io/awesome-prometheus-alerts/rules#host-and-hardware
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
 * Host Hardware Category Metadata
 */
export const HostHardwareCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.HOST_HARDWARE,
    name: "Host and Hardware",
    description:
      "Monitor host system metrics including CPU, memory, disk, and network",
    icon: "carbon:bare-metal-server",
    exporter: "node-exporter",
    documentationUrl: "https://github.com/prometheus/node_exporter",
    ruleCount: 35,
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

/**
 * Host Hardware Alert Rules
 */
export const HostHardwareRules: AlertRuleTemplate[] = [
  // ==================== CPU ====================
  AlertRuleBuilder.create("host-high-cpu-load")
    .name("Host High CPU Load")
    .description("CPU load is > 80%")
    .category(RuleCategory.HOST_HARDWARE, "cpu")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("node_cpu_seconds_total")
        .rate()
        .gt(DefaultThresholds.CPU_USAGE_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .label("mode", "idle")
        .build(),
    )
    .labels({ component: "cpu", type: "utilization" })
    .annotations({
      summary: "Host high CPU load (instance {{ $labels.instance }})",
      description:
        "CPU load is > 80%\n  VALUE = {{ $value }}\n  LABELS = {{ $labels }}",
    })
    .promql(
      '100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100) > 80',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("host-critical-cpu-load")
    .name("Host Critical CPU Load")
    .description("CPU load is > 90%")
    .category(RuleCategory.HOST_HARDWARE, "cpu")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("node_cpu_seconds_total")
        .rate()
        .gt(DefaultThresholds.CPU_USAGE_CRITICAL)
        .duration(DefaultDurations.MEDIUM)
        .label("mode", "idle")
        .build(),
    )
    .labels({ component: "cpu", type: "utilization" })
    .annotations({
      summary: "Host critical CPU load (instance {{ $labels.instance }})",
      description:
        "CPU load is > 90%\n  VALUE = {{ $value }}\n  LABELS = {{ $labels }}",
    })
    .promql(
      '100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100) > 90',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("host-cpu-steal-noisy-neighbor")
    .name("Host CPU Steal Noisy Neighbor")
    .description(
      "CPU steal is > 10%. A noisy neighbor is killing VM performances.",
    )
    .category(RuleCategory.HOST_HARDWARE, "cpu")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("node_cpu_seconds_total")
        .rate()
        .gt(10)
        .duration(DefaultDurations.MEDIUM)
        .label("mode", "steal")
        .build(),
    )
    .labels({ component: "cpu", type: "steal" })
    .annotations({
      summary:
        "Host CPU steal noisy neighbor (instance {{ $labels.instance }})",
      description:
        "CPU steal is > 10%. A noisy neighbor is killing VM performances.",
    })
    .promql(
      'avg by(instance) (rate(node_cpu_seconds_total{mode="steal"}[5m])) * 100 > 10',
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  // ==================== MEMORY ====================
  AlertRuleBuilder.create("host-out-of-memory")
    .name("Host Out of Memory")
    .description("Node memory is filling up (< 10% left)")
    .category(RuleCategory.HOST_HARDWARE, "memory")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("node_memory_MemAvailable_bytes")
        .avg()
        .lt(10)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "memory", type: "utilization" })
    .annotations({
      summary: "Host out of memory (instance {{ $labels.instance }})",
      description:
        "Node memory is filling up (< 10% left)\n  VALUE = {{ $value }}\n  LABELS = {{ $labels }}",
    })
    .promql(
      "(node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100 < 10)",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("host-memory-under-pressure")
    .name("Host Memory Under Memory Pressure")
    .description(
      "The node is under heavy memory pressure. High rate of major page faults.",
    )
    .category(RuleCategory.HOST_HARDWARE, "memory")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("node_vmstat_pgmajfault")
        .rate()
        .gt(1000)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "memory", type: "pressure" })
    .annotations({
      summary: "Host memory under pressure (instance {{ $labels.instance }})",
      description: "High rate of major page faults",
    })
    .promql("rate(node_vmstat_pgmajfault[1m]) > 1000")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("host-swap-is-filling-up")
    .name("Host Swap Is Filling Up")
    .description("Swap is filling up (>80%)")
    .category(RuleCategory.HOST_HARDWARE, "memory")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("node_memory_SwapFree_bytes")
        .avg()
        .lt(20)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "memory", type: "swap" })
    .annotations({
      summary: "Host swap is filling up (instance {{ $labels.instance }})",
      description: "Swap is filling up (>80%)",
    })
    .promql(
      "(1 - (node_memory_SwapFree_bytes / node_memory_SwapTotal_bytes)) * 100 > 80",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  // ==================== DISK ====================
  AlertRuleBuilder.create("host-out-of-disk-space")
    .name("Host Out of Disk Space")
    .description("Disk is almost full (< 10% left)")
    .category(RuleCategory.HOST_HARDWARE, "disk")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("node_filesystem_avail_bytes")
        .avg()
        .lt(10)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "disk", type: "space" })
    .annotations({
      summary: "Host out of disk space (instance {{ $labels.instance }})",
      description: "Disk is almost full (< 10% left)",
    })
    .promql(
      "(node_filesystem_avail_bytes * 100) / node_filesystem_size_bytes < 10",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("host-disk-will-fill-in-24h")
    .name("Host Disk Will Fill In 24 Hours")
    .description(
      "Filesystem is predicted to run out of space within the next 24 hours",
    )
    .category(RuleCategory.HOST_HARDWARE, "disk")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("node_filesystem_avail_bytes")
        .rate()
        .lt(0)
        .duration(DefaultDurations.HOUR)
        .build(),
    )
    .labels({ component: "disk", type: "prediction" })
    .annotations({
      summary:
        "Host disk will fill in 24 hours (instance {{ $labels.instance }})",
      description:
        "Filesystem is predicted to run out of space within 24 hours",
    })
    .promql("predict_linear(node_filesystem_avail_bytes[1h], 24*3600) < 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("host-out-of-inodes")
    .name("Host Out of Inodes")
    .description("Disk is almost running out of available inodes (< 10% left)")
    .category(RuleCategory.HOST_HARDWARE, "disk")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("node_filesystem_files_free")
        .avg()
        .lt(10)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "disk", type: "inodes" })
    .annotations({
      summary: "Host out of inodes (instance {{ $labels.instance }})",
      description:
        "Disk is almost running out of available inodes (< 10% left)",
    })
    .promql("(node_filesystem_files_free / node_filesystem_files * 100 < 10)")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("host-unusual-disk-read-rate")
    .name("Host Unusual Disk Read Rate")
    .description("Disk is probably reading too much data (> 50 MB/s)")
    .category(RuleCategory.HOST_HARDWARE, "disk")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("node_disk_read_bytes_total")
        .rate()
        .gt(50000000)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "disk", type: "io" })
    .annotations({
      summary: "Host unusual disk read rate (instance {{ $labels.instance }})",
      description: "Disk is probably reading too much data (> 50 MB/s)",
    })
    .promql(
      "sum by (instance) (rate(node_disk_read_bytes_total[2m])) / 1024 / 1024 > 50",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("host-unusual-disk-write-rate")
    .name("Host Unusual Disk Write Rate")
    .description("Disk is probably writing too much data (> 50 MB/s)")
    .category(RuleCategory.HOST_HARDWARE, "disk")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("node_disk_written_bytes_total")
        .rate()
        .gt(50000000)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "disk", type: "io" })
    .annotations({
      summary: "Host unusual disk write rate (instance {{ $labels.instance }})",
      description: "Disk is probably writing too much data (> 50 MB/s)",
    })
    .promql(
      "sum by (instance) (rate(node_disk_written_bytes_total[2m])) / 1024 / 1024 > 50",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  // ==================== NETWORK ====================
  AlertRuleBuilder.create("host-unusual-network-throughput-in")
    .name("Host Unusual Network Throughput In")
    .description(
      "Host network interfaces are probably receiving too much data (> 100 MB/s)",
    )
    .category(RuleCategory.HOST_HARDWARE, "network")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("node_network_receive_bytes_total")
        .rate()
        .gt(100000000)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "network", type: "throughput" })
    .annotations({
      summary:
        "Host unusual network throughput in (instance {{ $labels.instance }})",
      description:
        "Host network interfaces are probably receiving too much data (> 100 MB/s)",
    })
    .promql(
      "sum by (instance) (rate(node_network_receive_bytes_total[2m])) / 1024 / 1024 > 100",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("host-unusual-network-throughput-out")
    .name("Host Unusual Network Throughput Out")
    .description(
      "Host network interfaces are probably sending too much data (> 100 MB/s)",
    )
    .category(RuleCategory.HOST_HARDWARE, "network")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("node_network_transmit_bytes_total")
        .rate()
        .gt(100000000)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "network", type: "throughput" })
    .annotations({
      summary:
        "Host unusual network throughput out (instance {{ $labels.instance }})",
      description:
        "Host network interfaces are probably sending too much data (> 100 MB/s)",
    })
    .promql(
      "sum by (instance) (rate(node_network_transmit_bytes_total[2m])) / 1024 / 1024 > 100",
    )
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("host-network-receive-errors")
    .name("Host Network Receive Errors")
    .description(
      'Host has encountered {{ $value | printf "%.0f" }} receive errors in the last 2 minutes.',
    )
    .category(RuleCategory.HOST_HARDWARE, "network")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("node_network_receive_errs_total")
        .rate()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "network", type: "errors" })
    .annotations({
      summary: "Host Network Receive Errors (instance {{ $labels.instance }})",
      description: "Interface {{ $labels.device }} has receive errors",
    })
    .promql("rate(node_network_receive_errs_total[2m]) > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("host-network-transmit-errors")
    .name("Host Network Transmit Errors")
    .description(
      'Host has encountered {{ $value | printf "%.0f" }} transmit errors in the last 2 minutes.',
    )
    .category(RuleCategory.HOST_HARDWARE, "network")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("node_network_transmit_errs_total")
        .rate()
        .gt(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "network", type: "errors" })
    .annotations({
      summary: "Host Network Transmit Errors (instance {{ $labels.instance }})",
      description: "Interface {{ $labels.device }} has transmit errors",
    })
    .promql("rate(node_network_transmit_errs_total[2m]) > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  // ==================== SYSTEM ====================
  AlertRuleBuilder.create("host-systemd-service-crashed")
    .name("Host systemd Service Crashed")
    .description("systemd service crashed")
    .category(RuleCategory.HOST_HARDWARE, "system")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("node_systemd_unit_state")
        .last()
        .eq(1)
        .duration(DefaultDurations.SHORT)
        .label("state", "failed")
        .build(),
    )
    .labels({ component: "systemd", type: "service" })
    .annotations({
      summary: "Host systemd service crashed (instance {{ $labels.instance }})",
      description: "systemd service {{ $labels.name }} crashed",
    })
    .promql('node_systemd_unit_state{state="failed"} == 1')
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("host-oom-kill-detected")
    .name("Host OOM Kill Detected")
    .description("OOM kill detected")
    .category(RuleCategory.HOST_HARDWARE, "system")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("node_vmstat_oom_kill")
        .rate()
        .gt(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "memory", type: "oom" })
    .annotations({
      summary: "Host OOM kill detected (instance {{ $labels.instance }})",
      description: "OOM kill detected",
    })
    .promql("increase(node_vmstat_oom_kill[1m]) > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("host-clock-skew")
    .name("Host Clock Skew")
    .description(
      "Clock skew detected. Clock is out of sync. Ensure NTP is configured correctly on this host.",
    )
    .category(RuleCategory.HOST_HARDWARE, "system")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("node_timex_offset_seconds")
        .avg()
        .gt(0.05)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "time", type: "skew" })
    .annotations({
      summary: "Host clock skew (instance {{ $labels.instance }})",
      description: "Clock skew detected. Clock is out of sync.",
    })
    .promql("abs(node_timex_offset_seconds) > 0.05")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("host-clock-not-synchronising")
    .name("Host Clock Not Synchronising")
    .description(
      "Clock not synchronising. Ensure NTP is configured on this host.",
    )
    .category(RuleCategory.HOST_HARDWARE, "system")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("node_timex_sync_status")
        .last()
        .eq(0)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "time", type: "sync" })
    .annotations({
      summary: "Host clock not synchronising (instance {{ $labels.instance }})",
      description:
        "Clock not synchronising. Ensure NTP is configured on this host.",
    })
    .promql("node_timex_sync_status == 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),

  AlertRuleBuilder.create("host-requires-reboot")
    .name("Host Requires Reboot")
    .description("The host requires a reboot")
    .category(RuleCategory.HOST_HARDWARE, "system")
    .severity("info")
    .condition(
      ConditionBuilder.create()
        .metric("node_reboot_required")
        .last()
        .eq(1)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "system", type: "reboot" })
    .annotations({
      summary: "Host requires reboot (instance {{ $labels.instance }})",
      description: "The host requires a reboot",
    })
    .promql("node_reboot_required > 0")
    .source(
      "awesome-prometheus-alerts",
      "https://samber.github.io/awesome-prometheus-alerts/",
    )
    .build(),
];

// Update category with rules
HostHardwareCategory.groups.forEach((group) => {
  group.rules = HostHardwareRules.filter(
    (rule) => rule.subcategory === group.id,
  );
});
