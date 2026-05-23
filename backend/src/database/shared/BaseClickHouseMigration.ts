/**
 * Base class for ClickHouse migrations
 *
 * Provides common utilities for ClickHouse migrations:
 * - Table existence checks
 * - Database existence checks
 * - Logging with module context
 */

import { ClickHouseClient } from "@clickhouse/client";
import type { ClickHouseMigration } from "./interfaces";

export abstract class BaseClickHouseMigration implements ClickHouseMigration {
  /** Migration class name (must match class name exactly) */
  abstract name: string;

  /** Module that owns this migration */
  abstract moduleName: string;

  /** Timestamp identifier extracted from class name */
  get timestamp(): number {
    const match = this.name.match(/(\d{13})$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  abstract up(client: ClickHouseClient, database: string): Promise<void>;
  abstract down(client: ClickHouseClient, database: string): Promise<void>;

  // =========================================================================
  // Utility Methods
  // =========================================================================

  /**
   * Check if a database exists
   */
  protected async databaseExists(
    client: ClickHouseClient,
    database: string,
  ): Promise<boolean> {
    const result = await client.query({
      query: `SELECT count() as count FROM system.databases WHERE name = '${database}'`,
      format: "JSONEachRow",
    });
    const data = (await result.json()) as Array<{ count: string }>;
    return parseInt(data[0]?.count || "0", 10) > 0;
  }

  /**
   * Check if a table exists in the database
   */
  protected async tableExists(
    client: ClickHouseClient,
    database: string,
    tableName: string,
  ): Promise<boolean> {
    const result = await client.query({
      query: `SELECT count() as count FROM system.tables WHERE database = '${database}' AND name = '${tableName}'`,
      format: "JSONEachRow",
    });
    const data = (await result.json()) as Array<{ count: string }>;
    return parseInt(data[0]?.count || "0", 10) > 0;
  }

  /**
   * Check if a column exists in a table
   */
  protected async columnExists(
    client: ClickHouseClient,
    database: string,
    tableName: string,
    columnName: string,
  ): Promise<boolean> {
    const result = await client.query({
      query: `SELECT count() as count FROM system.columns WHERE database = '${database}' AND table = '${tableName}' AND name = '${columnName}'`,
      format: "JSONEachRow",
    });
    const data = (await result.json()) as Array<{ count: string }>;
    return parseInt(data[0]?.count || "0", 10) > 0;
  }

  /**
   * Check if a view exists in the database
   */
  protected async viewExists(
    client: ClickHouseClient,
    database: string,
    viewName: string,
  ): Promise<boolean> {
    const result = await client.query({
      query: `SELECT count() as count FROM system.tables WHERE database = '${database}' AND name = '${viewName}' AND engine LIKE '%View%'`,
      format: "JSONEachRow",
    });
    const data = (await result.json()) as Array<{ count: string }>;
    return parseInt(data[0]?.count || "0", 10) > 0;
  }

  /**
   * Safely create database if not exists
   */
  protected async createDatabaseIfNotExists(
    client: ClickHouseClient,
    database: string,
  ): Promise<void> {
    await client.command({
      query: `CREATE DATABASE IF NOT EXISTS ${database}`,
    });
    this.log(`Database ready: ${database}`);
  }

  /**
   * Safely create a table if it doesn't exist
   */
  protected async createTableIfNotExists(
    client: ClickHouseClient,
    database: string,
    tableName: string,
    createQuery: string,
  ): Promise<void> {
    const exists = await this.tableExists(client, database, tableName);
    if (!exists) {
      await client.command({ query: createQuery });
      this.log(`Created table: ${database}.${tableName}`);
    } else {
      this.log(`Table already exists: ${database}.${tableName}`);
    }
  }

  /**
   * Safely drop a table if it exists
   */
  protected async dropTableIfExists(
    client: ClickHouseClient,
    database: string,
    tableName: string,
  ): Promise<void> {
    const exists = await this.tableExists(client, database, tableName);
    if (exists) {
      await client.command({
        query: `DROP TABLE IF EXISTS ${database}.${tableName}`,
      });
      this.log(`Dropped table: ${database}.${tableName}`);
    }
  }

  /**
   * Safely drop a view if it exists
   */
  protected async dropViewIfExists(
    client: ClickHouseClient,
    database: string,
    viewName: string,
  ): Promise<void> {
    const exists = await this.viewExists(client, database, viewName);
    if (exists) {
      await client.command({
        query: `DROP VIEW IF EXISTS ${database}.${viewName}`,
      });
      this.log(`Dropped view: ${database}.${viewName}`);
    }
  }

  /**
   * Add a column to a table if it doesn't exist
   */
  protected async addColumnIfNotExists(
    client: ClickHouseClient,
    database: string,
    tableName: string,
    columnName: string,
    columnDef: string,
  ): Promise<void> {
    const exists = await this.columnExists(
      client,
      database,
      tableName,
      columnName,
    );
    if (!exists) {
      await client.command({
        query: `ALTER TABLE ${database}.${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${columnDef}`,
      });
      this.log(`Added column: ${database}.${tableName}.${columnName}`);
    } else {
      this.log(`Column already exists: ${database}.${tableName}.${columnName}`);
    }
  }

  /**
   * Log a message with module context
   */
  protected log(message: string): void {
    console.log(`   [${this.moduleName}] ${message}`);
  }

  /**
   * Log an error with module context
   */
  protected logError(message: string, error?: unknown): void {
    console.error(`   [${this.moduleName}] ERROR: ${message}`);
    if (error) {
      console.error(`   ${error}`);
    }
  }
}
