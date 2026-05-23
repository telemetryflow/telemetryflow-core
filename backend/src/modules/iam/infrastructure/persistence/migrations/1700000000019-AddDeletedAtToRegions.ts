/**
 * IAM Migration: Add deleted_at column to regions table
 * Timestamp: 1700000000019 (IAM module range)
 */

import { QueryRunner, TableColumn } from "typeorm";
import { BaseMigration } from "../../../../../database/shared/BaseMigration";

export class AddDeletedAtToRegions1700000000019 extends BaseMigration {
  name = "AddDeletedAtToRegions1700000000019";
  moduleName = "iam";

  async up(queryRunner: QueryRunner): Promise<void> {
    this.log("Adding deleted_at column to regions table...");

    const table = await queryRunner.getTable("regions");
    if (table && !table.findColumnByName("deleted_at")) {
      await queryRunner.addColumn(
        "regions",
        new TableColumn({
          name: "deleted_at",
          type: "timestamp",
          isNullable: true,
        }),
      );
      this.log("deleted_at column added to regions table");
    } else {
      this.log("deleted_at column already exists in regions table, skipping");
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    this.log("Removing deleted_at column from regions table...");
    await queryRunner.dropColumn("regions", "deleted_at");
    this.log("deleted_at column removed from regions table");
  }
}
