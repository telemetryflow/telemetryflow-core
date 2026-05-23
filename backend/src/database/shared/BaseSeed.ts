/**
 * Base class for PostgreSQL seeds using TypeORM
 *
 * Provides common utilities for seeds:
 * - Record existence checks
 * - Idempotent insert helpers
 * - Dependency declaration
 * - Logging with module context
 */

import { DataSource, Repository } from "typeorm";
import type { PostgresSeed } from "./interfaces";

export abstract class BaseSeed implements PostgresSeed {
  /** Seed identifier name */
  abstract name: string;

  /** Module that owns this seed */
  abstract moduleName: string;

  /** Execution order within module (1-99) */
  abstract order: number;

  /** Other seeds that must run first (by name) */
  dependencies: string[] = [];

  abstract run(dataSource: DataSource): Promise<void>;

  // =========================================================================
  // Utility Methods
  // =========================================================================

  /**
   * Check if a record exists by condition
   */
  protected async recordExists(
    dataSource: DataSource,
    table: string,
    condition: Record<string, unknown>,
  ): Promise<boolean> {
    const where = Object.entries(condition)
      .map(([key], index) => `"${key}" = $${index + 1}`)
      .join(" AND ");
    const values = Object.values(condition);

    const result = await dataSource.query(
      `SELECT EXISTS (SELECT 1 FROM "${table}" WHERE ${where})`,
      values,
    );
    return result[0].exists;
  }

  /**
   * Get a record by condition, returns null if not found
   */
  protected async findRecord<T>(
    dataSource: DataSource,
    table: string,
    condition: Record<string, unknown>,
  ): Promise<T | null> {
    const where = Object.entries(condition)
      .map(([key], index) => `"${key}" = $${index + 1}`)
      .join(" AND ");
    const values = Object.values(condition);

    const result = await dataSource.query(
      `SELECT * FROM "${table}" WHERE ${where} LIMIT 1`,
      values,
    );
    return result[0] || null;
  }

  /**
   * Insert a record if it doesn't exist (idempotent)
   * Returns true if inserted, false if already exists
   */
  protected async insertIfNotExists(
    dataSource: DataSource,
    table: string,
    data: Record<string, unknown>,
    uniqueKey: string | string[],
  ): Promise<boolean> {
    const keys = Array.isArray(uniqueKey) ? uniqueKey : [uniqueKey];
    const condition: Record<string, unknown> = {};
    keys.forEach((key) => {
      condition[key] = data[key];
    });

    const exists = await this.recordExists(dataSource, table, condition);
    if (exists) {
      return false;
    }

    const columns = Object.keys(data)
      .map((k) => `"${k}"`)
      .join(", ");
    const placeholders = Object.keys(data)
      .map((_, i) => `$${i + 1}`)
      .join(", ");
    const values = Object.values(data);

    await dataSource.query(
      `INSERT INTO "${table}" (${columns}) VALUES (${placeholders})`,
      values,
    );
    return true;
  }

  /**
   * Upsert a record (insert or update)
   */
  protected async upsert(
    dataSource: DataSource,
    table: string,
    data: Record<string, unknown>,
    conflictKeys: string[],
  ): Promise<void> {
    const columns = Object.keys(data);
    const columnNames = columns.map((k) => `"${k}"`).join(", ");
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
    const values = Object.values(data);

    const updateSet = columns
      .filter((k) => !conflictKeys.includes(k))
      .map((k) => `"${k}" = EXCLUDED."${k}"`)
      .join(", ");

    const conflictCols = conflictKeys.map((k) => `"${k}"`).join(", ");

    await dataSource.query(
      `
      INSERT INTO "${table}" (${columnNames})
      VALUES (${placeholders})
      ON CONFLICT (${conflictCols}) DO UPDATE SET ${updateSet}
    `,
      values,
    );
  }

  /**
   * Get repository for an entity
   */
  protected getRepository<T extends object>(
    dataSource: DataSource,
    entity: new () => T,
  ): Repository<T> {
    return dataSource.getRepository(entity);
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
   * Log a skip message (record already exists)
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
