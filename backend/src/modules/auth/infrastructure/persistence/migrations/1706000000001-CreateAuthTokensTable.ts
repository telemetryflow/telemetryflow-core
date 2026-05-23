/**
 * Auth Migration: Create Auth Tokens Table
 * Timestamp: 1706000000001 (Auth module range)
 *
 * Stores authentication tokens including:
 * - Refresh tokens (for session management)
 * - Email verification tokens (for registration)
 * - Password reset tokens (for forgot password flow)
 * - MFA session tokens
 */

import { QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class CreateAuthTokensTable1706000000001 extends BaseMigration {
  name = "CreateAuthTokensTable1706000000001";
  moduleName = "auth";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Creating auth_tokens table...");

    // Create token type enum
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_token_type') THEN
          CREATE TYPE auth_token_type AS ENUM (
            'refresh',
            'email_verification',
            'password_reset',
            'mfa_session',
            'recovery_email_verification'
          );
        END IF;
      END
      $$;
    `);

    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "auth_tokens",
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
            name: "token_type",
            type: "auth_token_type",
            isNullable: false,
          },
          {
            name: "token_hash",
            type: "varchar",
            length: "255",
            isNullable: false,
          },
          {
            name: "device_info",
            type: "jsonb",
            isNullable: true,
          },
          {
            name: "ip_address",
            type: "varchar",
            length: "45",
            isNullable: true,
          },
          {
            name: "user_agent",
            type: "varchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "expires_at",
            type: "timestamp",
            isNullable: false,
          },
          {
            name: "used_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "revoked_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "revoked_reason",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      "auth_tokens",
      new TableForeignKey({
        name: "FK_auth_tokens_user",
        columnNames: ["user_id"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // Indexes
    await this.createIndexIfNotExists(
      queryRunner,
      "auth_tokens",
      new TableIndex({
        name: "IDX_auth_tokens_user_id",
        columnNames: ["user_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "auth_tokens",
      new TableIndex({
        name: "IDX_auth_tokens_token_hash",
        columnNames: ["token_hash"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "auth_tokens",
      new TableIndex({
        name: "IDX_auth_tokens_type_user",
        columnNames: ["token_type", "user_id"],
      }),
    );

    // Add comment
    await queryRunner.query(`
      COMMENT ON TABLE "auth_tokens" IS 'Stores authentication tokens for refresh, verification, and password reset flows'
    `);

    this.log("Auth tokens table created successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Dropping auth_tokens table...");
    await queryRunner.dropTable("auth_tokens", true, true, true);
    await queryRunner.query(`DROP TYPE IF EXISTS auth_token_type`);
    this.log("Auth tokens table dropped");
  }
}
