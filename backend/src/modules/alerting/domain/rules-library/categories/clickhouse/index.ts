import {
  AlertRuleTemplate,
  AlertRuleCategory,
  RuleCategory,
  DefaultDurations,
  AlertSourceType,
} from "../../types";
import { AlertRuleBuilder, ConditionBuilder } from "../../utils";

export const ClickHouseCategory: AlertRuleCategory = {
  metadata: {
    id: RuleCategory.CLICKHOUSE,
    name: "ClickHouse",
    description: "Monitor ClickHouse database metrics — system, storage, replication, and query performance",
    icon: "logos:clickhouse",
    exporter: "telemetryflow-agent",
    documentationUrl: "https://clickhouse.com/docs/en/operations/monitoring",
    ruleCount: 10,
  },
  groups: [
    {
      id: "availability",
      name: "Availability",
      description: "Instance availability and health",
      rules: [],
    },
    {
      id: "connections",
      name: "Connections",
      description: "Connection and query limits",
      rules: [],
    },
    {
      id: "replication",
      name: "Replication",
      description: "Replication lag and consistency",
      rules: [],
    },
    {
      id: "storage",
      name: "Storage",
      description: "Disk usage and merge performance",
      rules: [],
    },
    {
      id: "queries",
      name: "Query Performance",
      description: "Query duration and error rates",
      rules: [],
    },
  ],
};

