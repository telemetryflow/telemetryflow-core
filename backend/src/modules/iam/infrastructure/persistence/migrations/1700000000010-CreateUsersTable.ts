/**
 * IAM Migration: Create Users Table
 * Timestamp: 1700000000010 (IAM module range)
 */

import { QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class CreateUsersTable1700000000010 extends BaseMigration {
  name = "CreateUsersTable1700000000010";
  moduleName = "iam";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Creating users table...");

    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "users",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "email",
            type: "varchar",
            length: "255",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "password",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "firstName",
            type: "varchar",
            length: "100",
            isNullable: false,
          },
          {
            name: "lastName",
            type: "varchar",
            length: "100",
            isNullable: false,
          },
          {
            name: "avatar",
            type: "varchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "timezone",
            type: "varchar",
            length: "50",
            default: "'UTC'",
          },
          {
            name: "locale",
            type: "varchar",
            length: "10",
            default: "'en-US'",
          },
          // Organization context
          {
            name: "organization_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "tenant_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "group_user_id",
            type: "uuid",
            isNullable: true,
          },
          // Account status
          {
            name: "isActive",
            type: "boolean",
            default: true,
          },
          {
            name: "emailVerified",
            type: "boolean",
            default: false,
          },
          // MFA fields
          {
            name: "mfa_enabled",
            type: "boolean",
            default: false,
          },
          {
            name: "mfa_secret",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "mfa_backup_codes",
            type: "jsonb",
            isNullable: true,
          },
          {
            name: "mfa_enrolled_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "mfa_last_used_at",
            type: "timestamp",
            isNullable: true,
          },
          // Password management
          {
            name: "passwordHistory",
            type: "jsonb",
            default: "'[]'",
          },
          {
            name: "passwordChangedAt",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "force_password_change",
            type: "boolean",
            default: false,
          },
          {
            name: "password_change_reason",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          // Login tracking
          {
            name: "lastLoginAt",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "loginCount",
            type: "integer",
            default: 0,
          },
          {
            name: "failedLoginAttempts",
            type: "integer",
            default: 0,
          },
          {
            name: "lockedUntil",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "lastFailedLoginAt",
            type: "timestamp",
            isNullable: true,
          },
          // Recovery email
          {
            name: "recovery_email",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "recovery_email_verified_at",
            type: "timestamp",
            isNullable: true,
          },
          // Timestamps
          {
            name: "createdAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "deletedAt",
            type: "timestamp",
            isNullable: true,
          },
        ],
      }),
    );

    // Foreign keys
    await this.createForeignKeyIfNotExists(
      queryRunner,
      "users",
      new TableForeignKey({
        name: "FK_users_organization",
        columnNames: ["organization_id"],
        referencedTableName: "organizations",
        referencedColumnNames: ["organization_id"],
        onDelete: "SET NULL",
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      "users",
      new TableForeignKey({
        name: "FK_users_tenant",
        columnNames: ["tenant_id"],
        referencedTableName: "tenants",
        referencedColumnNames: ["tenant_id"],
        onDelete: "SET NULL",
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      "users",
      new TableForeignKey({
        name: "FK_users_group",
        columnNames: ["group_user_id"],
        referencedTableName: "groups",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
    );

    // Indexes
    await this.createIndexIfNotExists(
      queryRunner,
      "users",
      new TableIndex({
        name: "IDX_users_email_deletedAt",
        columnNames: ["email", "deletedAt"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "users",
      new TableIndex({
        name: "IDX_users_organization",
        columnNames: ["organization_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "users",
      new TableIndex({
        name: "IDX_users_tenant",
        columnNames: ["tenant_id"],
      }),
    );

    this.log("Users table created successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Dropping users table...");
    await queryRunner.dropTable("users", true, true, true);
    this.log("Users table dropped");
  }
}
