/**
 * IAM Migration: Add User Registration Columns
 * Timestamp: 1700000000016 (IAM module range)
 *
 * Adds email_verified_at and profile_completed_at to support
 * self-service registration flow with email verification.
 */

import { QueryRunner, TableColumn } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class AddUserRegistrationColumns1700000000016 extends BaseMigration {
  name = "AddUserRegistrationColumns1700000000016";
  moduleName = "iam";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Adding registration columns to users table...");

    const table = await queryRunner.getTable("users");
    if (!table) {
      this.log("Users table not found, skipping");
      return;
    }

    if (!table.findColumnByName("email_verified_at")) {
      await queryRunner.addColumn(
        "users",
        new TableColumn({
          name: "email_verified_at",
          type: "timestamp",
          isNullable: true,
        }),
      );
    }

    if (!table.findColumnByName("profile_completed_at")) {
      await queryRunner.addColumn(
        "users",
        new TableColumn({
          name: "profile_completed_at",
          type: "timestamp",
          isNullable: true,
        }),
      );
    }

    this.log("Registration columns added to users table");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Removing registration columns from users table...");
    await queryRunner.dropColumn("users", "profile_completed_at");
    await queryRunner.dropColumn("users", "email_verified_at");
    this.log("Registration columns removed from users table");
  }
}