export const ClickHouseRules: AlertRuleTemplate[] = [
  AlertRuleBuilder.create("clickhouse-down")
    .name("ClickHouse Down")
    .description("ClickHouse instance is unreachable or not responding")
    .category(RuleCategory.CLICKHOUSE, "availability")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("db.clickhouse.system.Uptime")
        .last()
        .eq(0)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "clickhouse", type: "availability" })
    .annotations({
      summary: "ClickHouse down (instance {{ $labels.clickhouse_instance }})",
      description: "ClickHouse instance is unreachable or not responding to health checks",
    })
    .sourceType(AlertSourceType.TFO_AGENT)
    .build(),

  AlertRuleBuilder.create("clickhouse-high-active-queries")
    .name("ClickHouse High Active Queries")
    .description("Number of active queries exceeds 80% of the configured max_queries")
    .category(RuleCategory.CLICKHOUSE, "connections")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("db.clickhouse.system.Query")
        .avg()
        .gt(80)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "clickhouse", type: "connections" })
    .annotations({
      summary: "ClickHouse high active queries (instance {{ $labels.clickhouse_instance }})",
      description: "Active query count is very high, potential overload or runaway queries",
    })
    .sourceType(AlertSourceType.TFO_AGENT)
    .build(),

  AlertRuleBuilder.create("clickhouse-replication-lag-high")
    .name("ClickHouse Replication Lag High")
    .description("Replication absolute delay exceeds 60 seconds")
    .category(RuleCategory.CLICKHOUSE, "replication")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("db.clickhouse.replica.absolute_delay")
        .avg()
        .gt(60)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "clickhouse", type: "replication" })
    .annotations({
      summary: "ClickHouse replication lag ({{ $labels.db }}.{{ $labels.table }})",
      description: "Replica is falling behind the leader by more than 60 seconds",
    })
    .sourceType(AlertSourceType.TFO_AGENT)
    .build(),

  AlertRuleBuilder.create("clickhouse-replication-lag-critical")
    .name("ClickHouse Replication Lag Critical")
    .description("Replication absolute delay exceeds 300 seconds (5 minutes)")
    .category(RuleCategory.CLICKHOUSE, "replication")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("db.clickhouse.replica.absolute_delay")
        .avg()
        .gt(300)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "clickhouse", type: "replication" })
    .annotations({
      summary: "ClickHouse replication lag CRITICAL ({{ $labels.db }}.{{ $labels.table }})",
      description: "Replica is severely behind the leader — data staleness risk",
    })
    .sourceType(AlertSourceType.TFO_AGENT)
    .build(),

  AlertRuleBuilder.create("clickhouse-replica-readonly")
    .name("ClickHouse Replica Readonly")
    .description("A replica has entered readonly mode — writes will fail")
    .category(RuleCategory.CLICKHOUSE, "replication")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("db.clickhouse.replica.is_readonly")
        .last()
        .eq(1)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "clickhouse", type: "replication" })
    .annotations({
      summary: "ClickHouse replica readonly ({{ $labels.db }}.{{ $labels.table }})",
      description: "Replica is in readonly mode, likely due to ZooKeeper issues or disk full",
    })
    .sourceType(AlertSourceType.TFO_AGENT)
    .build(),

  AlertRuleBuilder.create("clickhouse-disk-usage-high")
    .name("ClickHouse Disk Usage High")
    .description("Disk usage exceeds 80% on a ClickHouse storage volume")
    .category(RuleCategory.CLICKHOUSE, "storage")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("db.clickhouse.disk.used_percent")
        .avg()
        .gt(80)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "clickhouse", type: "storage" })
    .annotations({
      summary: "ClickHouse disk usage high (disk {{ $labels.disk }})",
      description: "Storage disk is more than 80% full — consider adding capacity or TTL rules",
    })
    .sourceType(AlertSourceType.TFO_AGENT)
    .build(),

  AlertRuleBuilder.create("clickhouse-disk-usage-critical")
    .name("ClickHouse Disk Usage Critical")
    .description("Disk usage exceeds 90% — ClickHouse may stop accepting writes")
    .category(RuleCategory.CLICKHOUSE, "storage")
    .severity("critical")
    .condition(
      ConditionBuilder.create()
        .metric("db.clickhouse.disk.used_percent")
        .avg()
        .gt(90)
        .duration(DefaultDurations.SHORT)
        .build(),
    )
    .labels({ component: "clickhouse", type: "storage" })
    .annotations({
      summary: "ClickHouse disk CRITICAL (disk {{ $labels.disk }})",
      description: "Storage disk is more than 90% full — immediate action required to prevent data loss",
    })
    .sourceType(AlertSourceType.TFO_AGENT)
    .build(),

  AlertRuleBuilder.create("clickhouse-high-query-errors")
    .name("ClickHouse High Query Error Rate")
    .description("Rate of failed queries exceeds 10 per second over 5 minutes")
    .category(RuleCategory.CLICKHOUSE, "queries")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("rate(db.clickhouse.events.FailedQuery[5m])")
        .avg()
        .gt(10)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "clickhouse", type: "queries" })
    .annotations({
      summary: "ClickHouse high query error rate (instance {{ $labels.clickhouse_instance }})",
      description: "More than 10 queries per second are failing — investigate query patterns and resource usage",
    })
    .sourceType(AlertSourceType.TFO_AGENT)
    .build(),

  AlertRuleBuilder.create("clickhouse-slow-queries")
    .name("ClickHouse Slow Queries Detected")
    .description("P95 query duration exceeds 30 seconds")
    .category(RuleCategory.CLICKHOUSE, "queries")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("db.clickhouse.query_log.duration_ms_p95")
        .avg()
        .gt(30000)
        .duration(DefaultDurations.MEDIUM)
        .build(),
    )
    .labels({ component: "clickhouse", type: "queries" })
    .annotations({
      summary: "ClickHouse slow queries (instance {{ $labels.clickhouse_instance }})",
      description: "P95 query latency is above 30s — consider optimizing queries, adding indexes, or increasing resources",
    })
    .sourceType(AlertSourceType.TFO_AGENT)
    .build(),

  AlertRuleBuilder.create("clickhouse-high-merge-pressure")
    .name("ClickHouse High Merge Pressure")
    .description("More than 100 active parts in a table indicating merge backlog")
    .category(RuleCategory.CLICKHOUSE, "storage")
    .severity("warning")
    .condition(
      ConditionBuilder.create()
        .metric("db.clickhouse.mergetree.parts_count")
        .avg()
        .gt(100)
        .duration(DefaultDurations.LONG)
        .build(),
    )
    .labels({ component: "clickhouse", type: "storage" })
    .annotations({
      summary: "ClickHouse high parts count ({{ $labels.db }}.{{ $labels.table }})",
      description: "Table has more than 100 active parts — too many small inserts or slow merges. Consider increasing insert batch size.",
    })
    .sourceType(AlertSourceType.TFO_AGENT)
    .build(),
];
