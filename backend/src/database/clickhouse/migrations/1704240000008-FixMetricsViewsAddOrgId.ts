import { ClickHouseClient } from "@clickhouse/client";
import { BaseClickHouseMigration } from "../../shared/BaseClickHouseMigration";

/**
 * Fix metrics_1m and metrics_1h materialized views to include
 * organization_id, workspace_id, tenant_id for multi-tenancy filtering.
 *
 * The original migration (1704240000003) created these views without
 * tenancy columns, causing backend queries to fail with "Missing columns: organization_id".
 */
export class FixMetricsViewsAddOrgId1704240000008 extends BaseClickHouseMigration {
  name = "FixMetricsViewsAddOrgId1704240000008";
  moduleName = "core";

  async up(client: ClickHouseClient, database: string): Promise<void> {
    this.log(
      "Fixing metrics_1m and metrics_1h views to add organization_id...",
    );

    await client.command({
      query: `DROP VIEW IF EXISTS ${database}.metrics_1m`,
    });
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.metrics_1m
        ENGINE = AggregatingMergeTree()
        PARTITION BY toYYYYMM(minute)
        ORDER BY (organization_id, service_name, metric_name, minute)
        AS SELECT
          toStartOfMinute(timestamp) AS minute,
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
        GROUP BY minute, service_name, metric_name, metric_type, organization_id, workspace_id, tenant_id
      `,
    });

    await client.command({
      query: `DROP VIEW IF EXISTS ${database}.metrics_1h`,
    });
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.metrics_1h
        ENGINE = AggregatingMergeTree()
        PARTITION BY toYYYYMM(hour)
        ORDER BY (organization_id, service_name, metric_name, hour)
        AS SELECT
          toStartOfHour(timestamp) AS hour,
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
        GROUP BY hour, service_name, metric_name, metric_type, organization_id, workspace_id, tenant_id
      `,
    });

    this.log("metrics_1m and metrics_1h views fixed with organization_id");
  }

  async down(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Reverting metrics_1m and metrics_1h to no-org version...");

    await client.command({
      query: `DROP VIEW IF EXISTS ${database}.metrics_1m`,
    });
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.metrics_1m
        ENGINE = AggregatingMergeTree()
        PARTITION BY toYYYYMM(minute)
        ORDER BY (service_name, metric_name, minute)
        AS SELECT
          toStartOfMinute(timestamp) AS minute,
          service_name,
          metric_name,
          metric_type,
          avgState(value) AS avg_value,
          minState(value) AS min_value,
          maxState(value) AS max_value,
          sumState(value) AS sum_value,
          countState() AS count
        FROM ${database}.metrics
        GROUP BY minute, service_name, metric_name, metric_type
      `,
    });

    await client.command({
      query: `DROP VIEW IF EXISTS ${database}.metrics_1h`,
    });
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.metrics_1h
        ENGINE = AggregatingMergeTree()
        PARTITION BY toYYYYMM(hour)
        ORDER BY (service_name, metric_name, hour)
        AS SELECT
          toStartOfHour(timestamp) AS hour,
          service_name,
          metric_name,
          metric_type,
          avgState(value) AS avg_value,
          minState(value) AS min_value,
          maxState(value) AS max_value,
          sumState(value) AS sum_value,
          countState() AS count
        FROM ${database}.metrics
        GROUP BY hour, service_name, metric_name, metric_type
      `,
    });
  }
}
