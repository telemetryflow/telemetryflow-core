/**
 * TFO-Agent Alert Rules
 * TelemetryFlow Agent monitoring for host metrics, health, and status
 * @see telemetryflow-agent/internal/collector/system/host.go
 */

import {
  AlertRuleTemplate,
  AlertRuleCategory,
  AlertSourceType,
  RuleCategory,
  DefaultThresholds,
  DefaultDurations,
} from "../../types";
import { AlertRuleBuilder, ConditionBuilder } from "../../utils";

// ====================== TFO-AGENT CATEGORY ======================
export const TFOAgentCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.TFO_AGENT,
    name: "TFO-Agent",
    description: "TelemetryFlow Agent monitoring for host metrics and health",
    icon: "mdi:robot",
    exporter: "tfo-agent",
    documentationUrl: "https://docs.telemetryflow.id/agent",
    ruleCount: 25,
  },
  groups: [
    {
      id: "health",
      name: "Health",
      description: "Agent health and availability",
      rules: [],
    },
    {
      id: "cpu",
      name: "CPU",
      description: "CPU metrics from agent",
      rules: [],
    },
    {
      id: "memory",
      name: "Memory",
      description: "Memory metrics from agent",
      rules: [],
    },
    {
      id: "disk",
      name: "Disk",
      description: "Disk metrics from agent",
      rules: [],
    },
    {
      id: "network",
      name: "Network",
      description: "Network metrics from agent",
      rules: [],
    },
    {
      id: "system",
      name: "System",
      description: "System-level metrics",
      rules: [],
    },
  ],
};

