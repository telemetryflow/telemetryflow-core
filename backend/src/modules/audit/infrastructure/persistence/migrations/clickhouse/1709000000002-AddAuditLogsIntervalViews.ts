import { ClickHouseClient } from "@clickhouse/client";
import { BaseClickHouseMigration } from "../../../../../../database/shared/BaseClickHouseMigration";

/**
 * Audit Logs Interval Views
 *
 * Adds 5m, 15m, 1h, and 6h materialized views.
 * Existing views only cover daily stats. This adds sub-day granularity
 * matching the frontend INTERVAL_RECOMMENDATIONS.
 */
export class AddAuditLogsIntervalViews1709000000002 extends BaseClickHouseMigration {
  name = "AddAuditLogsIntervalViews1709000000002";
  moduleName = "audit";

  async up(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Creating audit_logs 5m, 15m, 1h, 6h interval views...");

    // 5-minute rollup
    const fiveMinViewExists = await this.viewExists(
      client,
      database,
      "audit_logs_5m",
    );
    if (!fiveMinViewExists) {
      await client.command({
        query: `
          CREATE MATERIALIZED VIEW ${database}.audit_logs_5m
          ENGINE = SummingMergeTree()
          PARTITION BY toYYYYMM(five_minutes)
          ORDER BY (five_minutes, event_type, result, organization_id)
          AS SELECT
            toStartOfFiveMinutes(timestamp) AS five_minutes,
            event_type,
            result,
            organization_id,
            tenant_id,
            count() AS count
          FROM ${database}.audit_logs
          GROUP BY five_minutes, event_type, result, organization_id, tenant_id
        `,
      });
      this.log("Created materialized view: audit_logs_5m");
    }

    // 15-minute rollup
    const fifteenMinViewExists = await this.viewExists(
      client,
      database,
      "audit_logs_15m",
    );
    if (!fifteenMinViewExists) {
      await client.command({
        query: `
          CREATE MATERIALIZED VIEW ${database}.audit_logs_15m
          ENGINE = SummingMergeTree()
          PARTITION BY toYYYYMM(fifteen_minutes)
          ORDER BY (fifteen_minutes, event_type, result, organization_id)
          AS SELECT
            toStartOfFifteenMinutes(timestamp) AS fifteen_minutes,
            event_type,
            result,
            organization_id,
            tenant_id,
            count() AS count
          FROM ${database}.audit_logs
          GROUP BY fifteen_minutes, event_type, result, organization_id, tenant_id
        `,
      });
      this.log("Created materialized view: audit_logs_15m");
    }

    // 1-hour rollup
    const hourViewExists = await this.viewExists(
      client,
      database,
      "audit_logs_1h",
    );
    if (!hourViewExists) {
      await client.command({
        query: `
          CREATE MATERIALIZED VIEW ${database}.audit_logs_1h
          ENGINE = SummingMergeTree()
          PARTITION BY toYYYYMM(hour)
          ORDER BY (hour, event_type, result, organization_id)
          AS SELECT
            toStartOfHour(timestamp) AS hour,
            event_type,
            result,
            organization_id,
            tenant_id,
            count() AS count
          FROM ${database}.audit_logs
          GROUP BY hour, event_type, result, organization_id, tenant_id
        `,
      });
      this.log("Created materialized view: audit_logs_1h");
    }

    // 6-hour rollup
    const sixHourViewExists = await this.viewExists(
      client,
      database,
      "audit_logs_6h",
    );
    if (!sixHourViewExists) {
      await client.command({
        query: `
          CREATE MATERIALIZED VIEW ${database}.audit_logs_6h
          ENGINE = SummingMergeTree()
          PARTITION BY toYYYYMM(six_hours)
          ORDER BY (six_hours, event_type, result, organization_id)
          AS SELECT
            toStartOfInterval(timestamp, INTERVAL 6 HOUR) AS six_hours,
            event_type,
            result,
            organization_id,
            tenant_id,
            count() AS count
          FROM ${database}.audit_logs
          GROUP BY six_hours, event_type, result, organization_id, tenant_id
        `,
      });
      this.log("Created materialized view: audit_logs_6h");
    }

    this.log("Audit logs interval views created");
  }

  async down(client: ClickHouseClient, database: string): Promise<void> {
    this.log("Dropping audit_logs interval views...");
    await this.dropViewIfExists(client, database, "audit_logs_6h");
    await this.dropViewIfExists(client, database, "audit_logs_1h");
    await this.dropViewIfExists(client, database, "audit_logs_15m");
    await this.dropViewIfExists(client, database, "audit_logs_5m");
    this.log("Audit logs interval views dropped");
  }
}
