import { ClickHouseClient } from "@clickhouse/client";
import { BaseClickHouseMigration } from "../../shared/BaseClickHouseMigration";

export class AddOptimizationViews1704240000005 extends BaseClickHouseMigration {
  name = "AddOptimizationViews1704240000005";
  moduleName = "core";

  async up(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Creating optimization materialized views...");

    // Create daily metrics aggregation view
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.metrics_1d
        ENGINE = AggregatingMergeTree()
        PARTITION BY toYYYYMM(day)
        ORDER BY (service_name, metric_name, day)
        AS SELECT
          toDate(timestamp) AS day,
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
        GROUP BY day, service_name, metric_name, metric_type, organization_id, workspace_id, tenant_id
      `,
    });

    // Create hourly log volume view
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.logs_1h
        ENGINE = SummingMergeTree()
        PARTITION BY toYYYYMM(hour)
        ORDER BY (hour, service_name, severity_text)
        AS SELECT
          toStartOfHour(timestamp) AS hour,
          service_name,
          severity_text,
          organization_id,
          workspace_id,
          tenant_id,
          count() AS count
        FROM ${database}.logs
        GROUP BY hour, service_name, severity_text, organization_id, workspace_id, tenant_id
      `,
    });

    // Create hourly trace latency percentiles view
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.traces_1h
        ENGINE = AggregatingMergeTree()
        PARTITION BY toYYYYMM(hour)
        ORDER BY (hour, service_name, span_name, status_code)
        AS SELECT
          toStartOfHour(timestamp) AS hour,
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
        GROUP BY hour, service_name, span_name, status_code, organization_id, workspace_id, tenant_id
      `,
    });

    // Create hourly service error rates view
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.service_error_rates_1h
        ENGINE = SummingMergeTree()
        PARTITION BY toYYYYMM(hour)
        ORDER BY (hour, service_name)
        AS SELECT
          toStartOfHour(timestamp) AS hour,
          service_name,
          organization_id,
          workspace_id,
          tenant_id,
          count() AS total_requests,
          countIf(status_code = 'ERROR') AS error_count
        FROM ${database}.traces
        GROUP BY hour, service_name, organization_id, workspace_id, tenant_id
      `,
    });

    // Create hourly service latency percentiles view
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.service_latency_percentiles_1h
        ENGINE = AggregatingMergeTree()
        PARTITION BY toYYYYMM(hour)
        ORDER BY (hour, service_name)
        AS SELECT
          toStartOfHour(timestamp) AS hour,
          service_name,
          organization_id,
          workspace_id,
          tenant_id,
          countState() AS request_count,
          avgState(duration_ns) AS avg_duration_ns,
          quantileState(0.50)(duration_ns) AS p50_duration_ns,
          quantileState(0.75)(duration_ns) AS p75_duration_ns,
          quantileState(0.90)(duration_ns) AS p90_duration_ns,
          quantileState(0.95)(duration_ns) AS p95_duration_ns,
          quantileState(0.99)(duration_ns) AS p99_duration_ns
        FROM ${database}.traces
        GROUP BY hour, service_name, organization_id, workspace_id, tenant_id
      `,
    });

    this.log("Optimization views created");
  }

  async down(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Dropping optimization materialized views...");

    await client.command({
      query: `DROP VIEW IF EXISTS ${database}.service_latency_percentiles_1h`,
    });
    await client.command({
      query: `DROP VIEW IF EXISTS ${database}.service_error_rates_1h`,
    });
    await client.command({
      query: `DROP VIEW IF EXISTS ${database}.traces_1h`,
    });
    await client.command({
      query: `DROP VIEW IF EXISTS ${database}.logs_1h`,
    });
    await client.command({
      query: `DROP VIEW IF EXISTS ${database}.metrics_1d`,
    });

    this.log("Optimization views dropped");
  }
}
