/**
 * Auth Migration: Create User Sessions Table
 * Timestamp: 1706000000002 (Auth module range)
 *
 * Tracks active user sessions for:
 * - Session management and visibility
 * - "Keep me logged in" functionality
 * - Security auditing (where users are logged in)
 * - Remote session termination
 */

import { QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class CreateUserSessionsTable1706000000002 extends BaseMigration {
  name = "CreateUserSessionsTable1706000000002";
  moduleName = "auth";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Creating user_sessions table...");

    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "user_sessions",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "user_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "session_token",
            type: "varchar",
            length: "255",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "device_name",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "device_type",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "browser",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "browser_version",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "os",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "os_version",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "ip_address",
            type: "varchar",
            length: "45",
            isNullable: true,
          },
          {
            name: "location",
            type: "jsonb",
            isNullable: true,
          },
          {
            name: "remember_me",
            type: "boolean",
            default: false,
          },
          {
            name: "is_current",
            type: "boolean",
            default: false,
          },
          {
            name: "last_activity_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "expires_at",
            type: "timestamp",
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "terminated_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "terminated_reason",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
        ],
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      "user_sessions",
      new TableForeignKey({
        name: "FK_user_sessions_user",
        columnNames: ["user_id"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // Indexes
    await this.createIndexIfNotExists(
      queryRunner,
      "user_sessions",
      new TableIndex({
        name: "IDX_user_sessions_user_id",
        columnNames: ["user_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "user_sessions",
      new TableIndex({
        name: "IDX_user_sessions_token",
        columnNames: ["session_token"],
      }),
    );

    // Add comment
    await queryRunner.query(`
      COMMENT ON TABLE "user_sessions" IS 'Tracks active user sessions for session management and security auditing'
    `);

    this.log("User sessions table created successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Dropping user_sessions table...");
    await queryRunner.dropTable("user_sessions", true, true, true);
    this.log("User sessions table dropped");
  }
}
