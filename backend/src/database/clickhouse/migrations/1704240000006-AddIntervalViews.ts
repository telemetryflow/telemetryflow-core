import { ClickHouseClient } from "@clickhouse/client";
import { BaseClickHouseMigration } from "../../shared/BaseClickHouseMigration";

/**
 * Core Telemetry Interval Views
 *
 * Adds 5m, 15m, and 6h materialized views for metrics, logs, and traces.
 * These fill the gap between existing 1m/1h/1d views, matching the frontend
 * INTERVAL_RECOMMENDATIONS from query-templates.ts:
 *   ≤1h → 1m, ≤6h → 5m, ≤24h → 15m, ≤7d → 1h, ≤30d → 6h, >30d → 1d
 */
export class AddIntervalViews1704240000006 extends BaseClickHouseMigration {
  name = "AddIntervalViews1704240000006";
  moduleName = "core";

  async up(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Creating 5m, 15m, 6h interval views for metrics, logs, traces...");

    // =========================================================================
    // Metrics — 5m rollup
    // =========================================================================
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
          countState() AS count
        FROM ${database}.metrics
        GROUP BY five_minutes, service_name, metric_name, metric_type, organization_id, workspace_id, tenant_id
      `,
    });

    // =========================================================================
    // Metrics — 15m rollup
    // =========================================================================
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
          countState() AS count
        FROM ${database}.metrics
        GROUP BY fifteen_minutes, service_name, metric_name, metric_type, organization_id, workspace_id, tenant_id
      `,
    });

    // =========================================================================
    // Metrics — 6h rollup
    // =========================================================================
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
          countState() AS count
        FROM ${database}.metrics
        GROUP BY six_hours, service_name, metric_name, metric_type, organization_id, workspace_id, tenant_id
      `,
    });

    // =========================================================================
    // Logs — 5m rollup
    // =========================================================================
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.logs_5m
        ENGINE = SummingMergeTree()
        PARTITION BY toYYYYMM(five_minutes)
        ORDER BY (five_minutes, service_name, severity_text)
        AS SELECT
          toStartOfFiveMinutes(timestamp) AS five_minutes,
          service_name,
          severity_text,
          organization_id,
          workspace_id,
          tenant_id,
          count() AS count
        FROM ${database}.logs
        GROUP BY five_minutes, service_name, severity_text, organization_id, workspace_id, tenant_id
      `,
    });

    // =========================================================================
    // Logs — 15m rollup
    // =========================================================================
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.logs_15m
        ENGINE = SummingMergeTree()
        PARTITION BY toYYYYMM(fifteen_minutes)
        ORDER BY (fifteen_minutes, service_name, severity_text)
        AS SELECT
          toStartOfFifteenMinutes(timestamp) AS fifteen_minutes,
          service_name,
          severity_text,
          organization_id,
          workspace_id,
          tenant_id,
          count() AS count
        FROM ${database}.logs
        GROUP BY fifteen_minutes, service_name, severity_text, organization_id, workspace_id, tenant_id
      `,
    });

    // =========================================================================
    // Logs — 6h rollup
    // =========================================================================
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.logs_6h
        ENGINE = SummingMergeTree()
        PARTITION BY toYYYYMM(six_hours)
        ORDER BY (six_hours, service_name, severity_text)
        AS SELECT
          toStartOfInterval(timestamp, INTERVAL 6 HOUR) AS six_hours,
          service_name,
          severity_text,
          organization_id,
          workspace_id,
          tenant_id,
          count() AS count
        FROM ${database}.logs
        GROUP BY six_hours, service_name, severity_text, organization_id, workspace_id, tenant_id
      `,
    });

    // =========================================================================
    // Traces — 5m rollup
    // =========================================================================
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
          quantileState(0.95)(duration_ns) AS p95_duration_ns,
          quantileState(0.99)(duration_ns) AS p99_duration_ns
        FROM ${database}.traces
        GROUP BY five_minutes, service_name, span_name, status_code, organization_id, workspace_id, tenant_id
      `,
    });

    // =========================================================================
    // Traces — 15m rollup
    // =========================================================================
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
          quantileState(0.95)(duration_ns) AS p95_duration_ns,
          quantileState(0.99)(duration_ns) AS p99_duration_ns
        FROM ${database}.traces
        GROUP BY fifteen_minutes, service_name, span_name, status_code, organization_id, workspace_id, tenant_id
      `,
    });

    // =========================================================================
    // Traces — 6h rollup
    // =========================================================================
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
          quantileState(0.95)(duration_ns) AS p95_duration_ns,
          quantileState(0.99)(duration_ns) AS p99_duration_ns
        FROM ${database}.traces
        GROUP BY six_hours, service_name, span_name, status_code, organization_id, workspace_id, tenant_id
      `,
    });

    this.log("All 5m, 15m, 6h interval views created for metrics, logs, traces");
  }

  async down(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Dropping 5m, 15m, 6h interval views...");

    const views = [
      "traces_6h",
      "traces_15m",
      "traces_5m",
      "logs_6h",
      "logs_15m",
      "logs_5m",
      "metrics_6h",
      "metrics_15m",
      "metrics_5m",
    ];

    for (const view of views) {
      await client.command({
        query: `DROP VIEW IF EXISTS ${database}.${view}`,
      });
    }

    this.log("Interval views dropped");
  }
}
