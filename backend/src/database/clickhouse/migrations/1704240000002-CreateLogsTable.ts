import { ClickHouseClient } from "@clickhouse/client";
import { BaseClickHouseMigration } from "../../shared/BaseClickHouseMigration";

export class CreateLogsTable1704240000002 extends BaseClickHouseMigration {
  name = "CreateLogsTable1704240000002";
  moduleName = "core";

  async up(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Creating logs table and views...");

    // Create logs table
    await client.command({
      query: `
        CREATE TABLE IF NOT EXISTS ${database}.logs (
          -- Timestamps
          timestamp DateTime64(9),
          observed_timestamp DateTime64(9) DEFAULT now64(9),

          -- Trace correlation
          trace_id String,
          span_id String,
          trace_flags UInt32,

          -- Severity
          severity_text String,
          severity_number UInt8,

          -- Service information
          service_name String,

          -- Multi-tenancy
          organization_id String DEFAULT '',
          workspace_id String DEFAULT '',
          tenant_id String DEFAULT '',

          -- Log content
          body String,

          -- Attributes
          resource_attributes Map(String, String),
          scope_name String,
          scope_version String,
          log_attributes Map(String, String)
        )
        ENGINE = MergeTree()
        PARTITION BY toYYYYMMDD(timestamp)
        ORDER BY (service_name, timestamp)
        TTL toDateTime(timestamp) + INTERVAL 30 DAY
        SETTINGS index_granularity = 8192
      `,
    });

    // Create indexes
    const indexes = [
      { name: "idx_timestamp", column: "timestamp", type: "minmax" },
      { name: "idx_trace_id", column: "trace_id", type: "bloom_filter" },
      {
        name: "idx_service_name",
        column: "service_name",
        type: "bloom_filter",
      },
      { name: "idx_severity", column: "severity_text", type: "set(10)" },
      {
        name: "idx_organization_id",
        column: "organization_id",
        type: "bloom_filter",
      },
      {
        name: "idx_workspace_id",
        column: "workspace_id",
        type: "bloom_filter",
      },
      { name: "idx_tenant_id", column: "tenant_id", type: "bloom_filter" },
    ];

    for (const idx of indexes) {
      try {
        await client.command({
          query: `ALTER TABLE ${database}.logs ADD INDEX IF NOT EXISTS ${idx.name} ${idx.column} TYPE ${idx.type} GRANULARITY 1`,
        });
      } catch {
        // Index might already exist
      }
    }

    // Create materialized view for log statistics
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.logs_stats
        ENGINE = SummingMergeTree()
        PARTITION BY toYYYYMM(date)
        ORDER BY (date, service_name, severity_text)
        AS SELECT
          toDate(timestamp) AS date,
          service_name,
          severity_text,
          count() AS count
        FROM ${database}.logs
        GROUP BY date, service_name, severity_text
      `,
    });

    // Create materialized view for error logs
    await client.command({
      query: `
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${database}.logs_errors
        ENGINE = MergeTree()
        PARTITION BY toYYYYMM(date)
        ORDER BY (date, service_name, timestamp)
        AS SELECT
          toDate(timestamp) AS date,
          timestamp,
          service_name,
          severity_text,
          body,
          trace_id,
          organization_id,
          workspace_id,
          tenant_id
        FROM ${database}.logs
        WHERE severity_number >= 17
      `,
    });

    this.log("Logs table and views created");
  }

  async down(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Dropping logs table and views...");

    await client.command({
      query: `DROP VIEW IF EXISTS ${database}.logs_errors`,
    });
    await client.command({
      query: `DROP VIEW IF EXISTS ${database}.logs_stats`,
    });
    await client.command({
      query: `DROP TABLE IF EXISTS ${database}.logs`,
    });

    this.log("Logs table and views dropped");
  }
}
