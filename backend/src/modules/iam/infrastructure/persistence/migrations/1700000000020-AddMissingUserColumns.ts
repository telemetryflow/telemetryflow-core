/**
 * IAM Migration: Add Missing User Columns
 * Timestamp: 1700000000020 (IAM module range)
 *
 * Adds columns present in UserEntity that were never included in prior migrations:
 * - isOrganizationCreator (boolean, default false)
 *
 * Note: mfa_failure_count and mfa_locked_until are handled by auth module
 * migration 1706000000005-AddMfaFailureTracking.
 */

import { QueryRunner, TableColumn } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class AddMissingUserColumns1700000000020 extends BaseMigration {
  name = "AddMissingUserColumns1700000000020";
  moduleName = "iam";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Adding missing columns to users table...");

    const table = await queryRunner.getTable("users");
    if (!table) {
      this.log("Users table not found, skipping");
      return;
    }

    if (!table.findColumnByName("isOrganizationCreator")) {
      await queryRunner.addColumn(
        "users",
        new TableColumn({
          name: "isOrganizationCreator",
          type: "boolean",
          default: false,
        }),
      );
    }

    this.log("Missing user columns added successfully");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Removing missing user columns...");
    const table = await queryRunner.getTable("users");
    if (!table) return;

    if (table.findColumnByName("isOrganizationCreator")) {
      await queryRunner.dropColumn("users", "isOrganizationCreator");
    }

    this.log("Missing user columns removed");
  }
}
