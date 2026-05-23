/**
 * Auth Migration: Create Known Devices Table
 * Timestamp: 1706000000003 (Auth module range)
 *
 * Stores known/trusted devices for:
 * - Device fingerprinting and recognition
 * - New device login alerts
 * - Skip MFA on trusted devices
 * - Security auditing
 */

import { QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class CreateKnownDevicesTable1706000000003 extends BaseMigration {
  name = "CreateKnownDevicesTable1706000000003";
  moduleName = "auth";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Creating known_devices table...");

    await this.createTableIfNotExists(
      queryRunner,
      new Table({
        name: "known_devices",
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
            name: "device_fingerprint",
            type: "varchar",
            length: "255",
            isNullable: false,
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
            name: "is_trusted",
            type: "boolean",
            default: false,
          },
          {
            name: "trust_expires_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "last_ip_address",
            type: "varchar",
            length: "45",
            isNullable: true,
          },
          {
            name: "last_location",
            type: "jsonb",
            isNullable: true,
          },
          {
            name: "login_count",
            type: "integer",
            default: 1,
          },
          {
            name: "first_seen_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "last_seen_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
    );

    await this.createForeignKeyIfNotExists(
      queryRunner,
      "known_devices",
      new TableForeignKey({
        name: "FK_known_devices_user",
        columnNames: ["user_id"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    // Indexes
    await this.createIndexIfNotExists(
      queryRunner,
      "known_devices",
      new TableIndex({
        name: "IDX_known_devices_user_id",
        columnNames: ["user_id"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "known_devices",
      new TableIndex({
        name: "IDX_known_devices_fingerprint",
        columnNames: ["device_fingerprint"],
      }),
    );

    await this.createIndexIfNotExists(
      queryRunner,
      "known_devices",
      new TableIndex({
        name: "IDX_known_devices_user_fingerprint",
        columnNames: ["user_id", "device_fingerprint"],
        isUnique: true,
      }),
    );

    // Add comment
    await queryRunner.query(`
      COMMENT ON TABLE "known_devices" IS 'Stores known/trusted devices for security and MFA bypass'
    `);

    this.log("Known devices table created successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Dropping known_devices table...");
    await queryRunner.dropTable("known_devices", true, true, true);
    this.log("Known devices table dropped");
  }
}
