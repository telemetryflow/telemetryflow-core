import { ClickHouseClient } from "@clickhouse/client";
import { BaseClickHouseMigration } from "../../shared/BaseClickHouseMigration";

/**
 * Add percentile quantileState columns to metrics and traces MVs.
 *
 * Metrics MVs gain: p50, p75, p90, p95, p99 quantileState(value)
 * Traces MVs gain: p75, p90 quantileState(duration_ns) (p50/p95/p99 already exist)
 *
 * Requires DROP + recreate because ClickHouse MVs with inline storage
 * cannot be ALTERed to add aggregate columns.
 */
export class AddPercentileColumns1704240000007 extends BaseClickHouseMigration {
  name = "AddPercentileColumns1704240000007";
  moduleName = "core";

  async up(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Recreating metrics & traces MVs with full percentile columns...");

    // ═══════════════════════════════════════════════════════════════════════
    // Drop existing metrics interval views (5m, 15m, 6h)
    // ═══════════════════════════════════════════════════════════════════════
    for (const view of ["metrics_5m", "metrics_15m", "metrics_6h"]) {
      await client.command({ query: `DROP VIEW IF EXISTS ${database}.${view}` });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Drop existing traces interval views (5m, 15m, 6h)
    // ═══════════════════════════════════════════════════════════════════════
    for (const view of ["traces_5m", "traces_15m", "traces_6h"]) {
      await client.command({ query: `DROP VIEW IF EXISTS ${database}.${view}` });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Metrics — 5m with percentiles
    // ═══════════════════════════════════════════════════════════════════════
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.metrics_5m
        ENGINE = AggregatingMergeTree()
        PARTITION BY toYYYYMM(five_minutes)
        ORDER BY (service_name, metric_name, five_minutes)
        AS SELECT
          toStartOfFiveMinutes(timestamp) AS five_minutes,
          service_name,
          metric_name,
          metric_type,
          organization_id,
          workspace_id,
          tenant_id,
          avgState(value) AS avg_value,
          minState(value) AS min_value,
          maxState(value) AS max_value,
          sumState(value) AS sum_value,
          countState() AS count,
          quantileState(0.50)(value) AS p50_value,
          quantileState(0.75)(value) AS p75_value,
          quantileState(0.90)(value) AS p90_value,
          quantileState(0.95)(value) AS p95_value,
          quantileState(0.99)(value) AS p99_value
        FROM ${database}.metrics
        GROUP BY five_minutes, service_name, metric_name, metric_type, organization_id, workspace_id, tenant_id
      `,
    });

    // ═══════════════════════════════════════════════════════════════════════
    // Metrics — 15m with percentiles
    // ═══════════════════════════════════════════════════════════════════════
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.metrics_15m
        ENGINE = AggregatingMergeTree()
        PARTITION BY toYYYYMM(fifteen_minutes)
        ORDER BY (service_name, metric_name, fifteen_minutes)
        AS SELECT
          toStartOfFifteenMinutes(timestamp) AS fifteen_minutes,
          service_name,
          metric_name,
          metric_type,
          organization_id,
          workspace_id,
          tenant_id,
          avgState(value) AS avg_value,
          minState(value) AS min_value,
          maxState(value) AS max_value,
          sumState(value) AS sum_value,
          countState() AS count,
          quantileState(0.50)(value) AS p50_value,
          quantileState(0.75)(value) AS p75_value,
          quantileState(0.90)(value) AS p90_value,
          quantileState(0.95)(value) AS p95_value,
          quantileState(0.99)(value) AS p99_value
        FROM ${database}.metrics
        GROUP BY fifteen_minutes, service_name, metric_name, metric_type, organization_id, workspace_id, tenant_id
      `,
    });

    // ═══════════════════════════════════════════════════════════════════════
    // Metrics — 6h with percentiles
    // ═══════════════════════════════════════════════════════════════════════
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.metrics_6h
        ENGINE = AggregatingMergeTree()
        PARTITION BY toYYYYMM(six_hours)
        ORDER BY (service_name, metric_name, six_hours)
        AS SELECT
          toStartOfInterval(timestamp, INTERVAL 6 HOUR) AS six_hours,
          service_name,
          metric_name,
          metric_type,
          organization_id,
          workspace_id,
          tenant_id,
          avgState(value) AS avg_value,
          minState(value) AS min_value,
          maxState(value) AS max_value,
          sumState(value) AS sum_value,
          countState() AS count,
          quantileState(0.50)(value) AS p50_value,
          quantileState(0.75)(value) AS p75_value,
          quantileState(0.90)(value) AS p90_value,
          quantileState(0.95)(value) AS p95_value,
          quantileState(0.99)(value) AS p99_value
        FROM ${database}.metrics
        GROUP BY six_hours, service_name, metric_name, metric_type, organization_id, workspace_id, tenant_id
      `,
    });

    // ═══════════════════════════════════════════════════════════════════════
    // Traces — 5m with p75/p90
    // ═══════════════════════════════════════════════════════════════════════
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.traces_5m
        ENGINE = AggregatingMergeTree()
        PARTITION BY toYYYYMM(five_minutes)
        ORDER BY (five_minutes, service_name, span_name, status_code)
        AS SELECT
          toStartOfFiveMinutes(timestamp) AS five_minutes,
          service_name,
          span_name,
          status_code,
          organization_id,
          workspace_id,
          tenant_id,
          countState() AS count,
          avgState(duration_ns) AS avg_duration_ns,
          maxState(duration_ns) AS max_duration_ns,
          minState(duration_ns) AS min_duration_ns,
          quantileState(0.50)(duration_ns) AS p50_duration_ns,
          quantileState(0.75)(duration_ns) AS p75_duration_ns,
          quantileState(0.90)(duration_ns) AS p90_duration_ns,
          quantileState(0.95)(duration_ns) AS p95_duration_ns,
          quantileState(0.99)(duration_ns) AS p99_duration_ns
        FROM ${database}.traces
        GROUP BY five_minutes, service_name, span_name, status_code, organization_id, workspace_id, tenant_id
      `,
    });

    // ═══════════════════════════════════════════════════════════════════════
    // Traces — 15m with p75/p90
    // ═══════════════════════════════════════════════════════════════════════
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.traces_15m
        ENGINE = AggregatingMergeTree()
        PARTITION BY toYYYYMM(fifteen_minutes)
        ORDER BY (fifteen_minutes, service_name, span_name, status_code)
        AS SELECT
          toStartOfFifteenMinutes(timestamp) AS fifteen_minutes,
          service_name,
          span_name,
          status_code,
          organization_id,
          workspace_id,
          tenant_id,
          countState() AS count,
          avgState(duration_ns) AS avg_duration_ns,
          maxState(duration_ns) AS max_duration_ns,
          minState(duration_ns) AS min_duration_ns,
          quantileState(0.50)(duration_ns) AS p50_duration_ns,
          quantileState(0.75)(duration_ns) AS p75_duration_ns,
          quantileState(0.90)(duration_ns) AS p90_duration_ns,
          quantileState(0.95)(duration_ns) AS p95_duration_ns,
          quantileState(0.99)(duration_ns) AS p99_duration_ns
        FROM ${database}.traces
        GROUP BY fifteen_minutes, service_name, span_name, status_code, organization_id, workspace_id, tenant_id
      `,
    });

    // ═══════════════════════════════════════════════════════════════════════
    // Traces — 6h with p75/p90
    // ═══════════════════════════════════════════════════════════════════════
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.traces_6h
        ENGINE = AggregatingMergeTree()
        PARTITION BY toYYYYMM(six_hours)
        ORDER BY (six_hours, service_name, span_name, status_code)
        AS SELECT
          toStartOfInterval(timestamp, INTERVAL 6 HOUR) AS six_hours,
          service_name,
          span_name,
          status_code,
          organization_id,
          workspace_id,
          tenant_id,
          countState() AS count,
          avgState(duration_ns) AS avg_duration_ns,
          maxState(duration_ns) AS max_duration_ns,
          minState(duration_ns) AS min_duration_ns,
          quantileState(0.50)(duration_ns) AS p50_duration_ns,
          quantileState(0.75)(duration_ns) AS p75_duration_ns,
          quantileState(0.90)(duration_ns) AS p90_duration_ns,
          quantileState(0.95)(duration_ns) AS p95_duration_ns,
          quantileState(0.99)(duration_ns) AS p99_duration_ns
        FROM ${database}.traces
        GROUP BY six_hours, service_name, span_name, status_code, organization_id, workspace_id, tenant_id
      `,
    });

    this.log("Metrics & traces MVs recreated with full percentile columns");
  }

  async down(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Reverting to original MVs without extended percentiles...");

    // Drop the enhanced MVs
    for (const view of [
      "traces_6h", "traces_15m", "traces_5m",
      "metrics_6h", "metrics_15m", "metrics_5m",
    ]) {
      await client.command({ query: `DROP VIEW IF EXISTS ${database}.${view}` });
    }

    // Note: The original MVs from AddIntervalViews1704240000006 would need
    // to be re-run to restore the previous schema. This down() only drops.
    this.log("Enhanced percentile MVs dropped (re-run migration 006 to restore originals)");
  }
}
