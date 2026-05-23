/**
 * Base class for PostgreSQL migrations using TypeORM
 *
 * Provides common utilities for migrations:
 * - Table existence checks
 * - Column existence checks
 * - Index existence checks
 * - Logging with module context
 */

import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
  TableColumn,
} from "typeorm";
import type { PostgresMigration } from "./interfaces";

export abstract class BaseMigration
  implements MigrationInterface, PostgresMigration
{
  /** Migration class name (must match class name exactly) */
  abstract name: string;

  /** Module that owns this migration */
  abstract moduleName: string;

  /** Timestamp identifier extracted from class name */
  get timestamp(): number {
    const match = this.name.match(/(\d{13})$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  abstract up(queryRunner: QueryRunner): Promise<void>;
  abstract down(queryRunner: QueryRunner): Promise<void>;

  // =========================================================================
  // Utility Methods
  // =========================================================================

  /**
   * Check if a table exists in the database
   */
  protected async tableExists(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<boolean> {
    const result = await queryRunner.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = $1
      )
    `,
      [tableName],
    );
    return result[0].exists;
  }

  /**
   * Check if a column exists in a table
   */
  protected async columnExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<boolean> {
    const result = await queryRunner.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
      )
    `,
      [tableName, columnName],
    );
    return result[0].exists;
  }

  /**
   * Check if an index exists
   */
  protected async indexExists(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
  ): Promise<boolean> {
    const result = await queryRunner.query(
      `
      SELECT EXISTS (
        SELECT FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = $1
        AND indexname = $2
      )
    `,
      [tableName, indexName],
    );
    return result[0].exists;
  }

  /**
   * Check if a foreign key constraint exists
   */
  protected async foreignKeyExists(
    queryRunner: QueryRunner,
    tableName: string,
    constraintName: string,
  ): Promise<boolean> {
    const result = await queryRunner.query(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.table_constraints
        WHERE table_schema = 'public'
        AND table_name = $1
        AND constraint_name = $2
        AND constraint_type = 'FOREIGN KEY'
      )
    `,
      [tableName, constraintName],
    );
    return result[0].exists;
  }

  /**
   * Safely create a table if it doesn't exist
   */
  protected async createTableIfNotExists(
    queryRunner: QueryRunner,
    table: Table,
  ): Promise<void> {
    const exists = await this.tableExists(queryRunner, table.name);
    if (!exists) {
      await queryRunner.createTable(table, true);
      this.log(`Created table: ${table.name}`);
    } else {
      this.log(`Table already exists: ${table.name}`);
    }
  }

  /**
   * Safely add a column if it doesn't exist
   */
  protected async addColumnIfNotExists(
    queryRunner: QueryRunner,
    tableName: string,
    column: TableColumn,
  ): Promise<void> {
    const exists = await this.columnExists(queryRunner, tableName, column.name);
    if (!exists) {
      await queryRunner.addColumn(tableName, column);
      this.log(`Added column: ${tableName}.${column.name}`);
    } else {
      this.log(`Column already exists: ${tableName}.${column.name}`);
    }
  }

  /**
   * Safely create an index if it doesn't exist
   */
  protected async createIndexIfNotExists(
    queryRunner: QueryRunner,
    tableName: string,
    index: TableIndex,
  ): Promise<void> {
    const exists = await this.indexExists(
      queryRunner,
      tableName,
      index.name || "",
    );
    if (!exists) {
      await queryRunner.createIndex(tableName, index);
      this.log(`Created index: ${index.name}`);
    } else {
      this.log(`Index already exists: ${index.name}`);
    }
  }

  /**
   * Safely create a foreign key if it doesn't exist
   */
  protected async createForeignKeyIfNotExists(
    queryRunner: QueryRunner,
    tableName: string,
    foreignKey: TableForeignKey,
  ): Promise<void> {
    const exists = await this.foreignKeyExists(
      queryRunner,
      tableName,
      foreignKey.name || "",
    );
    if (!exists) {
      await queryRunner.createForeignKey(tableName, foreignKey);
      this.log(`Created foreign key: ${foreignKey.name}`);
    } else {
      this.log(`Foreign key already exists: ${foreignKey.name}`);
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