export const TFOAgentRules: AlertRuleTemplate[] = [
  // ====================== HEALTH ======================
  AlertRuleBuilder.create("tfo-agent-offline")
    .name("TFO-Agent Offline")
    .description("TFO-Agent has not sent heartbeat")
    .category(RuleCategory.TFO_AGENT, "health")
    .severity("critical")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_last_heartbeat_seconds")
        .last()
        .gt(DefaultThresholds.AGENT_HEARTBEAT_MISSING_CRITICAL_SEC)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "availability" })
    .annotations({
      summary: "TFO-Agent offline ({{ $labels.agent_name }})",
      description:
        "TFO-Agent {{ $labels.agent_name }} has not sent heartbeat for {{ $value }} seconds",
    })
    .promql("time() - tfo_agent_last_heartbeat_timestamp_seconds > 300")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  AlertRuleBuilder.create("tfo-agent-unhealthy")
    .name("TFO-Agent Unhealthy")
    .description("TFO-Agent is reporting unhealthy status")
    .category(RuleCategory.TFO_AGENT, "health")
    .severity("warning")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_status")
        .last()
        .neq(1) // 1 = healthy
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "health" })
    .annotations({
      summary: "TFO-Agent unhealthy ({{ $labels.agent_name }})",
      description:
        "TFO-Agent {{ $labels.agent_name }} is reporting unhealthy status",
    })
    .promql("tfo_agent_status != 1")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  AlertRuleBuilder.create("tfo-agent-high-response-time")
    .name("TFO-Agent High Response Time")
    .description("TFO-Agent response time is high")
    .category(RuleCategory.TFO_AGENT, "health")
    .severity("warning")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_response_time_ms")
        .avg()
        .gt(DefaultThresholds.AGENT_RESPONSE_TIME_WARNING_MS)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "latency" })
    .annotations({
      summary: "TFO-Agent high response time ({{ $labels.agent_name }})",
      description: "TFO-Agent response time is {{ $value }}ms",
    })
    .promql("avg_over_time(tfo_agent_response_time_ms[5m]) > 500")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  AlertRuleBuilder.create("tfo-agent-version-mismatch")
    .name("TFO-Agent Version Mismatch")
    .description("TFO-Agent version differs from expected")
    .category(RuleCategory.TFO_AGENT, "health")
    .severity("info")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_version_info")
        .count()
        .gt(1)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "version" })
    .annotations({
      summary: "Multiple TFO-Agent versions detected",
      description: "Different agent versions are running in the fleet",
    })
    .promql("count(count by (version) (tfo_agent_version_info)) > 1")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  AlertRuleBuilder.create("tfo-agent-stale")
    .name("TFO-Agent Stale Metrics")
    .description("TFO-Agent metrics are stale")
    .category(RuleCategory.TFO_AGENT, "health")
    .severity("warning")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_last_heartbeat_seconds")
        .last()
        .gt(DefaultThresholds.AGENT_HEARTBEAT_MISSING_WARNING_SEC)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "staleness" })
    .annotations({
      summary: "TFO-Agent stale metrics ({{ $labels.agent_name }})",
      description: "TFO-Agent metrics are {{ $value }}s old",
    })
    .promql("time() - tfo_agent_last_heartbeat_timestamp_seconds > 60")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  // ====================== CPU ======================
  AlertRuleBuilder.create("tfo-agent-cpu-high")
    .name("Host CPU Usage High")
    .description("Host CPU usage is high (via TFO-Agent)")
    .category(RuleCategory.TFO_AGENT, "cpu")
    .severity("warning")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_cpu_usage_percent")
        .avg()
        .gt(DefaultThresholds.CPU_USAGE_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "cpu" })
    .annotations({
      summary: "High CPU usage on {{ $labels.hostname }}",
      description: "CPU usage is {{ $value }}%",
    })
    .promql("avg_over_time(tfo_agent_cpu_usage_percent[5m]) > 80")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  AlertRuleBuilder.create("tfo-agent-cpu-critical")
    .name("Host CPU Usage Critical")
    .description("Host CPU usage is critically high (via TFO-Agent)")
    .category(RuleCategory.TFO_AGENT, "cpu")
    .severity("critical")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_cpu_usage_percent")
        .avg()
        .gt(DefaultThresholds.CPU_USAGE_CRITICAL)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "cpu" })
    .annotations({
      summary: "Critical CPU usage on {{ $labels.hostname }}",
      description: "CPU usage is {{ $value }}%",
    })
    .promql("avg_over_time(tfo_agent_cpu_usage_percent[5m]) > 90")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  AlertRuleBuilder.create("tfo-agent-load-high")
    .name("Host Load Average High")
    .description("Host load average is high (via TFO-Agent)")
    .category(RuleCategory.TFO_AGENT, "cpu")
    .severity("warning")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_load_avg_5m")
        .avg()
        .gt(DefaultThresholds.CPU_LOAD_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "load" })
    .annotations({
      summary: "High load average on {{ $labels.hostname }}",
      description: "Load average (5m) is {{ $value }}",
    })
    .promql("tfo_agent_load_avg_5m / tfo_agent_cpu_cores > 0.8")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  // ====================== MEMORY ======================
  AlertRuleBuilder.create("tfo-agent-memory-high")
    .name("Host Memory Usage High")
    .description("Host memory usage is high (via TFO-Agent)")
    .category(RuleCategory.TFO_AGENT, "memory")
    .severity("warning")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_memory_used_percent")
        .avg()
        .gt(DefaultThresholds.MEMORY_USAGE_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "memory" })
    .annotations({
      summary: "High memory usage on {{ $labels.hostname }}",
      description: "Memory usage is {{ $value }}%",
    })
    .promql("tfo_agent_memory_used_percent > 80")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  AlertRuleBuilder.create("tfo-agent-memory-critical")
    .name("Host Memory Usage Critical")
    .description("Host memory usage is critically high (via TFO-Agent)")
    .category(RuleCategory.TFO_AGENT, "memory")
    .severity("critical")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_memory_used_percent")
        .avg()
        .gt(DefaultThresholds.MEMORY_USAGE_CRITICAL)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "memory" })
    .annotations({
      summary: "Critical memory usage on {{ $labels.hostname }}",
      description: "Memory usage is {{ $value }}%",
    })
    .promql("tfo_agent_memory_used_percent > 90")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  AlertRuleBuilder.create("tfo-agent-swap-high")
    .name("Host Swap Usage High")
    .description("Host swap usage is high (via TFO-Agent)")
    .category(RuleCategory.TFO_AGENT, "memory")
    .severity("warning")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_swap_used_percent")
        .avg()
        .gt(DefaultThresholds.SWAP_USAGE_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "swap" })
    .annotations({
      summary: "High swap usage on {{ $labels.hostname }}",
      description: "Swap usage is {{ $value }}%",
    })
    .promql("tfo_agent_swap_used_percent > 50")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  AlertRuleBuilder.create("tfo-agent-oom-kill")
    .name("Host OOM Kill Detected")
    .description("OOM kill detected on host (via TFO-Agent)")
    .category(RuleCategory.TFO_AGENT, "memory")
    .severity("critical")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_oom_kills_total")
        .rate()
        .gt(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "oom" })
    .annotations({
      summary: "OOM kill on {{ $labels.hostname }}",
      description: "Out of memory kill events detected",
    })
    .promql("increase(tfo_agent_oom_kills_total[5m]) > 0")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  // ====================== DISK ======================
  AlertRuleBuilder.create("tfo-agent-disk-high")
    .name("Host Disk Usage High")
    .description("Host disk usage is high (via TFO-Agent)")
    .category(RuleCategory.TFO_AGENT, "disk")
    .severity("warning")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_disk_used_percent")
        .max()
        .gt(DefaultThresholds.DISK_USAGE_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "disk" })
    .annotations({
      summary: "High disk usage on {{ $labels.hostname }} ({{ $labels.path }})",
      description: "Disk usage is {{ $value }}%",
    })
    .promql("max by (hostname, path) (tfo_agent_disk_used_percent) > 80")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  AlertRuleBuilder.create("tfo-agent-disk-critical")
    .name("Host Disk Usage Critical")
    .description("Host disk usage is critically high (via TFO-Agent)")
    .category(RuleCategory.TFO_AGENT, "disk")
    .severity("critical")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_disk_used_percent")
        .max()
        .gt(DefaultThresholds.DISK_USAGE_CRITICAL)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "disk" })
    .annotations({
      summary:
        "Critical disk usage on {{ $labels.hostname }} ({{ $labels.path }})",
      description: "Disk usage is {{ $value }}%",
    })
    .promql("max by (hostname, path) (tfo_agent_disk_used_percent) > 90")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  AlertRuleBuilder.create("tfo-agent-disk-io-high")
    .name("Host Disk I/O High")
    .description("Host disk I/O utilization is high (via TFO-Agent)")
    .category(RuleCategory.TFO_AGENT, "disk")
    .severity("warning")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_disk_io_util_percent")
        .avg()
        .gt(DefaultThresholds.DISK_IO_UTIL_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "disk-io" })
    .annotations({
      summary: "High disk I/O on {{ $labels.hostname }}",
      description: "Disk I/O utilization is {{ $value }}%",
    })
    .promql("tfo_agent_disk_io_util_percent > 80")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  AlertRuleBuilder.create("tfo-agent-disk-latency-high")
    .name("Host Disk Latency High")
    .description("Host disk latency is high (via TFO-Agent)")
    .category(RuleCategory.TFO_AGENT, "disk")
    .severity("warning")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_disk_latency_read_ms")
        .avg()
        .gt(50)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "disk-latency" })
    .annotations({
      summary: "High disk latency on {{ $labels.hostname }}",
      description: "Disk read latency is {{ $value }}ms",
    })
    .promql(
      "tfo_agent_disk_latency_read_ms > 50 or tfo_agent_disk_latency_write_ms > 50",
    )
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  // ====================== NETWORK ======================
  AlertRuleBuilder.create("tfo-agent-network-errors")
    .name("Host Network Errors")
    .description("Host network interface has errors (via TFO-Agent)")
    .category(RuleCategory.TFO_AGENT, "network")
    .severity("warning")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_network_errors_total")
        .rate()
        .gt(DefaultThresholds.NETWORK_ERROR_RATE_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "network" })
    .annotations({
      summary:
        "Network errors on {{ $labels.hostname }} ({{ $labels.interface }})",
      description: "Network error rate is {{ $value }}/s",
    })
    .promql("rate(tfo_agent_network_errors_total[5m]) > 1")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  AlertRuleBuilder.create("tfo-agent-network-drops")
    .name("Host Network Packet Drops")
    .description("Host network interface has packet drops (via TFO-Agent)")
    .category(RuleCategory.TFO_AGENT, "network")
    .severity("warning")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_network_drops_total")
        .rate()
        .gt(DefaultThresholds.NETWORK_PACKET_DROP_WARNING)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "network" })
    .annotations({
      summary:
        "Network drops on {{ $labels.hostname }} ({{ $labels.interface }})",
      description: "Network drop rate is {{ $value }}/s",
    })
    .promql("rate(tfo_agent_network_drops_total[5m]) > 1")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  AlertRuleBuilder.create("tfo-agent-tcp-retransmits")
    .name("Host TCP Retransmits High")
    .description("Host TCP retransmit rate is high (via TFO-Agent)")
    .category(RuleCategory.TFO_AGENT, "network")
    .severity("warning")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_tcp_retransmits_total")
        .rate()
        .gt(10)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "tcp" })
    .annotations({
      summary: "High TCP retransmits on {{ $labels.hostname }}",
      description: "TCP retransmit rate is {{ $value }}/s",
    })
    .promql("rate(tfo_agent_tcp_retransmits_total[5m]) > 10")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  AlertRuleBuilder.create("tfo-agent-tcp-timewait-high")
    .name("Host TCP TIME_WAIT High")
    .description("Host TCP TIME_WAIT connections are high (via TFO-Agent)")
    .category(RuleCategory.TFO_AGENT, "network")
    .severity("info")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_tcp_connections")
        .last()
        .gt(10000)
        .duration(DefaultDurations.MEDIUM)
        .label("state", "time_wait")
        .build(),
    )
    .labels({ component: "tfo-agent", type: "tcp" })
    .annotations({
      summary: "High TIME_WAIT on {{ $labels.hostname }}",
      description: "TIME_WAIT connections: {{ $value }}",
    })
    .promql('tfo_agent_tcp_connections{state="time_wait"} > 10000')
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  // ====================== SYSTEM ======================
  AlertRuleBuilder.create("tfo-agent-uptime-reboot")
    .name("Host Rebooted")
    .description("Host has rebooted recently (via TFO-Agent)")
    .category(RuleCategory.TFO_AGENT, "system")
    .severity("info")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_uptime_seconds")
        .last()
        .lt(600) // Less than 10 minutes uptime
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "uptime" })
    .annotations({
      summary: "Host rebooted: {{ $labels.hostname }}",
      description: "Host uptime is {{ $value }} seconds",
    })
    .promql("tfo_agent_uptime_seconds < 600")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  AlertRuleBuilder.create("tfo-agent-process-count-high")
    .name("Host Process Count High")
    .description("Host process count is high (via TFO-Agent)")
    .category(RuleCategory.TFO_AGENT, "system")
    .severity("warning")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_process_count")
        .last()
        .gt(500)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "processes" })
    .annotations({
      summary: "High process count on {{ $labels.hostname }}",
      description: "Process count: {{ $value }}",
    })
    .promql("tfo_agent_process_count > 500")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),

  AlertRuleBuilder.create("tfo-agent-page-faults-high")
    .name("Host Page Faults High")
    .description("Host major page fault rate is high (via TFO-Agent)")
    .category(RuleCategory.TFO_AGENT, "system")
    .severity("warning")
    .sourceType(AlertSourceType.TFO_AGENT)
    .condition(
      ConditionBuilder.create()
        .metric("tfo_agent_page_faults_major_total")
        .rate()
        .gt(100)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "tfo-agent", type: "pagefaults" })
    .annotations({
      summary: "High page faults on {{ $labels.hostname }}",
      description: "Major page fault rate: {{ $value }}/s",
    })
    .promql("rate(tfo_agent_page_faults_major_total[5m]) > 100")
    .source("telemetryflow", "https://docs.telemetryflow.id/agent/alerts")
    .build(),
];

// Update category with rules
TFOAgentCategory.groups.forEach((group) => {
  group.rules = TFOAgentRules.filter((rule) => rule.subcategory === group.id);
});
