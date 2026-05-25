/**
 * Base class for ClickHouse seeds
 *
 * Provides common utilities for ClickHouse seeds:
 * - Record existence checks
 * - Batch insert helpers
 * - Logging with module context
 */

import { ClickHouseClient } from "@clickhouse/client";
import { DataSource } from "typeorm";
import { randomUUID } from "crypto";
import type { ClickHouseSeed } from "./interfaces";

export interface ResolvedTenantIds {
  organizationId: string;
  workspaceId: string;
  tenantId: string;
}

export abstract class BaseClickHouseSeed implements ClickHouseSeed {
  /** Seed identifier name */
  abstract name: string;

  /** Module that owns this seed */
  abstract moduleName: string;

  /** Execution order within module (1-99) */
  abstract order: number;

  /** Other seeds that must run first (by name) */
  dependencies: string[] = [];

  abstract run(client: ClickHouseClient, database: string): Promise<void>;

  // =========================================================================
  // Utility Methods
  // =========================================================================

  /**
   * Check if any records exist in a table
   */
  protected async hasRecords(
    client: ClickHouseClient,
    database: string,
    table: string,
  ): Promise<boolean> {
    const result = await client.query({
      query: `SELECT count() as count FROM ${database}.${table} LIMIT 1`,
      format: "JSONEachRow",
    });
    const data = (await result.json()) as Array<{ count: string }>;
    return parseInt(data[0]?.count || "0", 10) > 0;
  }

  /**
   * Count records in a table
   */
  protected async countRecords(
    client: ClickHouseClient,
    database: string,
    table: string,
    condition?: string,
  ): Promise<number> {
    const whereClause = condition ? ` WHERE ${condition}` : "";
    const result = await client.query({
      query: `SELECT count() as count FROM ${database}.${table}${whereClause}`,
      format: "JSONEachRow",
    });
    const data = (await result.json()) as Array<{ count: string }>;
    return parseInt(data[0]?.count || "0", 10);
  }

  /**
   * Insert records in batch
   * Uses ClickHouse's native batch insert for better performance
   */
  protected async insertBatch<T extends Record<string, unknown>>(
    client: ClickHouseClient,
    database: string,
    table: string,
    records: T[],
  ): Promise<void> {
    if (records.length === 0) return;

    await client.insert({
      table: `${database}.${table}`,
      values: records,
      format: "JSONEachRow",
    });

    this.log(`Inserted ${records.length} records into ${table}`);
  }

  /**
   * Insert a single record
   */
  protected async insertOne<T extends Record<string, unknown>>(
    client: ClickHouseClient,
    database: string,
    table: string,
    record: T,
  ): Promise<void> {
    await this.insertBatch(client, database, table, [record]);
  }

  /**
   * Truncate table (delete all records)
   */
  protected async truncateTable(
    client: ClickHouseClient,
    database: string,
    table: string,
  ): Promise<void> {
    await client.command({
      query: `TRUNCATE TABLE IF EXISTS ${database}.${table}`,
    });
    this.log(`Truncated table: ${table}`);
  }

  /**
   * Delete records matching condition
   */
  protected async deleteWhere(
    client: ClickHouseClient,
    database: string,
    table: string,
    condition: string,
  ): Promise<void> {
    await client.command({
      query: `ALTER TABLE ${database}.${table} DELETE WHERE ${condition}`,
    });
    this.log(`Deleted records from ${table} where ${condition}`);
  }

  /**
   * Resolve real organization/workspace/tenant UUIDs from PostgreSQL.
   * This ensures ClickHouse seed data uses the same IDs as PostgreSQL,
   * so queries from authenticated users (whose JWT contains PG UUIDs) match.
   */
  protected async resolvePostgresIds(): Promise<ResolvedTenantIds> {
    const pgDataSource = new DataSource({
      type: "postgres",
      host: process.env.POSTGRES_HOST || "localhost",
      port: parseInt(process.env.POSTGRES_PORT || "5432"),
      username: process.env.POSTGRES_USERNAME || "postgres",
      password: process.env.POSTGRES_PASSWORD || "postgres",
      database: process.env.POSTGRES_DB || "telemetryflow_db",
    });

    try {
      await pgDataSource.initialize();

      const [org] = await pgDataSource.query(
        `SELECT organization_id FROM organizations WHERE code = 'DEVOPSCORNER' LIMIT 1`,
      );
      const [workspace] = await pgDataSource.query(
        `SELECT workspace_id FROM workspaces WHERE code = 'TELEMETRYFLOW-POC' LIMIT 1`,
      );
      const [tenant] = await pgDataSource.query(
        `SELECT tenant_id FROM tenants WHERE code = 'DEVOPSCORNER' LIMIT 1`,
      );

      return {
        organizationId: org?.organization_id || "",
        workspaceId: workspace?.workspace_id || "",
        tenantId: tenant?.tenant_id || "",
      };
    } finally {
      if (pgDataSource.isInitialized) {
        await pgDataSource.destroy();
      }
    }
  }

  /**
   * Generate a UUID v4
   */
  protected generateUUID(): string {
    return randomUUID();
  }

  /**
   * Log a message with module context
   */
  protected log(message: string): void {
    console.log(`      [${this.moduleName}:${this.name}] ${message}`);
  }

  /**
   * Log a success message
   */
  protected logSuccess(message: string): void {
    console.log(`      [${this.moduleName}:${this.name}] ✓ ${message}`);
  }

  /**
   * Log a skip message
   */
  protected logSkip(message: string): void {
    console.log(`      [${this.moduleName}:${this.name}] ○ ${message}`);
  }

  /**
   * Log an error with module context
   */
  protected logError(message: string, error?: unknown): void {
    console.error(`      [${this.moduleName}:${this.name}] ✗ ${message}`);
    if (error) {
      console.error(`      ${error}`);
    }
  }
}
